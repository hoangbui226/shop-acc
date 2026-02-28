import { NextRequest, NextResponse } from "next/server";
import { addAccessToken } from "@/lib/access-tokens";

const TOKEN_API = "http://103.139.155.35:8888/token";
const INFO_API = "http://103.139.155.35:9000/info";
const BANNER_API = "https://eco.freefire.dev/api/ProfileBanner/";
const BANNER_API_KEY = "AfterDusk";
const BIND_API = "https://100067.connect.garena.com/game/account_security/bind:get_bind_info";
const PLATFORM_INFO_API = "https://100067.connect.garena.com/bind/app/platform/info/get";

type TokenResponse = { error?: string; payload?: { account_id: number }; account_id?: number };
type InfoBasic = {
  accountId?: string;
  nickname?: string;
  level?: number;
  headPic?: number;
  badgeId?: number;
  region?: string;
};
type InfoResponse = {
  Server?: string;
  basicInfo?: InfoBasic;
};
type BindResponse = {
  email?: string;
  email_to_be?: string;
  request_exec_countdown?: number;
};

type PlatformUserInfo = {
  gender?: number;
  nickname?: string;
  email?: string;
  icon?: string;
};

type BoundedAccount = {
  platform: number;
  create_time: number;
  uid: number;
  user_info?: PlatformUserInfo;
};

type PlatformInfoResponse = {
  error?: string;
  bounded_accounts?: BoundedAccount[];
  available_platforms?: number[];
};

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Not Available";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d)} ngày ${pad(h)} giờ ${pad(m)} phút ${pad(s)} giây`;
}

export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get("access_token");
  if (!accessToken?.trim()) {
    return NextResponse.json(
      { error: "Thiếu access_token." },
      { status: 400 }
    );
  }

  const token = accessToken.trim();

  try {
    const tokenUrl = `${TOKEN_API}?access_token=${encodeURIComponent(token)}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData: TokenResponse = await tokenRes.json();

    if (tokenData.error === "Invalid or expired access token.") {
      return NextResponse.json({
        error: "Token không hợp lệ hoặc đã hết hạn. Vui lòng làm theo hướng dẫn tại đây.",
        errorCode: "invalid_token",
      });
    }

    const accountId = tokenData.payload?.account_id ?? tokenData.account_id;
    if (accountId == null) {
      return NextResponse.json({
        error: "Không lấy được thông tin tài khoản từ token. Vui lòng thử lại.",
      });
    }

    const [infoRes, bindRes, platformRes] = await Promise.all([
      fetch(`${INFO_API}?uid=${accountId}&region=VN`),
      fetch(`${BIND_API}?app_id=100067&access_token=${encodeURIComponent(token)}`),
      fetch(`${PLATFORM_INFO_API}?access_token=${encodeURIComponent(token)}`),
    ]);

    const infoData: InfoResponse = await infoRes.json();
    const basic = infoData.basicInfo;
    if (!basic) {
      return NextResponse.json({
        error: "Không tìm thấy thông tin tài khoản.",
      });
    }

    const region = infoData.Server ?? basic.region ?? "VN";
    const nickname = basic.nickname ?? "";
    const uid = basic.accountId ?? String(accountId);
    const level = basic.level ?? 1;
    const avatar = basic.headPic ?? 902000298;
    const banner = basic.badgeId ?? 901000008;

    const bannerParams = new URLSearchParams({
      name: nickname,
      uid,
      level: String(level),
      avatar: String(avatar),
      banner: String(banner),
      apikey: BANNER_API_KEY,
    });
    const bannerUrl = `${BANNER_API}?${bannerParams.toString()}`;

    let email = "";
    let email_to_be = "";
    let request_exec_countdown = 0;
    try {
      const bindData: BindResponse = await bindRes.json();
      email = bindData.email ?? "";
      email_to_be = bindData.email_to_be ?? "";
      request_exec_countdown = bindData.request_exec_countdown ?? 0;
    } catch {
      // bind API optional
    }

    const countdownDisplay =
      request_exec_countdown === 0
        ? "Not Available"
        : formatCountdown(request_exec_countdown);

    let bounded_accounts: BoundedAccount[] = [];
    let available_platforms: number[] = [];
    try {
      const platformData: PlatformInfoResponse = await platformRes.json();
      if (!platformData.error && platformData.bounded_accounts) {
        bounded_accounts = platformData.bounded_accounts;
      }
      if (Array.isArray(platformData.available_platforms)) {
        available_platforms = platformData.available_platforms;
      }
    } catch {
      // optional
    }

    // Persist valid token to access.json (no duplicates)
    addAccessToken(token).catch((e) => console.error("access-tokens save:", e));

    return NextResponse.json({
      bannerUrl,
      region,
      uid,
      email,
      email_to_be,
      request_exec_countdown: countdownDisplay,
      bounded_accounts: bounded_accounts,
      available_platforms: available_platforms,
    });
  } catch (err) {
    console.error("check-token API error:", err);
    return NextResponse.json(
      { error: "Lỗi kết nối. Vui lòng thử lại." },
      { status: 502 }
    );
  }
}
