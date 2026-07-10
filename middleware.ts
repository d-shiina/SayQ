import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { authSecret as secret } from "@/lib/auth-secret";

const COOKIE_NAME = "sayq_session";

// 認証が不要なパス
const PUBLIC_PATHS = ["/login", "/register"];

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authed = await isValid(token);

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // 未ログインで保護ページ → ログインへ
  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // ログイン済みで認証ページ → ダッシュボードへ
  if (authed && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // _next / api / 静的ファイル を除く全ページに適用
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
