import { API_URL, TENANT_ID } from "@/constants";

type ApiHeadersOptions = {
  token?: string | null;
  headers?: HeadersInit;
};

/**
 * Shared helper for API requests.
 * Adds common headers and auth token when provided.
 */
export function buildApiHeaders(options: ApiHeadersOptions = {}): Headers {
  const { token, headers } = options;
  const finalHeaders = new Headers(headers);

  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  if (!finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (TENANT_ID && !finalHeaders.has("x-tenant-id")) {
    finalHeaders.set("x-tenant-id", TENANT_ID);
  }

  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  return finalHeaders;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type ApiRequestConfig = Omit<
  RequestInit,
  "headers" | "body" | "method"
> & {
  token?: string | null;
  headers?: HeadersInit;
  params?: QueryParams;
  body?: BodyInit | Record<string, unknown> | null;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function withQueryParams(url: string, params?: QueryParams): string {
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  if (!searchParams.toString()) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${searchParams.toString()}`;
}

function normalizeBodyAndHeaders(
  body: ApiRequestConfig["body"],
  headers: Headers,
): BodyInit | undefined {
  if (body == null) return undefined;

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }

  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof URLSearchParams
  ) {
    return body;
  }

  return JSON.stringify(body);
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

function resolveUrl(url: string, baseURL?: string): string {
  if (!baseURL) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const normalizedBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  config: ApiRequestConfig = {},
  baseURL?: string,
): Promise<ApiResponse<T>> {
  const { token, headers, params, body, ...rest } = config;
  const requestUrl = withQueryParams(resolveUrl(url, baseURL), params);
  const finalHeaders = buildApiHeaders({ token, headers });
  const requestBody = normalizeBodyAndHeaders(body, finalHeaders);

  const response = await fetch(requestUrl, {
    ...rest,
    method,
    headers: finalHeaders,
    body: requestBody,
  });

  const responseBody = await parseResponseBody<unknown>(response);
  if (!response.ok) {
    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "message" in responseBody &&
      typeof (responseBody as { message?: unknown }).message === "string"
        ? (responseBody as { message: string }).message
        : response.statusText || "Request failed";

    throw new ApiError(message, response.status, responseBody);
  }

  return {
    data: responseBody as T,
    status: response.status,
    headers: response.headers,
  };
}

export function createApiClient(baseURL?: string) {
  return {
    get: <T>(url: string, config?: ApiRequestConfig) =>
      request<T>("GET", url, config, baseURL),
    post: <T>(
      url: string,
      body?: ApiRequestConfig["body"],
      config?: ApiRequestConfig,
    ) => request<T>("POST", url, { ...config, body }, baseURL),
    put: <T>(
      url: string,
      body?: ApiRequestConfig["body"],
      config?: ApiRequestConfig,
    ) => request<T>("PUT", url, { ...config, body }, baseURL),
    patch: <T>(
      url: string,
      body?: ApiRequestConfig["body"],
      config?: ApiRequestConfig,
    ) => request<T>("PATCH", url, { ...config, body }, baseURL),
    delete: <T>(url: string, config?: ApiRequestConfig) =>
      request<T>("DELETE", url, config, baseURL),
  };
}

export const apiClient = createApiClient(API_URL);
