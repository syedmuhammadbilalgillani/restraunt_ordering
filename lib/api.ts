import { categories, menuItems, mockOrders } from "./mock-data";
import { Category, MenuItem, Order } from "@/types";

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
    (i) => i.name.toLowerCase().includes(lower) || i.description.toLowerCase().includes(lower)
  );
}
