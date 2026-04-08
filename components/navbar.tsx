"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { Location } from "@/types";
import { LogOut, Menu, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocationSelect } from "./location-select";
import { ThemeToggle } from "./theme-toggle";

type NavbarProps = {
  locations: Location[];
};

export function Navbar({ locations }: NavbarProps) {
  const itemCount = useCartStore((s) => s.itemCount());
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const displayItemCount = mounted ? itemCount : 0;
  const displayIsAuthenticated = mounted ? isAuthenticated : false;
  const displayUserName = mounted ? user?.name : undefined;

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

        {/* Desktop nav */}
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

          <LocationSelect locations={locations} compact />

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {displayItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {displayItemCount}
                </Badge>
              )}
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
                  onClick={() => {
                    logout();
                    navigate.push("/");
                  }}
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

        {/* Mobile */}
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
              {displayItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {displayItemCount}
                </Badge>
              )}
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
            <div className="px-3 pb-2">
              <LocationSelect locations={locations} />
            </div>
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
                  onClick={() => {
                    logout();
                    navigate.push("/");
                    setMobileOpen(false);
                  }}
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
    </header>
  );
}
