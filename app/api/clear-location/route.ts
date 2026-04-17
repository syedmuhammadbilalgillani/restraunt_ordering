import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: LOCATION_ID_COOKIE_KEY,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ success: true });
}