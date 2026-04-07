"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { Address } from "@/types";
import { ArrowLeft, Briefcase, Home, MapPin, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const initialAddresses: Address[] = [
  {
    id: "addr-1",
    label: "Home",
    street: "123 Main Street, Apt 4B",
    city: "New York",
    state: "NY",
    zip: "10001",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Work",
    street: "456 Park Avenue, Floor 12",
    city: "New York",
    state: "NY",
    zip: "10022",
    isDefault: false,
  },
];

export default function AddressesPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    if (!isAuthenticated) navigate.push("/login");
  }, [isAuthenticated, navigate]);

  const handleAdd = () => {
    if (!newAddr.label || !newAddr.street || !newAddr.city) {
      toast.error("Please fill in all required fields");
      return;
    }
    const addr: Address = {
      id: "addr-" + Date.now(),
      ...newAddr,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, addr]);
    setNewAddr({ label: "", street: "", city: "", state: "", zip: "" });
    setDialogOpen(false);
    toast.success("Address added!");
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast("Address removed");
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    toast.success("Default address updated");
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase() === "home") return Home;
    if (label.toLowerCase() === "work") return Briefcase;
    return MapPin;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="gap-2 mb-6"
          onClick={() => navigate.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">My Addresses</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    placeholder="e.g. Home, Work"
                    value={newAddr.label}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, label: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    placeholder="123 Main St, Apt 4"
                    value={newAddr.street}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, street: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={newAddr.city}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      placeholder="State"
                      value={newAddr.state}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input
                      placeholder="ZIP"
                      value={newAddr.zip}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, zip: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button className="w-full rounded-xl" onClick={handleAdd}>
                  Save Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {addresses.map((addr) => {
            const Icon = getLabelIcon(addr.label);
            return (
              <Card
                key={addr.id}
                className={`transition-all ${addr.isDefault ? "border-primary" : ""}`}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{addr.label}</p>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {addr.street}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.state} {addr.zip}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(addr.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {addresses.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">No addresses yet</p>
              <p className="text-sm">Add a delivery address to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
