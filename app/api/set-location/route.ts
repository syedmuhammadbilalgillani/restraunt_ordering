import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
import { API_URL, TENANT_ID } from "@/constants";

async function validateLocation(locationId: string) {
    const res = await fetch(`${API_URL}/locations/${locationId}/validate`, {
      headers: {
        "x-tenant-id": TENANT_ID,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return res.ok;
  }
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { locationId?: string; returnTo?: string };

  const locationId = body?.locationId?.trim();
  const returnTo = body?.returnTo && body.returnTo.startsWith("/") ? body.returnTo : "/";

  if (!TENANT_ID) {
    return NextResponse.json({ success: false, error: "TENANT_ID missing" }, { status: 500 });
  }
  if (!locationId) {
    return NextResponse.json({ success: false, error: "locationId required" }, { status: 400 });
  }

  const ok = await validateLocation(locationId);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Invalid location" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: LOCATION_ID_COOKIE_KEY,
    value: locationId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ success: true, returnTo });
}

// Optional: support GET for deep link redirect style (?locationId=...&returnTo=...)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId")?.trim();
  const returnToRaw = url.searchParams.get("returnTo") ?? "/";
  const returnTo = returnToRaw.startsWith("/") ? returnToRaw : "/";

  if (!locationId) return NextResponse.redirect(new URL("/select-location", url.origin));

  // (Same validation + cookie set as POST)
  const cookieStore = await cookies();
  cookieStore.set({
    name: LOCATION_ID_COOKIE_KEY,
    value: locationId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.redirect(new URL(returnTo, url.origin));
}