import type { User } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getCustomerMe,
  listCustomerAddresses,
  loginCustomer,
  logoutCustomer,
  otpVerify,
  registerCustomer,
  updateCustomerMe,
  type Customer,
} from "@/lib/customer-auth";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;

  /** Address UUID for backend deliveryAddressId usage */
  defaultAddressId: string | null;

  bootstrap: () => Promise<void>;

  signup: (
    fullName: string,
    email: string,
    phone: string,
    password?: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtpVerify: (args: { email?: string; phone?: string; otp: string }) => Promise<void>;

  logout: () => Promise<void>;

  /** Local + remote update */
  updateProfile: (data: Partial<User>) => Promise<void>;
};

function mapCustomerToUser(customer: Customer): User {
  return {
    id: customer.id,
    name:
      customer.fullName?.trim() ||
      customer.email?.split("@")[0] ||
      customer.phone ||
      "Customer",
    email: customer.email ?? "",
    phone: customer.phone ?? undefined,
  };
}

async function setAuthCookies(args: { accessToken: string; refreshToken: string; customer?: { id: string; email?: string | null } }) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    let msg = "Failed to create session";
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}

async function clearAuthCookies() {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      defaultAddressId: null,

      bootstrap: async () => {
        if (get().isBootstrapping) return;
        set({ isBootstrapping: true });

        try {
          const me = await getCustomerMe({ silent: true });
          if (!me) {
            set({ user: null, isAuthenticated: false, defaultAddressId: null });
            return;
          }

          const user = mapCustomerToUser(me.customer);

          const addr = await listCustomerAddresses({ silent: true });
          const def =
            addr?.addresses?.find((a) => a.isDefault) ??
            addr?.addresses?.[0] ??
            null;

          set({
            user,
            isAuthenticated: true,
            defaultAddressId: def?.id ?? null,
          });
        } finally {
          set({ isBootstrapping: false });
        }
      },

      signup: async (fullName, email, phone, password) => {
        await registerCustomer({
          phone,
          fullName: fullName.trim() ? fullName.trim() : undefined,
          email: email.trim() ? email.trim() : undefined,
          password: password?.trim() ? password.trim() : undefined,
        });

        // Registration does not log in by default in your backend
        await get().bootstrap();
      },

      login: async (email, password) => {
        const res = await loginCustomer({ email, password });

        // Expected new login shape:
        // { customer: Customer, accessToken: string, refreshToken: string }
        const anyRes = res as unknown as {
          customer: Customer;
          accessToken: string;
          refreshToken: string;
        };

        if (!anyRes?.accessToken || !anyRes?.refreshToken) {
          throw new Error("Login response missing tokens");
        }

        await setAuthCookies({
          accessToken: anyRes.accessToken,
          refreshToken: anyRes.refreshToken,
          customer: {
            id: anyRes.customer.id,
            email: anyRes.customer.email,
          },
        });

        set({ user: mapCustomerToUser(anyRes.customer), isAuthenticated: true });
        await get().bootstrap(); // populate defaultAddressId
      },

      loginWithOtpVerify: async ({ email, phone, otp }) => {
        // NOTE: your current otpVerify() returns only { customer } (no tokens).
        // If your backend now returns tokens for OTP verify too, update the lib method
        // and then call setAuthCookies(...) here just like login().
        await otpVerify({
          purpose: "login",
          otp,
          email: email?.trim() ? email.trim() : undefined,
          phone: phone?.trim() ? phone.trim() : undefined,
        });
        await get().bootstrap();
      },

      logout: async () => {
        try {
          await logoutCustomer();
        } catch {
          // ignore
        }

        try {
          await clearAuthCookies();
        } catch {
          // ignore
        }

        set({ user: null, isAuthenticated: false, defaultAddressId: null });
      },

      updateProfile: async (data) => {
        // Update backend if relevant fields exist
        const fullName = typeof data.name === "string" ? data.name.trim() : undefined;

        try {
          if (fullName) {
            const res = await updateCustomerMe({ fullName });
            const nextUser = mapCustomerToUser(res.customer);
            set({ user: { ...get().user, ...nextUser } as User });
            return;
          }
        } catch {
          // If backend update fails, still update locally to avoid breaking UX
        }

        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: "foodhub-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        defaultAddressId: state.defaultAddressId,
      }),
    },
  ),
);