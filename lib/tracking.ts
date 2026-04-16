import { createApiClient } from "@/lib/apiClient";
import { TENANT_ID } from "@/constants";

const proxyClient = createApiClient();

export type TrackByTokenResponse = {
  delivery: { status: string; estimatedMinutes: number | null };
  latestLocation: { latitude: string; longitude: string; recordedAt: string } | null;
};

export async function trackDelivery(trackingToken: string) {
  const res = await proxyClient.get<TrackByTokenResponse>(
    `/api/proxy/deliveries/track/${encodeURIComponent(trackingToken)}`,
    { headers: { "x-tenant-id": TENANT_ID } },
  );
  return res.data;
}