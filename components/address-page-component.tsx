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
import {
  createCustomerAddress,
  listCustomerAddresses,
  updateCustomerAddress,
  type CustomerAddress,
} from "@/lib/customer-auth";
import {
  ArrowLeft,
  Briefcase,
  Home,
  MapPin,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function AddressesPageComponent({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const navigate = useRouter();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "PK",
    isDefault: true,
  });

  useEffect(() => {
    if (!isAuthenticated) navigate.push("/login");
  }, [isAuthenticated, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listCustomerAddresses();
      setAddresses(res?.addresses ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    load().catch(() => {});
  }, [isAuthenticated]);

  const handleAdd = async () => {
    if (!newAddr.addressLine1.trim() || !newAddr.city.trim()) {
      toast.error("Address line 1 and city are required");
      return;
    }
    setLoading(true);
    try {
      await createCustomerAddress({
        label: newAddr.label.trim() || undefined,
        fullName: newAddr.fullName.trim() || undefined,
        phone: newAddr.phone.trim() || undefined,
        addressLine1: newAddr.addressLine1.trim(),
        addressLine2: newAddr.addressLine2.trim() || undefined,
        city: newAddr.city.trim(),
        state: newAddr.state.trim() || undefined,
        postalCode: newAddr.postalCode.trim() || undefined,
        countryCode: newAddr.countryCode.trim() || undefined,
        isDefault: newAddr.isDefault,
      });

      setDialogOpen(false);
      setNewAddr({
        label: "Home",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        countryCode: "PK",
        isDefault: true,
      });

      await load();
      toast.success("Address added!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add address");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      await updateCustomerAddress(id, { isDefault: true });
      await load();
      toast.success("Default address updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update default");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast(
      "Delete endpoint not provided in doc (add backend DELETE /addresses/:id).",
    );
    // If you add it later, call it here then reload.
  };

  const getLabelIcon = (label: string | null | undefined) => {
    const l = (label || "").toLowerCase();
    if (l === "home") return Home;
    if (l === "work") return Briefcase;
    return MapPin;
  };

  const sorted = useMemo(() => {
    return [...addresses]?.sort(
      (a, b) => Number(b?.isDefault) - Number(a?.isDefault),
    );
  }, [addresses]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            disabled={loading}
            onClick={load}
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">My Addresses</h1>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2" disabled={loading}>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Full name (optional)</Label>
                    <Input
                      value={newAddr.fullName}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input
                      value={newAddr.phone}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Address line 1</Label>
                  <Input
                    placeholder="Street 1"
                    value={newAddr.addressLine1}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, addressLine1: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Address line 2 (optional)</Label>
                  <Input
                    placeholder="Apartment 2"
                    value={newAddr.addressLine2}
                    onChange={(e) =>
                      setNewAddr({ ...newAddr, addressLine2: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <Label>State (optional)</Label>
                    <Input
                      placeholder="State"
                      value={newAddr.state}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, state: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Postal code (optional)</Label>
                    <Input
                      placeholder="54000"
                      value={newAddr.postalCode}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, postalCode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Country code (optional)</Label>
                    <Input
                      placeholder="PK"
                      value={newAddr.countryCode}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, countryCode: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl"
                  onClick={handleAdd}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {sorted.map((addr) => {
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
                      <p className="font-medium">{addr.label || "Address"}</p>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}
                      {addr.state ? `, ${addr.state}` : ""}{" "}
                      {addr.postalCode || ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading}
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
                      disabled
                      title="Delete not implemented in API doc"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sorted.length === 0 && (
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
