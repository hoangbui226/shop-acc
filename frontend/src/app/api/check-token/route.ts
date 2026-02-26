import { NextRequest, NextResponse } from "next/server";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type TokenResponse = { error?: string; payload?: { account_id: number } };
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
    const tokenApi = getEnv("TOKEN_API");
    const tokenRes = await fetch(
      `${tokenApi}?access_token=${encodeURIComponent(token)}`
    );
    const tokenData: TokenResponse = await tokenRes.json();

    if (tokenData.error === "Invalid or expired access token.") {
      return NextResponse.json({
        error: "Token không hợp lệ hoặc đã hết hạn. Vui lòng làm theo hướng dẫn tại đây.",
        errorCode: "invalid_token",
      });
    }

    const accountId = tokenData.payload?.account_id;
    if (accountId == null) {
      return NextResponse.json({
        error: "Không lấy được thông tin tài khoản từ token. Vui lòng thử lại.",
      });
    }

    const infoApi = getEnv("INFO_API");
    const bindApi = getEnv("BIND_API");
    const platformInfoApi = getEnv("PLATFORM_INFO_API");
    const [infoRes, bindRes, platformRes] = await Promise.all([
      fetch(`${infoApi}?uid=${accountId}&region=VN`),
      fetch(
        `${bindApi}?app_id=100067&access_token=${encodeURIComponent(token)}`
      ),
      fetch(
        `${platformInfoApi}?access_token=${encodeURIComponent(token)}`
      ),
    ]);

    const infoData: InfoResponse = await infoRes.json();
    const basic = infoData.basicInfo;
    if (!basic) {
      return NextResponse.json({
        error: "Không tìm thấy thông tin tài khoản.",
      });
    }

    const region =
      infoData.Server ?? basic.region ?? "VN";
    const nickname = basic.nickname ?? "";
    const uid = basic.accountId ?? String(accountId);
    const level = basic.level ?? 1;
    const avatar = basic.headPic ?? 902000298;
    const banner = basic.badgeId ?? 901000008;

    const bannerApi = getEnv("BANNER_API");
    const bannerApiKey = getEnv("BANNER_API_KEY");
    const bannerParams = new URLSearchParams({
      name: nickname,
      uid,
      level: String(level),
      avatar: String(avatar),
      banner: String(banner),
      apikey: bannerApiKey,
    });
    const bannerUrl = `${bannerApi}?${bannerParams.toString()}`;

    let email = "";
    let email_to_be = "";
    let request_exec_countdown = 0;
    try {
      const bindData: BindResponse = await bindRes.json();
      email = bindData.email ?? "";
      email_to_be = bindData.email_to_be ?? "";
      request_exec_countdown = bindData.request_exec_countdown ?? 0;
    } catch {
      // bind API optional; keep defaults
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
