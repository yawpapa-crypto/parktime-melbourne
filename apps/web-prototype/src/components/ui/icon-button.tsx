import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
}

export function IconButton({
  label,
  size = "md",
  className,
  children,
  ...props
}: IconButtonProps) {
  const sizeClass = size === "sm" ? "w-8 h-8 rounded-full" : "w-11 h-11 rounded-2xl";
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        sizeClass,
        "bg-white shadow-sm border border-black/5 flex items-center justify-center",
        "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-95 transition-all",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-10 h-6 rounded-full flex items-center transition-all px-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-accent justify-end" : "bg-[#E5E7EB] justify-start",
      )}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  );
}
