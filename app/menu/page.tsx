"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchMenuItems, searchMenuItems } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MenuCard } from "@/components/menu-card";
import { CategoryFilter } from "@/components/category-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export default function MenuPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category"),
  );
  const [gridView, setGridView] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["menu", selectedCategory, debouncedSearch],
    queryFn: () => {
      if (debouncedSearch) return searchMenuItems(debouncedSearch);
      return fetchMenuItems(selectedCategory || undefined);
    },
  });

  const handleCategorySelect = (id: string | null) => {
    setSelectedCategory(id);
    if (id) searchParams.set("category", id as string);
    else searchParams.delete("category", id as string);
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Menu</h1>
          <p className="text-muted-foreground">Explore our full menu</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="hidden sm:flex border rounded-xl overflow-hidden">
            <Button
              variant={gridView ? "default" : "ghost"}
              size="icon"
              onClick={() => setGridView(true)}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={!gridView ? "default" : "ghost"}
              size="icon"
              onClick={() => setGridView(false)}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {categories && (
          <div className="mb-6">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>
        )}

        {isLoading ? (
          <div
            className={
              gridView
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3]" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div
            className={
              gridView
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {menuItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No items found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
