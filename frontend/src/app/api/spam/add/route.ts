import { NextRequest, NextResponse } from "next/server";

const ADD_BOT_API = "http://103.139.155.35:9090/addbot";

/** GET /api/spam/add?access_token=xxx — proxy to external addbot API. */
export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get("access_token")?.trim();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Thiếu access_token." },
      { status: 400 }
    );
  }

  try {
    const url = `${ADD_BOT_API}?accs=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    const ok = data["1"] === true;
    if (!ok) {
      return NextResponse.json(
        { error: (data["0"] as string) || "Không thêm được bot." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, message: data["0"] });
  } catch (err) {
    console.error("Spam add API error:", err);
    return NextResponse.json(
      { error: "Lỗi kết nối. Vui lòng thử lại." },
      { status: 502 }
    );
  }
}
