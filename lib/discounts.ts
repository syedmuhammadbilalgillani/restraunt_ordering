import { createApiClient } from "@/lib/apiClient";
import { TENANT_ID } from "@/constants";

const proxyClient = createApiClient();

export type DiscountValidateResponse =
  | { valid: false; message: string }
  | {
      valid: true;
      discountId: string;
      discountType: string;
      value: string;
      amountOff: string;
      message: string;
    };

export async function validateDiscount(args: {
  locationId: string;
  code: string;
  orderType: "delivery" | "takeaway" | "dine_in";
  orderSource: "online" | "qr" | "kiosk" | "whatsapp" | "group";
  subtotal: string;
  customerId?: string;
}) {
  const res = await proxyClient.post<DiscountValidateResponse>(
    "/api/proxy/discounts/validate",
    args as unknown as Record<string, unknown>,
    {
      headers: { "x-tenant-id": TENANT_ID },
    },
  );
  return res.data;
}