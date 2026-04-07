'use client';
import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchMenuItems } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Clock, Truck, Utensils } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: menuItems, isLoading: menuLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: () => fetchMenuItems(),
  });

  const popularItems = menuItems?.filter((i) => i.popular).slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-accent/30 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container relative">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Utensils className="h-4 w-4" />
              Fresh & Delicious
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Craving something <span className="text-primary">delicious?</span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
              Browse our menu and get fresh food delivered to your doorstep in
              minutes. From burgers to sushi, we&apos;ve got it all.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-xl gap-2 text-base h-12 px-8"
                asChild
              >
                <Link href="/menu">
                  Order Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl text-base h-12 px-8"
                asChild
              >
                <Link href="/menu">Browse Menu</Link>
              </Button>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>20-35 min delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span>Free delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                <span>18+ menu items</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Categories</h2>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/menu">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {catLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 mt-2" />
                  </CardContent>
                </Card>
              ))
            : categories?.map((cat) => (
                <Link
                  href={`/menu?category=${cat.id}`}
                  key={cat.id}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-md transition-all hover:-translate-y-1">
                    <CardContent className="p-3 text-center">
                      <div className="aspect-square rounded-lg overflow-hidden mb-2">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          loading="lazy"
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {cat.icon} {cat.name}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {cat.itemCount} items
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Popular Items</h2>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/menu">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-4/3" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))
            : popularItems?.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
        </div>
      </section>
    </div>
  );
}
