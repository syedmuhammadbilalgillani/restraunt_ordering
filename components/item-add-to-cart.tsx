"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/store/cart-store";
import type { CartLineModifier, Item, MenuItemDetails } from "@/types";
import { useState } from "react";
import { toast } from "sonner";

function detailsToItem(d: MenuItemDetails): Item {
  return {
    id: d.id,
    slug: d.slug,
    categoryId: d.categoryId,
    sku: d.sku,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    uom: d.uom,
    basePrice: parseFloat(String(d.basePrice)) || 0,
    compareAtPrice: d.compareAtPrice,
    discountPrice: d.discountPrice,
    isFeatured: d.isFeatured,
    displayOrder: d.displayOrder,
    prepTimeSeconds: d.prepTimeSeconds,
  };
}

// remove duplicate imageUrl line when pasting — keep one

type SelectedMap = Record<string, Set<string>>;

function priceDeltaNum(delta: string): number {
  const n = parseFloat(delta);
  return Number.isFinite(n) ? n : 0;
}

export function ItemAddToCart({ item }: { item: MenuItemDetails }) {
  const addItem = useCartStore((s) => s.addItem);
  const [selected, setSelected] = useState<SelectedMap>(() => {
    const init: SelectedMap = {};
    for (const g of item?.modifierGroups || []) {
      init[g.id] = new Set();
    }
    return init;
  });
  const [notes, setNotes] = useState("");

  const toggleMulti = (groupId: string, modifierId: string, max: number) => {
    setSelected((prev) => {
      const next = { ...prev, [groupId]: new Set(prev[groupId]) };
      const set = next[groupId];
      if (set.has(modifierId)) set.delete(modifierId);
      else {
        if (set.size >= max) {
          toast.error(`At most ${max} selection(s) for this group`);
          return prev;
        }
        set.add(modifierId);
      }
      return next;
    });
  };

  const setSingle = (groupId: string, modifierId: string) => {
    setSelected((prev) => ({
      ...prev,
      [groupId]: new Set(modifierId ? [modifierId] : []),
    }));
  };

  const validate = (): boolean => {
    for (const g of item?.modifierGroups || []) {
      const count = selected[g.id]?.size ?? 0;
      if (g.isRequired && count < Math.max(1, g.minSelections)) {
        toast.error(`Please choose options for “${g.name}”`);
        return false;
      }
      if (count < g.minSelections) {
        toast.error(
          `“${g.name}” needs at least ${g.minSelections} selection(s)`,
        );
        return false;
      }
      if (count > g.maxSelections) {
        toast.error(`“${g.name}” allows at most ${g.maxSelections} selection(s)`);
        return false;
      }
    }
    return true;
  };

  const buildModifiers = (): CartLineModifier[] => {
    const out: CartLineModifier[] = [];
    for (const g of item?.modifierGroups || []) {
      for (const modId of selected[g.id] || []) {
        const mod = g.modifiers.find((m) => m.id === modId);
        if (!mod) continue;
        out.push({
            modifierId: mod.id,
            name: mod.name,
            quantity: 1,
            priceDelta: priceDeltaNum(mod.priceDelta),
          });
      }
    }
    return out;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const menuItem = detailsToItem(item);
    const modifiers = buildModifiers();
    addItem({
      menuItem,
      quantity: 1,
      modifiers,
      specialInstructions: notes,
    });
    toast.success(`${item?.name} added to cart`);
  };

  if (!item?.modifierGroups?.length) {
    return (
      <div className="mt-8 space-y-4">
        <Textarea
          placeholder="Special instructions (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
        <Button size="lg" className="rounded-xl" onClick={handleAdd}>
          Add to cart
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {item?.modifierGroups.map((g) => (
        <div key={g.id} className="rounded-xl border p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <h3 className="font-semibold">{g.name}</h3>
            {g.isRequired ? (
              <span className="text-xs text-destructive">Required</span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {g.minSelections}–{g.maxSelections} selections
            </span>
          </div>

          {g.selectionType === "single" ? (
            <RadioGroup
              value={[...(selected[g.id] || [])][0] || ""}
              onValueChange={(v) => setSingle(g.id, v)}
            >
              {g.modifiers.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <RadioGroupItem value={m.id} id={`${g.id}-${m.id}`} />
                  <Label htmlFor={`${g.id}-${m.id}`} className="cursor-pointer">
                    {m.name}{" "}
                    <span className="text-muted-foreground text-sm">
                      +{m.priceDelta}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              {g.modifiers.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`${g.id}-${m.id}`}
                    checked={selected[g.id]?.has(m.id) ?? false}
                    onCheckedChange={() =>
                      toggleMulti(g.id, m.id, g.maxSelections)
                    }
                  />
                  <Label htmlFor={`${g.id}-${m.id}`} className="cursor-pointer">
                    {m.name}{" "}
                    <span className="text-muted-foreground text-sm">
                      +{m.priceDelta}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <Textarea
        placeholder="Special instructions (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={2000}
      />
      <Button size="lg" className="rounded-xl w-full sm:w-auto" onClick={handleAdd}>
        Add to cart
      </Button>
    </div>
  );
}