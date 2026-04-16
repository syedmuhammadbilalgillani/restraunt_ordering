import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
// import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllMenuCategoriesByLocation,
  getAllMenuItemsByCategory,
} from "@/lib/api";
// import { categories } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronRight, Clock, Truck, Utensils } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";

export default async function HomePage() {
  const cookieStore = await cookies();
  const locationId = cookieStore.get(LOCATION_ID_COOKIE_KEY)?.value;

  // console.log(locationId, "locationId");
  // if (!locationId) {
  //   return (
  //     <div className="min-h-screen">
  //       <div className="container py-20 text-center text-muted-foreground">
  //         <p className="text-lg">Please select a location first.</p>
  //       </div>
  //     </div>
  //   );
  // }
  const menuCategories = await getAllMenuCategoriesByLocation({
    locationId: locationId || undefined,
  });
  const menuItems = await getAllMenuItemsByCategory({
    params: {
      locationId: locationId || undefined,
      limit: 20,
      featured: true,
    },
  });

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
          <Suspense
            fallback={Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 mt-2" />
                </CardContent>
              </Card>
            ))}
          >
            {menuCategories?.categories?.map((cat) => (
              <Link
                href={`/menu/category/${cat.slug}`}
                key={cat.id}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-md transition-all hover:-translate-y-1">
                  <CardContent className="p-3 text-center">
                    <div className="aspect-square rounded-lg overflow-hidden mb-2">
                      {cat?.imageUrl ? (
                        <Image
                          height={142}
                          width={142}
                          src={cat?.imageUrl || ""}
                          alt={cat.name}
                          loading="lazy"
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Skeleton className="aspect-square rounded-lg" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {/* {cat.itemCount} items */}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Suspense>
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
          <Suspense
            fallback={Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-4/3" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          >
            {menuItems?.data?.items?.length > 0 ? (
              menuItems?.data?.items?.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground col-span-full">
                <p className="text-lg">No items found</p>
                {/* <p className="text-sm mt-1">Try a different search or category</p> */}
              </div>
            )}
          </Suspense>
        </div>
      </section>
    </div>
  );
}
