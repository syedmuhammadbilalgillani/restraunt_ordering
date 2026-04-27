"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Location } from "@/types";
import type { AuthSnapshot } from "@/lib/iron-session/auth/auth.actions";
import { logoutAction } from "@/lib/iron-session/auth/auth.actions";
import { LogOut, Menu, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LocationPickerDialog } from "./location-picker-dialog";
import { ThemeToggle } from "./theme-toggle";
import { useCartStore } from "@/lib/cart/cart.store";

type NavbarProps = {
  locations: Location[];
  defaultLocation: string | null;
  /** From server (layout); refreshed after logout via `router.refresh()`. */
  authSnapshot: AuthSnapshot;
};

export function Navbar({
  locations,
  defaultLocation,
  authSnapshot,
}: NavbarProps) {
  const navigate = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [logoutPending, startLogoutTransition] = useTransition();
  const cart = useCartStore((s) => s.countItems());
  const cartCount = mounted ? cart : 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const displayIsAuthenticated = authSnapshot.authenticated;
  const displayUserName = authSnapshot.user?.name;

  const activeLocationName = defaultLocation
    ? locations.find((l) => l.id === defaultLocation)?.name
    : null;

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
      setMobileOpen(false);
      navigate.push("/");
      navigate.refresh();
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg">
            F
          </div>
          <span className="font-display text-xl font-bold hidden sm:inline">
            FoodHub
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/menu">Menu</Link>
          </Button>
          {displayIsAuthenticated && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">Orders</Link>
            </Button>
          )}
          {locations?.length === 1 ? (
            <></>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocationDialogOpen((v) => !v)}
            >
              {activeLocationName ?? "Location"}
            </Button>
          )}
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />

              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                {cartCount}
              </Badge>
            </Link>
          </Button>

          {displayIsAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {displayUserName}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate.push("/profile")}>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate.push("/orders")}>
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={logoutPending}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                {cartCount}
              </Badge>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-slide-up">
          <nav className="container flex flex-col py-4 gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-secondary"
            >
              Home
            </Link>
            <Link
              href="/menu"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-secondary"
            >
              Menu
            </Link>
            <button
              type="button"
              onClick={() => {
                setLocationDialogOpen(true);
                setMobileOpen(false);
              }}
              className="px-3 py-2 rounded-md hover:bg-secondary text-left"
            >
              {activeLocationName
                ? `Location: ${activeLocationName}`
                : "Choose location"}
            </button>
            {displayIsAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-secondary"
                >
                  My Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-secondary"
                >
                  My Orders
                </Link>
                <button
                  type="button"
                  disabled={logoutPending}
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md hover:bg-secondary text-left text-destructive"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-secondary"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}

      <LocationPickerDialog
        locations={locations}
        requireSelection={locationDialogOpen}
        defaultLocation={defaultLocation}
      />
    </header>
  );
}
