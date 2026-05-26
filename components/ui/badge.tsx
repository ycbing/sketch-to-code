import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gradient" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        {
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300":
            variant === "default",
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white":
            variant === "gradient",
          "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400":
            variant === "outline",
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
