export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  itemCount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  popular: boolean;
  rating: number;
  calories?: number;
  tags?: string[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "pending" | "preparing" | "on-the-way" | "delivered";
  date: string;
  deliveryType: "delivery" | "pickup";
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

// #####################

export interface Location {
  id: string;
  name: string;
  slug: string;
  code: string;
  longitude: string;
  latitude: string;
}

export interface MenuCategory {
  menu: {
    id: string;
    name: string;
  }[];
  categories: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    displayOrder: number;
  }[];
}
