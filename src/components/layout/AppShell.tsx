import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  BookMarked,
  BookOpen,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Moon,
  NotebookPen,
  Presentation,
  Settings,
  Sparkles,
  Sun,
  Users,
  Youtube,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { FloatingContextBell } from "@/features/recording/FloatingContextBell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher", label: "Teacher Insights", icon: Presentation },
  { to: "/chat", label: "AI Chat", icon: Sparkles },
  { to: "/youtube", label: "YouTube Learning", icon: Youtube },
  { to: "/record", label: "Record Context", icon: Mic },
  { to: "/study-packs", label: "Study Packs", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/bookmarks", label: "Bookmarks", icon: BookMarked },
  { to: "/sessions", label: "Learning Sessions", icon: Home },
  { to: "/profile", label: "Profile", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/credits", label: "Credits", icon: Users },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { user, settings, updateSettings, signOut } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-aurora absolute -left-40 -top-40 size-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="animate-aurora absolute -bottom-52 right-0 size-[30rem] rounded-full bg-accent/15 blur-3xl [animation-delay:-6s]" />
      </div>

      <div className="relative flex">
        <aside
          className={cn(
            "glass fixed z-40 flex h-screen w-64 flex-col rounded-none border-y-0 border-l-0 p-4 transition-transform lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Link to="/" className="flex items-center gap-2.5 px-2 py-3">
            <span className="gradient-gold flex size-9 items-center justify-center rounded-xl shadow-glow">
              <Bell className="size-4 text-accent-foreground" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ContextBell</span>
          </Link>

          <nav className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
            {NAV.filter((item) => item.to !== "/teacher" || user?.role === "teacher").map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                    active
                      ? "bg-primary/12 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 rounded-2xl border border-border/60 p-3">
            <div className="flex items-center gap-3">
              <span className="gradient-hero flex size-9 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground">
                {user?.avatar ?? "CB"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name ?? "Guest"}</p>
                <p className="truncate text-[11px] capitalize text-muted-foreground">
                  {user?.role ?? "not signed in"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={signOut} asChild={false}>
              <span className="flex items-center gap-2">
                <LogOut className="size-3.5" /> Sign out
              </span>
            </Button>
          </div>
        </aside>

        <div className="flex-1 lg:pl-64">
          <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-5 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)}>
                <Menu className="size-5" />
              </Button>
              <div>
                <h1 className="font-display text-lg font-semibold leading-tight">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
            >
              {settings.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-6xl px-5 py-7"
          >
            {children}
          </motion.main>
        </div>
      </div>

      <FloatingContextBell />
    </div>
  );
}
