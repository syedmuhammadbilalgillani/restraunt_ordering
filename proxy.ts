import { NextResponse, type NextRequest } from "next/server";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";

const PUBLIC_PATH_PREFIXES = [
  "/select-location",
  "/api/set-location",
  "/api/clear-location",
  "/api/auth", // if you have auth endpoints
];

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // allow Next internals + assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|webp|svg|css|js|map|ico)$/)
  ) {
    return NextResponse.next();
  }

  // allow public paths
  if (PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // optional deep-link support: ?location=uuid
  const qLocation = searchParams.get("location");
  if (qLocation) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/set-location";
    url.searchParams.set("locationId", qLocation);
    url.searchParams.set("returnTo", req.nextUrl.pathname + "?" + req.nextUrl.searchParams.toString());
    return NextResponse.redirect(url);
  }

  const locationId = req.cookies.get(LOCATION_ID_COOKIE_KEY)?.value;
  if (!locationId) {
    const url = req.nextUrl.clone();
    url.pathname = "/select-location";
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/proxy).*)"], // adjust: include api/proxy if those calls must require location
};