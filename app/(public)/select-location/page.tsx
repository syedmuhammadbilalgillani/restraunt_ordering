import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCATION_ID_COOKIE_KEY } from "@/constants/location";
import { getAllLocations } from "@/lib/api";
import { LocationPickerClient } from "./picker-client";

export default async function SelectLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const cookieStore = await cookies();
  const existing = cookieStore.get(LOCATION_ID_COOKIE_KEY)?.value;
  if (existing) redirect("/");

  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/";

  const locations = (await getAllLocations()) ?? [];

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-semibold">Select your location</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a branch to continue. This is saved securely for your next visit.
      </p>

      <div className="mt-6">
        <LocationPickerClient locations={locations} returnTo={safeReturnTo} />
      </div>
    </main>
  );
}