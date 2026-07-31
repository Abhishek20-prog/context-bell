import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  BookMarked,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  NotebookPen,
  Settings as SettingsIcon,
  Sun,
  User as UserIcon,
  Youtube,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/record", label: "Record Context", icon: Mic },
  { to: "/chat", label: "Chatbot", icon: MessageSquare },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/bookmarks", label: "Bookmarks", icon: BookMarked },
  { to: "/youtube", label: "YouTube", icon: Youtube },
] as const;

const SECONDARY = [
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/about", label: "About", icon: Info },
] as const;

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-hero glow-ring">
        <Bell className="size-4.5 text-primary-foreground" strokeWidth={2.4} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">ContextBell</span>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary/12 text-foreground glow-ring"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4.5", active && "text-primary")} />
            {label}
          </Link>
        );
      })}
      <div className="my-3 h-px bg-border" />
      {SECONDARY.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  action,
  fullBleed,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  fullBleed?: boolean;
}) {
  const { user, hydrated, logout } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.navigate({ to: "/login" });
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="size-2.5 animate-ping rounded-full bg-primary" />
          Preparing your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="aurora" aria-hidden />
      <div className="relative z-10 flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border/60 p-5 lg:flex glass">
          <Link to="/dashboard">
            <BrandMark />
          </Link>
          <NavList />
          <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start gap-2 text-muted-foreground"
              onClick={() => {
                logout();
                router.navigate({ to: "/" });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 px-4 py-3.5 glass sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <BrandMark className="mb-6" />
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              )}
            </div>
            {action}
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {settings.theme === "dark" ? (
                <Sun className="size-4.5" />
              ) : (
                <Moon className="size-4.5" />
              )}
            </Button>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn("min-w-0 flex-1", fullBleed ? "" : "px-4 py-6 sm:px-6 sm:py-8")}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
