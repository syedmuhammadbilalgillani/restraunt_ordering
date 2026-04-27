"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/cart/cart.store";
import { Loader2 } from "lucide-react";

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const orderNumber = searchParams.get("orderNumber") ?? "";
  const total = searchParams.get("total") ?? "";

  useEffect(() => {
    useCartStore.getState().clear();
  }, []);

  return (
    <div className="container max-w-lg py-16 text-center">
      <Card className="rounded-2xl">
        <CardContent className="p-8 space-y-4">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Thank you!
          </p>
          <h1 className="text-2xl font-bold tracking-tight">We received your order</h1>
          {orderNumber ? (
            <p className="text-muted-foreground">
              Order number:{" "}
              <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
            </p>
          ) : null}
          {total ? (
            <p className="text-muted-foreground">
              Total: <span className="font-semibold text-foreground">PKR {total}</span>
            </p>
          ) : null}
          {id ? (
            <p className="text-xs text-muted-foreground break-all">Reference: {id}</p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button className="rounded-xl" asChild>
              <Link href="/menu">Back to menu</Link>
            </Button>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/cart">View cart</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
