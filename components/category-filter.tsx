import { cn } from "@/lib/utils";
import { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          !selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id === selected ? null : cat.id)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
            cat.id === selected
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <span>{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
}
