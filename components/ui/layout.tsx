import { cn } from "@/lib/utils";

function SiteHeader({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/50 dark:bg-black/50",
        className,
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {children}
      </div>
    </header>
  );
}

function SiteFooter({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn(
        "border-t border-gray-200 dark:border-gray-800 py-8",
        className,
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-6">{children}</div>
    </footer>
  );
}

export { SiteHeader, SiteFooter };
