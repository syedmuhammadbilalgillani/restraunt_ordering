"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cartToOrderLines, createOnlineOrder } from "@/lib/online-orders";
import { useCartStore } from "@/store/cart-store";
import { CreateOnlineOrderPayload } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Banknote, CreditCard, Store, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  phone: z.string().trim().min(7, "Valid phone number required").max(20),
  address: z.string().trim().min(5, "Address is required").max(200),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutClientComponent({
  isAuthenticated,
  defaultAddressId,
  user,
  locationId,
}: {
  isAuthenticated: boolean;
  defaultAddressId: string;
  user: { name: string; phone: string };
  locationId: string;
}) {
  const { items, total, clearCart, appliedDiscount } = useCartStore();
  const navigate = useRouter();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [loading, setLoading] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate.push("/login");
      return;
    }
    if (items.length === 0) {
      navigate.push("/cart");
      return;
    }
  }, [isAuthenticated, items.length, navigate]);

  const subtotal = total();
  const discount = useMemo(() => {
    if (!appliedDiscount?.valid) return 0;
    const n = Number(appliedDiscount.amountOff);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [appliedDiscount]);

  const grandTotal = Math.max(0, subtotal - discount);

  const onSubmit = async (data: CheckoutForm) => {
    if (!locationId) {
      toast.error("Please select a location first.");
      return;
    }

    if (deliveryType === "delivery" && !defaultAddressId) {
      toast.error(
        "Delivery requires a saved address. Add an address in your profile and set it as default.",
      );
      return;
    }

    setLoading(true);
    try {
      const payload: CreateOnlineOrderPayload = {
        orderType: deliveryType === "delivery" ? "delivery" : "takeaway",
        orderSource: "online",
        lines: cartToOrderLines(items),
        ...(deliveryType === "delivery" && defaultAddressId
          ? { deliveryAddressId: defaultAddressId }
          : {}),
        ...(appliedDiscount?.valid
          ? {
              discountCode: appliedDiscount.code,
              discountId: appliedDiscount.discountId,
            }
          : {}),
        customerNotes: [data.name, data.phone, data.address]
          .filter(Boolean)
          .join(" · "),
        clientTotal: grandTotal.toFixed(2),
      };

      const order = await createOnlineOrder(payload, locationId);

      clearCart();
      toast.success(
        `Order placed${order.orderNumber ? ` #${order.orderNumber}` : ""}!`,
      );
      navigate.push("/orders");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not place order";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || items.length === 0) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="gap-2 mb-6"
          onClick={() => navigate.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-display font-semibold mb-4">
                Delivery Method
              </h2>
              <RadioGroup
                value={deliveryType}
                onValueChange={(v) =>
                  setDeliveryType(v as "delivery" | "pickup")
                }
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="delivery"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    deliveryType === "delivery"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Truck className="h-5 w-5" /> Delivery
                </Label>
                <Label
                  htmlFor="pickup"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    deliveryType === "pickup"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Store className="h-5 w-5" /> Pickup
                </Label>
              </RadioGroup>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-display font-semibold mb-4">Your Details</h2>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                  id="checkout-form"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {deliveryType === "delivery"
                            ? "Delivery Notes / Address"
                            : "Notes"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Address or delivery instructions"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-display font-semibold mb-4">
                Payment Method
              </h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "cash" | "card")}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="cash"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="h-5 w-5" /> Cash
                </Label>

                <Label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5" /> Card
                </Label>
              </RadioGroup>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border bg-card p-6 sticky top-24 space-y-4">
              <h2 className="font-display text-xl font-bold">Order Summary</h2>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.lineId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span>
                      ${(item.menuItem.basePrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {appliedDiscount?.valid ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Discount ({appliedDiscount.code})
                    </span>
                    <span className="text-success">
                      -${discount.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-success">
                    {deliveryType === "pickup" ? "N/A" : "Free"}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>

              <Button
                size="lg"
                className="w-full rounded-xl"
                form="checkout-form"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Placing Order..."
                  : `Place Order · $${grandTotal.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
