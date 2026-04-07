"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMenuItem, fetchMenuItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuCard } from "@/components/menu-card";
import { useCartStore } from "@/store/cart-store";
import { useState } from "react";
import { Minus, Plus, ArrowLeft, Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: item, isLoading } = useQuery({
    queryKey: ["menuItem", id],
    queryFn: () => fetchMenuItem(id!),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ["related", item?.categoryId],
    queryFn: () => fetchMenuItems(item?.categoryId),
    enabled: !!item?.categoryId,
  });

  const relatedItems = related?.filter((i) => i.id !== id).slice(0, 3);

  const handleAddToCart = () => {
    if (!item) return;
    for (let i = 0; i < quantity; i++) addItem(item);
    toast.success(`${quantity}x ${item.name} added to cart`);
    setQuantity(1);
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground text-lg">Item not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate.push("/menu")}
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Button
          variant="ghost"
          className="gap-2 mb-6"
          onClick={() => navigate.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={item.image}
              alt={item.name}
              className="object-cover w-full aspect-square"
            />
          </div>

          <div className="flex flex-col">
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-2 mb-3">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <h1 className="font-display text-3xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />{" "}
                {item.rating}
              </span>
              {item.calories && <span>{item.calories} cal</span>}
            </div>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              {item.description}
            </p>

            <div className="mt-8">
              <span className="font-display text-4xl font-bold text-primary">
                ${item.price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-3 border rounded-xl px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-display font-bold text-lg w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1 rounded-xl gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart · ${(item.price * quantity).toFixed(2)}
              </Button>
            </div>
          </div>
        </div>

        {relatedItems && relatedItems.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map((ri) => (
                <MenuCard key={ri.id} item={ri} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
