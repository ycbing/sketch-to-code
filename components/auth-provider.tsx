"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Public paths that don't require authentication
const publicPaths = ["/", "/login", "/register", "/gallery"];

function isPublicPath(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return true;
  // /share/* paths are public
  if (pathname.startsWith("/share/")) return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicPath(pathname);
  const [checked, setChecked] = useState(isPublic);

  useEffect(() => {
    if (isPublic) return;

    // Check session for protected routes
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.user) {
          router.push("/login");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [pathname, router, isPublic]);

  if (!isPublic && !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black dark:bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
