import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { API_URL, TENANT_ID } from "@/constants";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
import { sessionOptions, SessionData } from "@/lib/iron-session/session.config";

const NEST_REFRESH_COOKIE = "customer_refresh_token";

async function handler(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  const token = session.accessToken;

  const url = new URL(req.url);
  const target = new URL(`${API_URL.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = url.search;

  const headers = new Headers(req.headers);
  headers.set("x-tenant-id", TENANT_ID);
  headers.delete("host");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const locationId = cookieStore.get(LOCATION_ID_COOKIE_KEY)?.value;
  if (locationId) {
    headers.set("x-location-id", locationId);
  }

  const joinedPath = path.join("/");
  const isCustomerRefresh =
    joinedPath === "api/v1/customer-auth/refresh" ||
    joinedPath.endsWith("/customer-auth/refresh");

  if (isCustomerRefresh && session.refreshToken) {
    headers.set(
      "cookie",
      `${NEST_REFRESH_COOKIE}=${encodeURIComponent(session.refreshToken)}`,
    );
  } else if (!isCustomerRefresh) {
    headers.delete("cookie");
  }

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer(),
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;