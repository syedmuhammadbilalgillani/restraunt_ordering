"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item } from "@/types";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import { useCartStore } from "@/lib/cart/cart.store";
import { syncCartToServer } from "@/lib/cart/cart.client";
import { useTransition } from "react";

interface MenuCardProps {
  item: Item;
}

export function MenuCard({ item }: MenuCardProps) {
  const itemName = item.name;
  const itemDescription = item.description;
  const itemImage = item.imageUrl;
  const itemPrice = item.basePrice;
  const itemSlug = item.slug;
  const add = useCartStore((s) => s.add);
  const [pending, startTransition] = useTransition();
  const handleAdd = (e: React.MouseEvent) => {
    // if (!canAddToCart) return;
    e.preventDefault();
    e.stopPropagation();
    add({ menuItem: item, quantity: 1 });
    toast.success(`${itemName} added to cart`);
    startTransition(async () => {
      // NOTE: use a microtask to ensure Zustand state has applied before reading.
      await Promise.resolve();
      await syncCartToServer(useCartStore.getState().lines);
    });
  };

  const cardContent = (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
      <div className="relative aspect-4/3 overflow-hidden">
        {itemImage ? (
          <Image
            src={itemImage}
            alt={itemName}
            height={469}
            width={352}
            loading="lazy"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500">
            <Skeleton className="aspect-4/3" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-sm leading-tight truncate">
              {itemName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {itemDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-primary">
              ${itemPrice}
            </span>
            {/* {"sku" in item ? (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />{" "}
                {item.sku}
              </span>
            ) : null} */}
          </div>
          {/* {canAddToCart ? ( */}
          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleAdd}
            disabled={pending}
          >
            <Plus className="h-4 w-4" />
          </Button>
          {/* // ) : null} */}
        </div>
      </CardContent>
    </Card>
  );

  if (itemSlug) {
    return <Link href={`/menu/${itemSlug}`}>{cardContent}</Link>;
  }

  return cardContent;
}
