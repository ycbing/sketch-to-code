import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

function Logo({ size = "md", showText = true, className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shrink-0",
          {
            "w-6 h-6": size === "sm",
            "w-8 h-8": size === "md",
            "w-10 h-10": size === "lg",
          },
        )}
      >
        <Sparkles
          className={cn("text-white", {
            "w-3 h-3": size === "sm",
            "w-4 h-4": size === "md",
            "w-5 h-5": size === "lg",
          })}
        />
      </div>
      {showText && (
        <span
          className={cn("font-semibold tracking-tight text-gray-900 dark:text-white", {
            "text-sm": size === "sm",
            "text-lg": size === "md",
            "text-xl": size === "lg",
          })}
        >
          智能绘图
        </span>
      )}
    </Link>
  );
}

export { Logo };
