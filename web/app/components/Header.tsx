"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearAuth, getCurrentUserStored } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarClock,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/manage", label: "Manage", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUserStored<any>();
    setUserName(u?.name || u?.email || null);
    setMenuOpen(false);
  }, [pathname]);

  const initials = useMemo(() => {
    if (!userName) return null;
    return userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [userName]);

  const onLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            C
          </div>
          <span className="text-base font-semibold text-foreground hidden sm:inline">
            CIMAGE Admin
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userName && (
            <div className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground lg:inline-flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
                {initials || "A"}
              </span>
              <span className="max-w-[120px] truncate">{userName}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
            onClick={onLogout}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Logout
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border/50 bg-card p-4 md:hidden">
          <div className="space-y-1">
            {userName && (
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  {initials || "A"}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {userName}
                </span>
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
