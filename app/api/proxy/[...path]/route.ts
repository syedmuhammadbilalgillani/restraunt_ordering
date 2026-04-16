import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, TENANT_ID } from "@/constants";

const ACCESS_COOKIE = "fh_at";

async function handler(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;

  const url = new URL(req.url);
  const target = new URL(`${API_URL.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = url.search; // forward querystring

  const headers = new Headers(req.headers);
  headers.set("x-tenant-id", TENANT_ID);
  headers.delete("host");

  
  // IMPORTANT: set Bearer token from HttpOnly cookie
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // If you don't want cookies forwarded to backend, remove them:
  const joinedPath = path.join("/");
  // backend refresh path is: /api/v1/customer-auth/refresh
  const isCustomerRefresh =
    joinedPath === "api/v1/customer-auth/refresh" ||
    joinedPath.endsWith("/customer-auth/refresh");
  if (!isCustomerRefresh) {
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
