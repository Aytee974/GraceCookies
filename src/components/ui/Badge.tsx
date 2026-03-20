type StatusVariant = "ready" | "pending" | "fulfilled";
type BadgeVariant = "status" | "category";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  status?: StatusVariant;
  className?: string;
}

const statusClasses: Record<StatusVariant, string> = {
  ready: "bg-green-100 text-green-700 border border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  fulfilled: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function Badge({
  label,
  variant = "category",
  status = "fulfilled",
  className = "",
}: BadgeProps) {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  const variantClass =
    variant === "status"
      ? statusClasses[status]
      : "bg-lavender text-violet border border-lavender-dark";

  return (
    <span className={`${baseClasses} ${variantClass} ${className}`}>
      {label}
    </span>
  );
}
