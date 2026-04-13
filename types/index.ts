export interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  itemCount?: number;
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
  menuItem: Item;
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
  code?: string;
  longitude?: string;
  latitude?: string;
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
    slug: string;
  }[];
}
export interface Item {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  uom: string;
  basePrice: number;
  compareAtPrice: string | null;
  discountPrice: string | null;
  isFeatured: boolean;
  displayOrder: number;
  prepTimeSeconds: number | null;
}
export interface MenuItemsMeta {
  tenantId: string;
  tenantSlug: string;
  isMultiLocation: boolean;
  location: Location | null;
}

export interface PublicMenuBootstrapMenu {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PublicMenuBootstrapCategory {
  id: string;
  name: string;
  itemCount: number;
}

export interface PublicMenuMeta extends MenuItemsMeta {
  menuId?: string | null;
  categoryId?: string | null;
}

export interface PublicMenuBootstrapResponse {
  success: boolean;
  meta: {
    menu: PublicMenuBootstrapMenu | null;
    categories: PublicMenuBootstrapCategory[];
  };
  // meta?: PublicMenuMeta;
  error?: ApiError;
}

export interface PublicMenuItem {
  id?: string;
  image: string;
  title: string;
  desc: string;
  price: string;
}

export interface PublicMenuItemsResponse {
  success: boolean;
  data: {
    items: Item[];
    nextCursor: string | null;
    hasMore: boolean;
  };
  meta?: PublicMenuMeta;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface Modifier {
  id: string;
  name: string;
  priceDelta: string;
  displayOrder: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  displayOrder: number;
  modifiers: Modifier[];
}

export interface MenuReference {
  id: string;
  name: string;
}

export interface CategoryReference {
  id: string;
  name: string;
}

export interface MenuItemDetails {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  uom: string;
  basePrice: string;
  compareAtPrice: string | null;
  discountPrice: string | null;
  isFeatured: boolean;
  displayOrder: number;
  prepTimeSeconds: number | null;
  modifierGroups: ModifierGroup[];
  menu: MenuReference;
  category: CategoryReference;
}

export interface ItemsResponse {
  success: boolean;
  data: {
    items: Item[];
  };
  meta?: MenuItemsMeta;
  error?: ApiError;
}

export interface MenuItemByIdResponse {
  success: boolean;
  data: MenuItemDetails | null;
  meta?: MenuItemsMeta;
  error?: ApiError;
}



export interface CartLineModifier {
  modifierId: string;
  /** Display only; not sent to create-order API */
  name?: string;
  quantity?: number;
  priceDelta?: number;
}

export interface CartItem {
  /** Stable id per cart line (same menu item + different modifiers = different line) */
  lineId: string;
  menuItem: Item;
  quantity: number;
  specialInstructions?: string;
  modifiers: CartLineModifier[];
}

// --- Online order API (matches your Nest DTO whitelist) ---
export type OrderType = "dine_in" | "takeaway" | "delivery" | "catering";
export type OrderSource =
  | "pos"
  | "online"
  | "qr"
  | "kiosk"
  | "whatsapp"
  | "aggregator"
  | "group";

export interface CreateOnlineOrderLineModifier {
  modifierId: string;
  quantity?: number;
}

export interface CreateOnlineOrderLine {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers?: CreateOnlineOrderLineModifier[];
}

export interface CreateOnlineOrderPayload {
  locationId: string;
  orderType: OrderType;
  orderSource: OrderSource;
  lines: CreateOnlineOrderLine[];
  customerId?: string;
  deliveryAddressId?: string;
  customerNotes?: string;
  kitchenNotes?: string;
  discountCode?: string;
  discountId?: string;
  tableNumber?: string;
  qrCodeId?: string;
  groupSessionId?: string;
  kioskTerminalId?: string;
}

/** Adjust fields to match your actual `.returning()` row */
export interface OnlineOrderResponse {
  id: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  subtotal?: string | number;
  discountAmount?: string | number;
  total?: string | number;
  currency?: string;
  createdAt?: string;
  [key: string]: unknown;
}