import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACCESS_COOKIE = "fh_at";
const REFRESH_COOKIE = "fh_rt";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    accessToken: string;
    refreshToken: string;
    customer?: { id: string; email?: string | null };
  };

  const cookieStore = await cookies();

  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_COOKIE, body.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  cookieStore.set(REFRESH_COOKIE, body.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const at = cookieStore.get(ACCESS_COOKIE)?.value;
  const rt = cookieStore.get(REFRESH_COOKIE)?.value;

  return NextResponse.json({
    hasAccessToken: Boolean(at),
    hasRefreshToken: Boolean(rt),
    authenticated: Boolean(at), // use access token only for "authed UI" gating
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}