"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getAuthSnapshot,
  listMyAddressesAction,
  type AuthSnapshot,
} from "@/lib/iron-session/auth/auth.actions";
import { quoteCartServer, type NestQuoteResponse, updateCartContextServer } from "@/lib/cart/cart.server";
import { syncCartToServer } from "@/lib/cart/cart.client";
import { submitCheckout } from "@/lib/cart/cart.checkout";
import { useCartStore } from "@/lib/cart/cart.store";
import type { CustomerAddress } from "@/lib/customer-auth";
import { ArrowLeft, Loader2 } from "lucide-react";

type Fulfillment = "takeaway" | "delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const [auth, setAuth] = useState<AuthSnapshot | null>(null);
  const [quote, setQuote] = useState<NestQuoteResponse | null>(null);
  const [pending, startTransition] = useTransition();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("takeaway");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [kitchenNotes, setKitchenNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await getAuthSnapshot();
      if (!cancelled) setAuth(snap);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lines.length) {
      router.replace("/cart");
    }
  }, [lines.length, router]);

  useEffect(() => {
    if (!lines.length) return;
    let cancelled = false;
    startTransition(async () => {
      try {
        const latest = useCartStore.getState().lines;
        await syncCartToServer(latest);
        await updateCartContextServer({
          orderType: fulfillment,
          ...(fulfillment === "delivery" && deliveryAddressId
            ? { deliveryAddressId }
            : {}),
        });
        const q = await quoteCartServer();
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setQuote(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lines, fulfillment, deliveryAddressId]);

  useEffect(() => {
    if (fulfillment !== "delivery" || !auth?.authenticated) return;
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await listMyAddressesAction();
        const list = res.addresses ?? [];
        if (cancelled) return;
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0] ?? null;
        if (def?.id) setDeliveryAddressId(def.id);
      } catch {
        if (!cancelled) setAddresses([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fulfillment, auth?.authenticated]);

  const placeOrder = () => {
    if (!quote) {
      toast.error("Still loading totals — try again in a moment.");
      return;
    }
    if (fulfillment === "delivery") {
      if (!auth?.authenticated) {
        toast.error("Please sign in to place a delivery order.");
        return;
      }
      if (!deliveryAddressId) {
        toast.error("Please select a delivery address.");
        return;
      }
    }
    startTransition(async () => {
      try {
        const order = await submitCheckout({
          clientTotal: quote.total,
          customerNotes: customerNotes.trim() || undefined,
          kitchenNotes: kitchenNotes.trim() || undefined,
          ...(!auth?.authenticated
            ? {
                guestName: guestName.trim() || undefined,
                guestPhone: guestPhone.trim() || undefined,
              }
            : {}),
        });
        toast.success("Order placed!");
        const q = new URLSearchParams({
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
        });
        router.replace(`/checkout/success?${q.toString()}`);
      } catch {
        /* toast in submitCheckout */
      }
    });
  };

  if (!lines.length) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-10">
      <Button variant="ghost" className="gap-2 mb-6" asChild>
        <Link href="/cart">
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {auth?.authenticated
          ? `Signed in as ${auth.user?.name ?? "customer"}. Your order will be linked to your account.`
          : "Guest checkout — add contact details so the restaurant can reach you if needed."}
      </p>

      {!auth?.authenticated ? (
        <Card className="mt-4 rounded-2xl border-dashed">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Have an account?</p>
            <p className="text-xs text-muted-foreground">
              Sign in to save your order history and speed up future orders. You can also continue as a guest below.
            </p>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link href={`/login?returnUrl=${encodeURIComponent("/checkout")}`}>
                Sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6 rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="font-semibold">Order type</p>
            <RadioGroup
              value={fulfillment}
              onValueChange={(v) => setFulfillment((v as Fulfillment) ?? "takeaway")}
              className="gap-3"
            >
              <div className="flex items-center gap-2 rounded-xl border p-3">
                <RadioGroupItem value="takeaway" id="takeaway" />
                <Label className="mb-0 text-sm" htmlFor="takeaway">
                  Takeaway
                </Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label className="mb-0 text-sm" htmlFor="delivery">
                  Delivery
                </Label>
              </div>
            </RadioGroup>
            {fulfillment === "delivery" && !auth?.authenticated ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">Delivery requires sign in</p>
                  <p className="text-xs text-muted-foreground">
                    Please sign in to select a saved delivery address.
                  </p>
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <Link href={`/login?returnUrl=${encodeURIComponent("/checkout")}`}>
                      Sign in
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}
            {fulfillment === "delivery" && auth?.authenticated ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Delivery address</p>
                <div className="space-y-2">
                  {addresses.length ? (
                    <div className="grid gap-2">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setDeliveryAddressId(a.id)}
                          disabled={pending}
                          className={`text-left rounded-xl border p-3 transition ${
                            deliveryAddressId === a.id ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {a.label ?? "Address"}
                            </span>
                            {a.isDefault ? (
                              <span className="text-[10px] text-muted-foreground">Default</span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {[a.addressLine1, a.city].filter(Boolean).join(", ")}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                      No addresses found. Add one in{" "}
                      <Link className="underline" href="/profile/addresses">
                        Profile → Addresses
                      </Link>
                      .
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <p className="font-semibold">Order total</p>
            {quote ? (
              <p className="text-2xl font-bold mt-1">
                {quote.currency} {quote.total}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
              </p>
            )}
          </div>

          {!auth?.authenticated ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Your name (optional)</label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="e.g. Ali Khan"
                  disabled={pending}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Phone (optional)</label>
                <Input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="rounded-xl mt-1"
                  placeholder="03xx…"
                  disabled={pending}
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-xs text-muted-foreground">Notes for the restaurant</label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="rounded-xl mt-1 min-h-[80px]"
              placeholder="Allergies, pickup instructions, etc."
              disabled={pending}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Kitchen notes (optional)</label>
            <Textarea
              value={kitchenNotes}
              onChange={(e) => setKitchenNotes(e.target.value)}
              className="rounded-xl mt-1 min-h-[60px]"
              disabled={pending}
            />
          </div>

          <Button
            className="w-full rounded-xl"
            size="lg"
            disabled={pending || !quote}
            onClick={placeOrder}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Placing order…
              </>
            ) : (
              "Place order"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
