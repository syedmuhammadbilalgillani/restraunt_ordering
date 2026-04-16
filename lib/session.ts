export async function hasAuthSession(): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { authenticated?: boolean };
      return Boolean(data.authenticated);
    } catch {
      return false;
    }
  }