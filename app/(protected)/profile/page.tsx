"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import {
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useRouter();

  useEffect(() => {
    if (!isAuthenticated) navigate.push("/login");
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    {
      icon: User,
      label: "Edit Profile",
      to: "/profile/edit",
      description: "Update your personal information",
    },
    {
      icon: MapPin,
      label: "My Addresses",
      to: "/profile/addresses",
      description: "Manage delivery addresses",
    },
    {
      icon: Package,
      label: "My Orders",
      to: "/orders",
      description: "View order history",
    },
    {
      icon: Settings,
      label: "Settings",
      to: "/profile/settings",
      description: "App preferences & notifications",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

        {/* Profile card */}
        <Card className="mb-8">
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-display font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold truncate">
                {user.name}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
              {user.phone && (
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href="/profile/edit">Edit</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Menu items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link key={item.to} href={item.to}>
              <Card className="hover:shadow-md transition-all hover:bg-accent/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full mt-8 text-destructive hover:text-destructive gap-2"
          onClick={() => {
            logout();
            navigate.push("/");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
