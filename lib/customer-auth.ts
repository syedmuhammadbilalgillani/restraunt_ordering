import { API_URL } from "@/constants";
import { createApiClient, type ApiRequestConfig } from "@/lib/apiClient";

const BASE = `${API_URL}/customer-auth`;

// Use same-origin client so browser includes HttpOnly cookies (fh_at/fh_rt)
// and Next proxy can attach `Authorization: Bearer <fh_at>`
const proxyClient = createApiClient();

export type OtpChannel = "sms" | "whatsapp" | "email";
export type OtpPurpose = "login" | "reset";

export type Customer = {
  id: string;
  tenantId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  whatsappOptIn: boolean;
};

export type CustomerAddress = {
  id: string;
  customerId: string;
  tenantId: string;

  label: string | null;
  fullName?: string | null;
  phone?: string | null;

  addressLine1: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  area?: string | null;

  city: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;

  isDefault: boolean;
};

export async function registerCustomer(body: {
  phone: string;
  fullName?: string;
  email?: string;
  password?: string;
}): Promise<{ customerId: string }> {
  const res = await proxyClient.post<{ customerId: string }>(`${BASE}/register`, body);
  return res.data;
}

export async function loginCustomer(body: {
  email: string;
  password: string;
}): Promise<{
  customer: Customer;
  accessToken: string;
  refreshToken: string;
}> {
  const res = await proxyClient.post<{
    customer: Customer;
    accessToken: string;
    refreshToken: string;
  }>(`${BASE}/login`, body);
  return res.data;
}

export async function otpStart(body: {
  channel: OtpChannel;
  purpose: OtpPurpose;
  email?: string;
  phone?: string;
}): Promise<{ ok: true }> {
  const res = await proxyClient.post<{ ok: true }>(`${BASE}/otp/start`, body);
  return res.data;
}

export async function otpVerify(body: {
  purpose: OtpPurpose;
  otp: string;
  email?: string;
  phone?: string;
}): Promise<{
  customer: Customer;
  // If your backend now also returns tokens for OTP login, add them here:
  // accessToken: string;
  // refreshToken: string;
}> {
  const res = await proxyClient.post<{ customer: Customer }>(`${BASE}/otp/verify`, body);
  return res.data;
}

export async function refreshCustomerSession(): Promise<{ ok: true }> {
  const res = await proxyClient.post<{ ok: true }>(`${BASE}/refresh`, null);
  return res.data;
}

export async function logoutCustomer(): Promise<{ ok: true }> {
  const res = await proxyClient.post<{ ok: true }>(`${BASE}/logout`, null);
  return res.data;
}

export async function getCustomerMe(
  config?: Pick<ApiRequestConfig, "silent">,
): Promise<{ customer: Customer } | null> {
  const res = await proxyClient.get<{ customer: Customer }>(`${BASE}/me`, {
    silent: config?.silent,
  });
  return res.data ?? null;
}

export async function updateCustomerMe(body: {
  fullName?: string;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  whatsappOptIn?: boolean;
}): Promise<{ customer: Customer }> {
  const res = await proxyClient.patch<{ customer: Customer }>(`${BASE}/me`, body);
  return res.data;
}

export async function changeCustomerPassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  const res = await proxyClient.post<{ ok: true }>(`${BASE}/password/change`, body);
  return res.data;
}

export async function passwordResetVerifyOtp(body: {
  purpose: "reset";
  otp: string;
  email?: string;
  phone?: string;
}): Promise<{ resetSessionToken: string }> {
  const res = await proxyClient.post<{ resetSessionToken: string }>(
    `${BASE}/password/reset/verify`,
    body,
  );
  return res.data;
}

export async function passwordResetConfirm(body: {
  resetSessionToken: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  const res = await proxyClient.post<{ ok: true }>(`${BASE}/password/reset/confirm`, body);
  return res.data;
}

export async function listCustomerAddresses(
  config?: Pick<ApiRequestConfig, "silent">,
): Promise<{ addresses: CustomerAddress[] } | null> {
  const res = await proxyClient.get<{ addresses: CustomerAddress[] }>(`${BASE}/addresses`, {
    silent: config?.silent,
  });
  return res.data ?? null;
}

export async function createCustomerAddress(body: {
  label?: string;
  fullName?: string;
  phone?: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;

  city: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;

  isDefault?: boolean;
}): Promise<{ address: CustomerAddress }> {
  const res = await proxyClient.post<{ address: CustomerAddress }>(`${BASE}/addresses`, body);
  return res.data;
}

export async function updateCustomerAddress(
  id: string,
  body: Partial<{
    label: string;
    fullName: string;
    phone: string;

    addressLine1: string;
    addressLine2: string;
    landmark: string;
    area: string;

    city: string;
    state: string;
    postalCode: string;
    countryCode: string;

    isDefault: boolean;
  }>,
): Promise<{ address: CustomerAddress }> {
  const res = await proxyClient.patch<{ address: CustomerAddress }>(
    `${BASE}/addresses/${encodeURIComponent(id)}`,
    body,
  );
  return res.data;
}