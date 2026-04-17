import { API_URL, TENANT_ID } from "@/constants";

function joinApiUrl(path: string): string {
  const base = API_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/${p}`;
}

/** Server-side fetch to Nest `API_URL` (e.g. …/api/v1/...). */
export async function customerBackendFetch<T>(
  path: string,
  init?: RequestInit & { bearer?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (TENANT_ID) headers.set("x-tenant-id", TENANT_ID);
  if (init?.bearer) {
    headers.set("Authorization", `Bearer ${init.bearer}`);
  }

  const body = init?.body;
  if (
    body &&
    typeof body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(joinApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : res.statusText;
    throw new Error(msg || "Request failed");
  }

  return data as T;
}