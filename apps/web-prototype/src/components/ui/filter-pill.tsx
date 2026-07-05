import { cn } from "@/lib/utils";

interface FilterPillProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function FilterPill({ label, active, onToggle }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-[#F7F9FC] text-[#374151] border-black/8 hover:border-primary/30 hover:bg-white",
      )}
    >
      {label}
    </button>
  );
}

interface SortChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SortChip({ label, active, onClick }: SortChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-white text-[#374151] border-black/10 hover:border-primary/30",
      )}
    >
      {label}
    </button>
  );
}
