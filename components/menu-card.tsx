"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/cart-store";
import { Item } from "@/types";
import { Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

interface MenuCardProps {
  item: Item;
}

export function MenuCard({ item }: MenuCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const itemName = item.name;
  const itemDescription = item.description;
  const itemImage = item.imageUrl;
  const itemPrice = item.basePrice;
  const itemId = item.id;
  const itemSlug = item.slug;
  const handleAdd = (e: React.MouseEvent) => {
    // if (!canAddToCart) return;
    e.preventDefault();
    e.stopPropagation();
    console.log(item, "item");
    addItem({ menuItem: item, quantity: 1, modifiers: [] });
    toast.success(`${itemName} added to cart`);
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
        {/* {item.tags && item.tags.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )} */}
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
            {"sku" in item ? (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />{" "}
                {item.sku}
              </span>
            ) : null}
          </div>
          {/* {canAddToCart ? ( */}
          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleAdd}
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
