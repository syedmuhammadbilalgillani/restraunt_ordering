import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { API_URL, TENANT_ID } from "@/constants";
import { sessionOptions, SessionData } from "@/lib/iron-session/session.config";

const NEST_REFRESH_COOKIE = "customer_refresh_token";

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  const rt = session.refreshToken;
  if (!rt) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = `${API_URL.replace(/\/$/, "")}/customer-auth/refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "x-tenant-id": TENANT_ID,
      Cookie: `${NEST_REFRESH_COOKIE}=${encodeURIComponent(rt)}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  session.accessToken = data.accessToken;
  session.refreshToken = data.refreshToken;
  await session.save();

  return NextResponse.json({ ok: true });
}