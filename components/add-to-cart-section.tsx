"use client";

import type { MenuItemDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart/cart.store";
import { syncCartToServer } from "@/lib/cart/cart.client";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function AddToCartSection({ item }: { item: MenuItemDetails }) {
  const add = useCartStore((s) => s.add);
  const [pending, startTransition] = useTransition();
  const [selectedSingle, setSelectedSingle] = useState<Record<string, string>>({});
  const [selectedMulti, setSelectedMulti] = useState<Record<string, Record<string, boolean>>>({});

  const selection = useMemo(() => {
    const chosen: Array<{
      modifierId: string;
      name?: string;
      quantity?: number;
      priceDelta?: number;
      groupId: string;
    }> = [];

    for (const g of item.modifierGroups ?? []) {
      if (g.selectionType === "single") {
        const modifierId = selectedSingle[g.id];
        if (!modifierId) continue;
        const mod = g.modifiers.find((m) => m.id === modifierId);
        if (!mod) continue;
        chosen.push({
          modifierId: mod.id,
          name: mod.name,
          quantity: 1,
          priceDelta: Number(mod.priceDelta),
          groupId: g.id,
        });
      } else {
        const map = selectedMulti[g.id] ?? {};
        for (const mod of g.modifiers) {
          if (!map[mod.id]) continue;
          chosen.push({
            modifierId: mod.id,
            name: mod.name,
            quantity: 1,
            priceDelta: Number(mod.priceDelta),
            groupId: g.id,
          });
        }
      }
    }

    return chosen;
  }, [item.modifierGroups, selectedMulti, selectedSingle]);

  const validation = useMemo(() => {
    const groups = item.modifierGroups ?? [];
    const errors: string[] = [];

    for (const g of groups) {
      const count =
        g.selectionType === "single"
          ? selectedSingle[g.id]
            ? 1
            : 0
          : Object.values(selectedMulti[g.id] ?? {}).filter(Boolean).length;

      const min = g.minSelections ?? 0;
      const max = g.maxSelections ?? (g.selectionType === "single" ? 1 : 999);
      const required = Boolean(g.isRequired) || min > 0;

      if (required && count < min) {
        errors.push(`Select at least ${min} from "${g.name}"`);
      }
      if (count > max) {
        errors.push(`Select at most ${max} from "${g.name}"`);
      }
    }

    return { ok: errors.length === 0, errors };
  }, [item.modifierGroups, selectedMulti, selectedSingle]);

  const handleAdd = () => {
    if (!validation.ok) {
      toast.error(validation.errors[0] ?? "Please fix modifier selections");
      return;
    }

    add({
      menuItem: item,
      quantity: 1,
      modifiers: selection.map((s) => ({
        modifierId: s.modifierId,
        ...(s.name ? { name: s.name } : {}),
        quantity: s.quantity ?? 1,
        ...(Number.isFinite(s.priceDelta) ? { priceDelta: s.priceDelta } : {}),
      })),
      specialInstructions: "",
    });
    toast.success(`${item.name} added to cart`);
    startTransition(async () => {
      await Promise.resolve();
      await syncCartToServer(useCartStore.getState().lines);
    });
  };

  return (
    <div className="mt-8 space-y-6">
      {(item.modifierGroups?.length ?? 0) > 0 ? (
        <section className="space-y-5">
          <h2 className="font-display text-xl font-bold">Customize</h2>

          {item.modifierGroups.map((group) => {
            const isSingle = group.selectionType === "single";
            const min = group.minSelections ?? 0;
            const max = group.maxSelections ?? (isSingle ? 1 : 999);
            const required = Boolean(group.isRequired) || min > 0;

            const selectedCount = isSingle
              ? selectedSingle[group.id]
                ? 1
                : 0
              : Object.values(selectedMulti[group.id] ?? {}).filter(Boolean).length;

            const tooFew = required && selectedCount < min;
            const tooMany = selectedCount > max;

            return (
              <div key={group.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{group.name}</h3>
                      {required ? (
                        <span className="text-xs rounded-full px-2 py-0.5 bg-secondary">
                          Required
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose {min}–{max} ({selectedCount} selected)
                    </p>
                    {tooFew || tooMany ? (
                      <p className="text-xs text-destructive mt-1">
                        {tooFew
                          ? `Select at least ${min}.`
                          : `Select at most ${max}.`}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  {isSingle ? (
                    <RadioGroup
                      value={selectedSingle[group.id] ?? ""}
                      onValueChange={(v) =>
                        setSelectedSingle((s) => ({ ...s, [group.id]: v }))
                      }
                      className="gap-3"
                    >
                      {group.modifiers.map((m) => (
                        <label
                          key={m.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 cursor-pointer hover:bg-secondary/50",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={m.id} />
                            <div>
                              <div className="text-sm font-medium">{m.name}</div>
                              <div className="text-xs text-muted-foreground">
                                +PKR {Number(m.priceDelta).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="grid gap-3">
                      {group.modifiers.map((m) => {
                        const checked = Boolean(
                          selectedMulti[group.id]?.[m.id],
                        );
                        const disableNew =
                          !checked && selectedCount >= max;
                        return (
                          <label
                            key={m.id}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 cursor-pointer hover:bg-secondary/50",
                              disableNew && "opacity-60 cursor-not-allowed",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={checked}
                                disabled={disableNew}
                                onCheckedChange={(val) => {
                                  const next = Boolean(val);
                                  setSelectedMulti((s) => ({
                                    ...s,
                                    [group.id]: {
                                      ...(s[group.id] ?? {}),
                                      [m.id]: next,
                                    },
                                  }));
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium">{m.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  +PKR {Number(m.priceDelta).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleAdd}
          disabled={pending || !validation.ok}
          className="rounded-xl"
        >
          Add to cart
        </Button>
        {!validation.ok ? (
          <p className="text-xs text-destructive">
            {validation.errors[0] ?? "Fix selections"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

