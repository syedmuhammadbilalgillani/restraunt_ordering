import { CACHE_TAGS } from "@/constants/cache-tags";
import { Category, Location, MenuCategory, MenuItem, Order } from "@/types";
import { unstable_cache } from "next/cache";
import { apiClient } from "./apiClient";
import { categories, menuItems, mockOrders } from "./mock-data";

const REVALIDATE_TIME = 60 * 60 * 24 * 30; // 30 days

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchCategories(): Promise<Category[]> {
  await delay(300);
  return categories;
}

export async function fetchMenuItems(categoryId?: string): Promise<MenuItem[]> {
  await delay(600);
  let items = menuItems;
  if (categoryId) items = items.filter((i) => i.categoryId === categoryId);
  return items;
}

export async function fetchMenuItem(id: string): Promise<MenuItem | undefined> {
  await delay(400);
  return menuItems.find((i) => i.id === id);
}

export async function fetchOrders(): Promise<Order[]> {
  await delay(500);
  return mockOrders;
}

export async function searchMenuItems(query: string): Promise<MenuItem[]> {
  await delay(300);
  const lower = query.toLowerCase();
  return menuItems.filter(
    (i) =>
      i.name.toLowerCase().includes(lower) ||
      i.description.toLowerCase().includes(lower),
  );
}

export const getAllLocations = unstable_cache(
  async () => {
    const response = await apiClient.get<{ data: Location[] }>("/locations");
    return (response?.data?.data as Location[]) || [];
  },
  [CACHE_TAGS.LOCATION],
  {
    tags: [CACHE_TAGS.LOCATION],
    revalidate: REVALIDATE_TIME,
  },
);
export const getAllMenuCategoriesByLocation = unstable_cache(
  async () => {
    const response = await apiClient.get<{ data: MenuCategory }>(
      `/menu/categories`,
    );
    return (response?.data?.data as MenuCategory) || [];
  },
  [CACHE_TAGS.MENU_CATEGORIES_BY_LOCATION],
  {
    tags: [CACHE_TAGS.MENU_CATEGORIES_BY_LOCATION],
    revalidate: REVALIDATE_TIME,
  },
);
