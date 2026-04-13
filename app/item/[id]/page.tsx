import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
import { getAllMenuItemsByCategory, getMenuItemById } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemAddToCart } from "@/components/item-add-to-cart";

type ItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailsPage({ params }: ItemPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locationId = cookieStore.get(LOCATION_ID_COOKIE_KEY)?.value;

  const itemResponse = await getMenuItemById({ id, locationId });
  const item = itemResponse.data;
  console.log(item, "item");
  if (!item) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground text-lg">Item not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/menu">Back to Menu</Link>
        </Button>
      </div>
    );
  }

  const related = await getAllMenuItemsByCategory({
    params: {
      categoryId: item.categoryId,
      locationId: locationId || undefined,
      limit: 6,
      featured: false,
    },
  });
  const relatedItems = related.data.items
    .filter((ri) => ri.id !== id)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Button variant="ghost" className="gap-2 mb-6" asChild>
          <Link href="/menu">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {item.imageUrl ? (
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image
                height={712}
                width={712}
                src={item.imageUrl || ""}
                alt={item.name}
                className="object-cover w-full aspect-square"
              />
            </div>
          ) : (
            <div className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500">
              <Skeleton className="aspect-square" />
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary">{item.menu.name}</Badge>
              <Badge variant="secondary">{item.category.name}</Badge>
              <Badge variant="outline">{item.uom}</Badge>
              {item.isFeatured ? <Badge>Featured</Badge> : null}
            </div>

            <h1 className="font-display text-3xl font-bold">{item.name}</h1>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              {item.description || "No description available."}
            </p>

            <div className="mt-6 space-y-1 text-sm text-muted-foreground">
              <p>SKU: {item.sku}</p>
              <p>Base Price: PKR {item.basePrice}</p>
              {item.discountPrice ? (
                <p>Discount Price: PKR {item.discountPrice}</p>
              ) : null}
              {item.compareAtPrice ? (
                <p>Compare At Price: PKR {item.compareAtPrice}</p>
              ) : null}
              {item.prepTimeSeconds ? (
                <p>Prep Time: {Math.ceil(item.prepTimeSeconds / 60)} min</p>
              ) : null}
            </div>
            {/* {item.modifierGroups && item.modifierGroups.length > 0 ? (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold mb-4">
                  Customize Your Item
                </h2>
                <div className="space-y-4">
                  {item.modifierGroups?.map((group) => (
                    <div key={group.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="font-semibold">{group.name}</h3>
                        <Badge variant="outline">{group.selectionType}</Badge>
                        {group.isRequired ? <Badge>Required</Badge> : null}
                        <Badge variant="secondary">
                          {group.minSelections} - {group.maxSelections}{" "}
                          selections
                        </Badge>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {group.modifiers.map((modifier) => (
                          <div
                            key={modifier.id}
                            className="rounded-lg border border-dashed px-3 py-2 text-sm flex items-center justify-between"
                          >
                            <span>{modifier.name}</span>
                            <span className="text-muted-foreground">
                              +PKR {modifier.priceDelta}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null} */}
            <ItemAddToCart item={item} />

          </div>
        </div>

        {relatedItems.length > 0 ? (
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
        ) : null}
      </div>
    </div>
  );
}
