import { createApiClient } from "@/lib/apiClient";
import { TENANT_ID } from "@/constants";

const proxyClient = createApiClient();

export type DeliveryQuoteResponse =
  | {
      serviceable: false;
      deliveryZoneId: null;
      deliveryFee: null;
      minOrderAmount: null;
      freeDeliveryAbove: null;
      estimatedMinMinutes: null;
      estimatedMaxMinutes: null;
    }
  | {
      serviceable: true;
      meetsMinimum: boolean;
      deliveryZoneId: string;
      deliveryFee: string;
      minOrderAmount: string | null;
      freeDeliveryAbove: string | null;
      estimatedMinMinutes: number | null;
      estimatedMaxMinutes: number | null;
    };

export async function getDeliveryQuote(args: {
  locationId: string;
  latitude: number;
  longitude: number;
  subtotal?: string;
}) {
  const res = await proxyClient.post<DeliveryQuoteResponse>(
    "/api/proxy/delivery-zones/quote",
    args as unknown as Record<string, unknown>,
    { headers: { "x-tenant-id": TENANT_ID } },
  );
  return res.data;
}