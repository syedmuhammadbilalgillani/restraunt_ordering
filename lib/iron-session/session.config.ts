import { SessionOptions } from "iron-session";

export interface SessionData {
  locationId?: string;
  locationName?: string;
  locationSlug?: string;
  locationCode?: string;
  locationLongitude?: string;
  locationLatitude?: string;
  userCurrentLatitude?: number;
  userCurrentLongitude?: number;
  userGeoUpdatedAt?: string;

  accessToken?: string;
  refreshToken?: string;
  isAuthenticated?: boolean;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  defaultAddressId?: string | null;

  [key: string]: unknown;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "fh-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
  ttl: 60 * 60 * 24 * 14,
};