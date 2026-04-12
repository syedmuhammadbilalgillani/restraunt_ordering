import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
import { getPublicMenuBootstrap, getPublicMenuItems } from "@/lib/api";
import { MenuCard } from "@/components/menu-card";
import { cookies } from "next/headers";
import Link from "next/link";
import { Item } from "@/types";

type MenuPageProps = {
  searchParams: Promise<{
    category?: string;
    menuId?: string;
    cursor?: string;
  }>;
};

function buildMenuHref({
  category,
  menuId,
  cursor,
}: {
  category?: string;
  menuId?: string;
  cursor?: string;
}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (menuId) params.set("menuId", menuId);
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return query ? `/menu?${query}` : "/menu";
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const locationId = cookieStore.get(LOCATION_ID_COOKIE_KEY)?.value;
  const selectedCategory = params.category || undefined;
  const menuId = params.menuId || undefined;
  const cursor = params.cursor || undefined;

  if (!locationId) {
    return (
      <div className="min-h-screen">
        <div className="container py-20 text-center text-muted-foreground">
          <p className="text-lg">Please select a location first.</p>
        </div>
      </div>
    );
  }

  const [bootstrapData, menuItemsResponse] = await Promise.all([
    getPublicMenuBootstrap({ locationId, menuId }),
    getPublicMenuItems({
      locationId,
      menuId,
      categoryId: selectedCategory,
      cursor,
      limit: 20,
    }),
  ]);
  console.log(bootstrapData, 'bootstrap data');

  const tabs = bootstrapData?.meta?.categories || [];
  const menuItems = menuItemsResponse?.data?.items || [];
  const hasMore = menuItemsResponse?.data?.hasMore;
  const nextCursor = menuItemsResponse?.data?.nextCursor || undefined;

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Menu</h1>
          <p className="text-muted-foreground">Explore our full menu</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            <Link
              href={buildMenuHref({ menuId })}
              className={
                selectedCategory
                  ? "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary text-primary-foreground"
              }
            >
              All
            </Link>
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={buildMenuHref({ category: tab.id, menuId })}
                className={
                  selectedCategory === tab.id
                    ? "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary text-primary-foreground"
                    : "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>

        {!menuItemsResponse?.success ? (
          <div className="mb-6">
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Failed to load menu items.
              </CardContent>
            </Card>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No items found</p>
            <p className="text-sm mt-1">Try a different category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item: Item, index: number) => (
                <MenuCard key={`${item.id}-${index}`} item={item} />
              ))}
            </div>
            {hasMore && nextCursor ? (
              <div className="flex justify-center mt-8">
                <Button asChild>
                  <Link
                    href={buildMenuHref({
                      category: selectedCategory,
                      menuId,
                      cursor: nextCursor,
                    })}
                  >
                    Load more
                  </Link>
                </Button>
              </div>
            ) : null}
          </>
        )}

      </div>
    </div>
  );
}
