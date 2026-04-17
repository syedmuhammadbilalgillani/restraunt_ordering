import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Location } from "@/types";
import { API_URL, TENANT_ID } from "@/constants";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
import { getSession } from "../session";

export async function validateCustomerLocation(
  locationId: string,
): Promise<boolean> {
  if (!TENANT_ID) return false;
  const res = await fetch(
    `${API_URL}/locations/${encodeURIComponent(locationId)}/validate`,
    {
      headers: {
        "x-tenant-id": TENANT_ID,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  return res.ok;
}

const locationCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/** Writes full branch fields into iron-session and mirrors `locationId` into the `l` cookie for API proxy. */
export async function persistCustomerLocation(
  location: Location,
): Promise<boolean> {
  const id = location.id.trim();
  if (!id) return false;
  if (!(await validateCustomerLocation(id))) return false;

  const session = await getSession();
  session.locationId = id;
  session.locationName = location.name;
  session.locationSlug = location.slug;
  session.locationCode = location.code;
  session.locationLongitude = location.longitude;
  session.locationLatitude = location.latitude;
  await session.save();

  // const cookieStore = await cookies();
  // cookieStore.set({
  //   name: LOCATION_ID_COOKIE_KEY,
  //   value: id,
  //   ...locationCookieOptions,
  //   maxAge: 60 * 60 * 24 * 365,
  // });

  revalidatePath("/", "layout");
  revalidatePath("/menu");
  return true;
}

export async function clearCustomerLocation(): Promise<void> {
  const session = await getSession();
  delete session.locationId;
  delete session.locationName;
  delete session.locationSlug;
  delete session.locationCode;
  delete session.locationLongitude;
  delete session.locationLatitude;
  await session.save();

  const cookieStore = await cookies();
  cookieStore.set({
    name: LOCATION_ID_COOKIE_KEY,
    value: "",
    ...locationCookieOptions,
    maxAge: 0,
  });

  revalidatePath("/", "layout");
  revalidatePath("/menu");
}