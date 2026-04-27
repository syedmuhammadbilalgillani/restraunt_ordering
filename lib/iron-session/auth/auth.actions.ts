"use server";

import { revalidatePath } from "next/cache";
import { attachCartToCustomerServer } from "@/lib/cart/cart.server";
import type { Customer, CustomerAddress } from "@/lib/customer-auth";
import { customerBackendFetch } from "@/lib/customer-backend-fetch";
import { getSession } from "../session";

/** Must match Nest default `REFRESH_COOKIE_NAME` (`customer_refresh_token`). */
const NEST_REFRESH_COOKIE = "customer_refresh_token";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export type AuthSnapshot = {
  authenticated: boolean;
  user: AuthUser | null;
  defaultAddressId: string | null;
};

function mapCustomerToUser(c: Customer): AuthUser {
  return {
    id: c.id,
    name: c.fullName?.trim() || c.email?.split("@")[0] || c.phone || "Customer",
    email: c.email ?? "",
    phone: c.phone ?? undefined,
  };
}

function applyCustomerToSession(
  session: Awaited<ReturnType<typeof getSession>>,
  customer: Customer,
) {
  session.customerId = customer.id;
  session.customerName = mapCustomerToUser(customer).name;
  session.customerEmail = customer.email ?? "";
  session.customerPhone = customer.phone ?? undefined;
  session.isAuthenticated = true;
}

function clearAuthFields(session: Awaited<ReturnType<typeof getSession>>) {
  delete session.accessToken;
  delete session.refreshToken;
  delete session.isAuthenticated;
  delete session.customerId;
  delete session.customerName;
  delete session.customerEmail;
  delete session.customerPhone;
  delete session.defaultAddressId;
}

async function loadDefaultAddressId(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await customerBackendFetch<{ addresses: CustomerAddress[] }>(
      "customer-auth/addresses",
      { method: "GET", bearer: accessToken },
    );
    const list = res?.addresses ?? [];
    const def = list.find((a) => a.isDefault) ?? list[0] ?? null;
    return def?.id ?? null;
  } catch {
    return null;
  }
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const session = await getSession();

  if (!session.accessToken) {
    return { authenticated: false, user: null, defaultAddressId: null };
  }

  // Fast path: login actions already persist these fields on the session.
  if (
    session.customerId &&
    typeof session.customerName === "string" &&
    session.customerName.length > 0
  ) {
    return {
      authenticated: true,
      user: {
        id: session.customerId,
        name: session.customerName,
        email: session.customerEmail ?? "",
        phone: session.customerPhone,
      },
      defaultAddressId: session.defaultAddressId ?? null,
    };
  }

  // Migration / older cookies: derive user from API but do NOT session.save() here
  // (safe from Server Components like `app/layout.tsx`).
  try {
    const me = await customerBackendFetch<{ customer: Customer }>(
      "customer-auth/me",
      { method: "GET", bearer: session.accessToken },
    );

    const user = mapCustomerToUser(me.customer);
    const defaultAddressId =
      (await loadDefaultAddressId(session.accessToken)) ?? null;

    return {
      authenticated: true,
      user,
      defaultAddressId,
    };
  } catch {
    // Do not clear cookies here (requires save). Treat as logged-out UI only.
    // Stale/invalid tokens are cleared by `logoutAction` or the next successful login.
    return { authenticated: false, user: null, defaultAddressId: null };
  }
}

export async function listMyAddressesAction(): Promise<{
  addresses: CustomerAddress[];
}> {
  const session = await getSession();
  if (!session.accessToken) {
    throw new Error("Not signed in");
  }
  const res = await customerBackendFetch<{ addresses: CustomerAddress[] }>(
    "customer-auth/addresses",
    { method: "GET", bearer: session.accessToken },
  );
  return { addresses: res.addresses ?? [] };
}

export async function loginWithPasswordAction(email: string, password: string) {
  try {
    const data = await customerBackendFetch<{
      customer: Customer;
      accessToken: string;
      refreshToken: string;
    }>("customer-auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const session = await getSession();
    session.accessToken = data.accessToken;
    session.refreshToken = data.refreshToken;
    applyCustomerToSession(session, data.customer);
    session.defaultAddressId = await loadDefaultAddressId(data.accessToken);
    await session.save();
    try {
      await attachCartToCustomerServer();
    } catch {
      /* guest cart or attach not applicable */
    }
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Login failed",
    };
  }
}

export async function signupAction(
  fullName: string,
  email: string,
  phone: string,
  password?: string,
) {
  try {
    await customerBackendFetch<{ customerId: string }>(
      "customer-auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          phone,
          fullName: fullName.trim() || undefined,
          email: email.trim() || undefined,
          password: password?.trim() || undefined,
        }),
      },
    );
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Signup failed",
    };
  }
}

export async function loginWithOtpAction(email: string, otp: string) {
  try {
    const data = await customerBackendFetch<{
      customer: Customer;
      accessToken: string;
      refreshToken: string;
    }>("customer-auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({
        purpose: "login",
        email,
        otp,
      }),
    });

    const session = await getSession();
    session.accessToken = data.accessToken;
    session.refreshToken = data.refreshToken;
    applyCustomerToSession(session, data.customer);
    session.defaultAddressId = await loadDefaultAddressId(data.accessToken);
    await session.save();
    try {
      await attachCartToCustomerServer();
    } catch {
      /* guest cart or attach not applicable */
    }
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "OTP login failed",
    };
  }
}

export async function logoutAction() {
  const session = await getSession();
  const at = session.accessToken;
  if (at) {
    try {
      await customerBackendFetch("customer-auth/logout", {
        method: "POST",
        bearer: at,
      });
    } catch {
      // ignore
    }
  }
  clearAuthFields(session);
  await session.save();
  revalidatePath("/", "layout");
}

export async function updateProfileAction(data: {
  name: string;
  email: string;
  phone: string;
  gender: string;
}) {
  const session = await getSession();
  if (!session.accessToken) {
    return { success: false as const, error: "Not signed in" };
  }
  try {
    const res = await customerBackendFetch<{ customer: Customer }>(
      "customer-auth/me",
      {
        method: "PATCH",
        bearer: session.accessToken,
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          gender: data.gender.trim(),
        }),
      },
    );
    applyCustomerToSession(session, res.customer);
    await session.save();
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Update failed",
    };
  }
}
