"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
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
import { useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart, itemCount } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [coupon, setCoupon] = useState("");

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to continue");
      router.push("/login");
      return;
    }
    router.push("/checkout");
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
            {items.map((item: CartItem, index: number) => (
              <div
                key={`${item.menuItem.id}-${index}`}
                className="flex gap-4 p-4 rounded-xl border bg-card"
              >
                <Image
                  height={96}
                  width={96}
                  src={item.menuItem.imageUrl ?? ""}
                  alt={item.menuItem.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
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
                          updateQuantity(item.menuItem.id, item.quantity - 1)
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
                          updateQuantity(item.menuItem.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-primary">
                        ${(item.menuItem.basePrice * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          removeItem(item.menuItem.id);
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
                  <span>${total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="text-success">Free</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast("Coupon applied! (UI only)")}
                >
                  Apply
                </Button>
              </div>

              <div className="border-t pt-4 flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${total().toFixed(2)}</span>
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
