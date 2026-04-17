"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { lineTotal } from "@/lib/cart-math";
import { validateDiscount } from "@/lib/discounts";
import { useCartStore } from "@/store/cart-store";
import { CartItem } from "@/types";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CartClientComponent({
  isAuthenticated,
  locationId,
  userId,
}: {
  isAuthenticated: boolean;
  locationId: string;
  userId: string;
}) {
  const {
    items,
    updateQuantity,
    removeItem,
    total,
    clearCart,
    itemCount,
    couponCode,
    setCouponCode,
    appliedDiscount,
    applyDiscount,
    clearDiscount,
  } = useCartStore();

  const router = useRouter();

  const [applying, setApplying] = useState(false);

  const subtotal = total();

  const discountAmount = useMemo(() => {
    if (!appliedDiscount?.valid) return 0;
    const n = Number(appliedDiscount.amountOff);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [appliedDiscount]);

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to continue");
      router.push("/login");
      return;
    }
    router.push("/checkout");
  };

  const handleApplyCoupon = async () => {
    if (!locationId) return toast.error("Select a location first");
    const code = couponCode.trim();
    if (!code) return toast.error("Enter a coupon code");

    setApplying(true);
    try {
      const res = await validateDiscount({
        locationId: locationId,
        code,
        orderType: "delivery", // you can infer this from user selection if you have it
        orderSource: "online",
        subtotal: subtotal.toFixed(2),
        customerId: userId,
      });

      if (!res.valid) {
        clearDiscount();
        toast.error(res.message);
        return;
      }

      applyDiscount({
        valid: true,
        code,
        discountId: res.discountId,
        discountType: res.discountType,
        value: res.value,
        amountOff: res.amountOff,
        message: res.message,
      });

      toast.success(res.message || `Coupon applied: -${res.amountOff}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply coupon");
    } finally {
      setApplying(false);
    }
  };

  const handleClearCoupon = () => {
    clearDiscount();
    toast("Coupon cleared");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add some delicious items to get started
          </p>
          <Button asChild className="rounded-xl">
            <Link href="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: CartItem) => (
              <div
                key={item.lineId}
                className="flex gap-4 p-4 rounded-xl border bg-card"
              >
                {item.menuItem.imageUrl ? (
                  <Image
                    height={96}
                    width={96}
                    src={item.menuItem.imageUrl ?? ""}
                    alt={item.menuItem.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <Skeleton className="h-24 w-24 rounded-lg object-cover" />
                )}

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/item/${item.menuItem.id}`}
                    className="font-display font-semibold hover:text-primary transition-colors"
                  >
                    {item.menuItem.name}
                  </Link>

                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {item.menuItem.description}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.lineId, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.lineId, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-primary">
                        ${lineTotal(item).toFixed(2)}
                      </span>

                      {item.modifiers.length > 0 && (
                        <ul className="text-xs text-muted-foreground mt-1">
                          {item.modifiers.map((m) => (
                            <li key={m.modifierId}>
                              {m.name ?? m.modifierId}
                              {(m.quantity ?? 1) > 1 ? ` ×${m.quantity}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          removeItem(item.lineId);
                          toast("Item removed");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                clearCart();
                toast("Cart cleared");
              }}
            >
              Clear Cart
            </Button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-card p-6 sticky top-24 space-y-4">
              <h2 className="font-display text-xl font-bold">Order Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({itemCount()} items)
                  </span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {appliedDiscount?.valid ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount ({appliedDiscount.code})
                    </span>
                    <span className="text-success">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="text-success">Free</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        // typing changes the code => previous applied discount no longer reliable
                        if (appliedDiscount?.valid) clearDiscount();
                      }}
                      className="pl-9 text-sm"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={applying}
                  >
                    {applying ? "Applying..." : "Apply"}
                  </Button>
                </div>

                {appliedDiscount?.valid ? (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{appliedDiscount.message}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleClearCoupon}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="border-t pt-4 flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>

              <Button
                size="lg"
                className="w-full rounded-xl gap-2"
                onClick={handleCheckout}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
