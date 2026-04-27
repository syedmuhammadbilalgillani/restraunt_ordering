"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyPromoToCart,
  removePromoFromCart,
  syncCartToServer,
  type NestQuoteResponse,
} from "@/lib/cart/cart.client";
import { useCartStore } from "@/lib/cart/cart.store";
import { lineTotal } from "@/lib/cart-math";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const [pending, startTransition] = useTransition();
  const [promo, setPromo] = useState("");
  const [serverQuote, setServerQuote] = useState<NestQuoteResponse | null>(null);

  const clientSubtotal = useMemo(() => {
    return lines.reduce((sum, l) => sum + lineTotal(l), 0);
  }, [lines]);

  const pushCart = () => {
    startTransition(async () => {
      try {
        const latest = useCartStore.getState().lines;
        const q = await syncCartToServer(latest);
        setServerQuote(q ?? null);
      } catch {
        setServerQuote(null);
      }
    });
  };

  useEffect(() => {
    if (!lines.length) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const latest = useCartStore.getState().lines;
          if (!latest.length || cancelled) return;
          const q = await syncCartToServer(latest);
          if (!cancelled) setServerQuote(q ?? null);
        } catch {
          if (!cancelled) setServerQuote(null);
        }
      });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [lines]);

  const discountNum = serverQuote
    ? Number.parseFloat(serverQuote.discountAmount)
    : 0;

  const applyPromo = () => {
    const code = promo.trim();
    if (!code) return;
    startTransition(async () => {
      try {
        const latest = useCartStore.getState().lines;
        await syncCartToServer(latest);
        const q = await applyPromoToCart(code);
        setServerQuote(q);
        setPromo("");
        toast.success(`Promo “${q.appliedDiscount?.code ?? code}” applied`);
      } catch {
        /* toast in cart.client */
      }
    });
  };

  const clearPromo = () => {
    startTransition(async () => {
      try {
        const q = await removePromoFromCart();
        setServerQuote(q);
        toast.success("Promo removed");
      } catch {
        /* toast in cart.client */
      }
    });
  };

  if (!lines.length) {
    return (
      <div className="container py-10">
        <Button variant="ghost" className="gap-2 mb-6" asChild>
          <Link href="/menu">
            <ArrowLeft className="h-4 w-4" /> Back to menu
          </Link>
        </Button>
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-muted-foreground mt-2">Add something delicious from the menu.</p>
            <Button className="mt-6 rounded-xl" asChild>
              <Link href="/menu">Browse menu</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Button variant="ghost" className="gap-2" asChild>
          <Link href="/menu">
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={pending}
          onClick={() => {
            clear();
            setServerQuote(null);
            pushCart();
          }}
        >
          Clear cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {lines.map((line) => (
            <Card key={line.lineId} className="rounded-2xl">
              <CardContent className="p-4 flex gap-4">
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  {line.menuItem.imageUrl ? (
                    <Image
                      src={line.menuItem.imageUrl}
                      alt={line.menuItem.name}
                      height={160}
                      width={160}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{line.menuItem.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {line.menuItem.description ?? "—"}
                      </p>
                      {line.modifiers?.length ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {line.modifiers
                            .map((m) =>
                              `${m.name ?? m.modifierId}${m.quantity && m.quantity !== 1 ? ` ×${m.quantity}` : ""}`,
                            )
                            .join(", ")}
                        </div>
                      ) : null}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => {
                        remove(line.lineId);
                        pushCart();
                      }}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full"
                        disabled={pending}
                        onClick={() => {
                          setQuantity(line.lineId, line.quantity - 1);
                          pushCart();
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        value={String(line.quantity)}
                        inputMode="numeric"
                        className="w-14 text-center rounded-xl"
                        onChange={(e) => {
                          const n = Number.parseInt(e.target.value || "0", 10);
                          setQuantity(line.lineId, Number.isFinite(n) ? n : 0);
                        }}
                        onBlur={pushCart}
                        disabled={pending}
                      />

                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full"
                        disabled={pending}
                        onClick={() => {
                          setQuantity(line.lineId, line.quantity + 1);
                          pushCart();
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">PKR {lineTotal(line).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Qty {line.quantity}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Line estimate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="font-semibold">Summary</p>
              <p className="text-xs text-muted-foreground mt-1">
                Totals below use the server quote (location overrides, promos, availability).
              </p>

              {serverQuote ? (
                <>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {serverQuote.currency} {serverQuote.subtotal}
                    </span>
                  </div>
                  {discountNum > 0 ? (
                    <div className="mt-2 flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="font-medium">
                        −{serverQuote.currency} {serverQuote.discountAmount}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tax</span>
                    <span>
                      {serverQuote.currency} {serverQuote.taxAmount}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Delivery</span>
                    <span>
                      {serverQuote.currency} {serverQuote.deliveryFee}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      {serverQuote.currency} {serverQuote.total}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Fetching server totals…</p>
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal (estimate)</span>
                    <span className="font-medium">PKR {clientSubtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {serverQuote?.issues?.length ? (
                <ul className="mt-3 text-xs text-amber-700 dark:text-amber-400 list-disc pl-4 space-y-1">
                  {serverQuote.issues.slice(0, 4).map((issue, i) => (
                    <li key={`${issue.code}-${i}`}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Promo code</p>
                {serverQuote?.appliedDiscount ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium">{serverQuote.appliedDiscount.code}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-destructive"
                      disabled={pending}
                      onClick={clearPromo}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      placeholder="e.g. SAVE10"
                      className="rounded-xl"
                      disabled={pending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyPromo();
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl shrink-0"
                      disabled={pending || !promo.trim()}
                      onClick={applyPromo}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              <Button className="mt-5 w-full rounded-xl" disabled={pending} asChild>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
