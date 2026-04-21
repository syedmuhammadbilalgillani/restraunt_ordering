import { CACHE_TAGS } from "@/constants/cache-tags";
import {
  ItemsResponse,
  Location,
  MenuCategory,
  MenuItemByIdResponse,
  PublicMenuBootstrapResponse,
  PublicMenuItemsResponse,
} from "@/types";
import { unstable_cache } from "next/cache";
import { apiClient } from "./apiClient";

const REVALIDATE_TIME = 60 * 60 * 24 * 30; // 30 days

export const getAllLocations = unstable_cache(
  async () => {
    try {
      const response = await apiClient.get<Location[]>("/locations");
      // console.log(response.data, "location data");
      return Array.isArray(response?.data)
        ? (response?.data as Location[])
        : [];
    } catch (error) {
      console.log(error, "error");
      return [];
    }
  },
  [CACHE_TAGS.LOCATION],
  {
    tags: [CACHE_TAGS.LOCATION],
    revalidate: REVALIDATE_TIME,
  },
);
export const getAllMenuCategoriesByLocation = unstable_cache(
  async ({ locationId }: { locationId?: string }): Promise<MenuCategory> => {
    const response = await apiClient.get<{ data: MenuCategory }>(
      `/public/menu/categories`,
      {
        ...(locationId ? { headers: { "x-location-id": locationId } } : {}),
      },
    );
    return (
      console.log(response?.data?.data, "menu category data"),
      response?.data?.data || {
        menu: [],
        categories: [],
      }
    );
  },
  [CACHE_TAGS.MENU_CATEGORIES_BY_LOCATION],
  {
    tags: [CACHE_TAGS.MENU_CATEGORIES_BY_LOCATION],
    revalidate: REVALIDATE_TIME,
  },
);

export const getAllMenuItemsByCategory = unstable_cache(
  async ({
    params = {
      categoryId: undefined,
      locationId: undefined,
      limit: 20,
      featured: true,
    },
  }: {
    params: {
      categoryId?: string;
      locationId?: string;
      limit?: number;
      featured?: boolean;
    };
  }): Promise<ItemsResponse> => {
    const { categoryId, locationId, limit, featured } = params;
    const queryParams = new URLSearchParams();
    if (categoryId) queryParams.set("categoryId", categoryId);
    if (locationId) queryParams.set("locationId", locationId);
    if (limit) queryParams.set("limit", limit.toString());
    if (featured) queryParams.set("featured", featured.toString());
    const response = await apiClient.get<ItemsResponse>(
      `/public/menu/items/popular?${queryParams.toString()}`,
    );
    if (response?.data?.success === false || !response?.data?.data) {
      return {
        success: false,
        data: {
          items: [],
        },
        error: response?.data?.error || {
          code: "INTERNAL_ERROR",
          message: "Failed to load featured menu items",
        },
      };
    }
    return response.data;
  },
  [CACHE_TAGS.MENU_ITEMS_BY_CATEGORY],
  {
    tags: [CACHE_TAGS.MENU_ITEMS_BY_CATEGORY],
    revalidate: REVALIDATE_TIME,
  },
);

export const getMenuItemById = unstable_cache(
  async ({
    slug,
    locationId,
  }: {
    slug: string;
    locationId?: string;
  }): Promise<MenuItemByIdResponse> => {
    const response = await apiClient.get<MenuItemByIdResponse>(
      `/public/menu/items/${slug}`,
      {
        ...(locationId ? { headers: { "x-location-id": locationId } } : {}),
      },
    );

    if (response?.data?.success === false || !response?.data?.data) {
      return {
        success: false,
        data: null,
        error: response?.data?.error || {
          code: "INTERNAL_ERROR",
          message: "Failed to load menu item",
        },
      };
    }

    return response.data;
  },
  [CACHE_TAGS.MENU_ITEM_BY_ID],
  {
    tags: [CACHE_TAGS.MENU_ITEM_BY_ID],
    revalidate: REVALIDATE_TIME,
  },
);

export async function getPublicMenuBootstrap(params: {
  locationId: string;
  menuId?: string;
}): Promise<PublicMenuBootstrapResponse> {
  const response = await apiClient.get<PublicMenuBootstrapResponse>(
    "/menus/bootstrap",
    {
      params: {
        locationId: params.locationId,
        menuId: params.menuId,
      },
    },
  );

  if (response?.data?.success === false || !response?.data) {
    return {
      success: false,
      meta: {
        menu: null,
        categories: [],
      },
      error: response?.data?.error || {
        code: "INTERNAL_ERROR",
        message: "Failed to load menu bootstrap",
      },
    };
  }

  return response.data;
}

export async function getPublicMenuItems(params: {
  locationId: string;
  categoryId?: string;
  menuId?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<PublicMenuItemsResponse> {
  const response = await apiClient.get<PublicMenuItemsResponse>(
    "/menus/items",
    {
      params: {
        locationId: params.locationId,
        categoryId: params.categoryId,
        menuId: params.menuId,
        limit: params.limit ?? 20,
        cursor: params.cursor || undefined,
      },
    },
  );

  if (response?.data?.success === false || !response?.data?.data) {
    return {
      success: false,
      data: {
        items: [],
        nextCursor: null,
        hasMore: false,
      },
      error: response?.data?.error || {
        code: "INTERNAL_ERROR",
        message: "Failed to load menu items",
      },
    };
  }

  return response.data;
}
