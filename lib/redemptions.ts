import { createApiClient } from "@/lib/apiClient";
import { TENANT_ID } from "@/constants";

const proxyClient = createApiClient();

export type MyRedemptionsResponse = {
  redemptions: Array<{
    id: string;
    redeemedAt: string;
    amountSaved: string;
    orderId: string;
    discountId: string;
    code: string;
  }>;
};

export async function listMyRedemptions(args?: {
  code?: string;
  limit?: number;
}) {
  const res = await proxyClient.get<MyRedemptionsResponse>(
    "/api/proxy/discount-redemptions/me",
    {
      params: { code: args?.code, limit: args?.limit ?? 20 },
      headers: { "x-tenant-id": TENANT_ID },
    },
  );
  return res.data;
}
