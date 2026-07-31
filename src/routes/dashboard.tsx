import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  BookMarked,
  BookOpen,
  Flame,
  MessageSquare,
  NotebookPen,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/context/AppContext";
import { useContextBell } from "@/features/recording/ContextBellProvider";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — ContextBell" },
      {
        name: "description",
        content: "Track your learning streak, lecture sessions, notes, study packs and progress.",
      },
      { property: "og:title", content: "Student Dashboard — ContextBell" },
      { property: "og:description", content: "Your contextual learning progress at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, user, hydrated } = useApp();
  const bell = useContextBell();
  const { sessions, chats, notes, bookmarks, studyPacks, progress } = data;

  const stats = [
    { label: "Learning streak", value: `${progress.streak} days`, icon: Flame },
    { label: "Sessions captured", value: sessions.length, icon: Bell },
    { label: "Study packs", value: studyPacks.length, icon: BookOpen },
    { label: "Minutes studied", value: progress.minutesStudied, icon: Timer },
  ];

  const weekly = progress.weekly;
  const topicProgress = progress.topicsLearned.slice(0, 5);

  return (
    <AppShell
      title={`Welcome back${user ? `, ${user.name.split(" ")[0]}` : ""}`}
      subtitle={user ? `${user.role === "teacher" ? "Faculty" : "Student"} ID · ${user.studentId}` : "Sign in to save your progress"}
    >
      {!user && (
        <div className="glass mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">
            You're browsing as a guest. Create an account to keep sessions, notes and study packs.
          </p>
          <Button asChild>
            <Link to="/signup">Create account</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass card-hover rounded-3xl p-5"
          >
            <span className="gradient-hero flex size-9 items-center justify-center rounded-xl text-primary-foreground">
              <s.icon className="size-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-semibold">{hydrated ? s.value : "—"}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-3xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Weekly learning activity</h2>
              <p className="text-xs text-muted-foreground">Doubts rung & minutes studied</p>
            </div>
            <TrendingUp className="size-4 text-accent" />
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="minutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="var(--color-chart-1)" fill="url(#minutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Doubts per day</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="doubts" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Recent lecture sessions</h2>
          {sessions.length === 0 ? (
            <EmptyState
              text="No sessions yet. Ring the ContextBell during a lecture."
              action={
                <Button size="sm" onClick={() => bell.setPanelOpen(true)}>
                  <Bell className="size-3.5" /> Start capture
                </Button>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id} className="rounded-2xl border border-border/60 p-3">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.source} · {s.contextWindow}s window · {new Date(s.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Recent AI chats</h2>
          {chats.length === 0 ? (
            <EmptyState text="Your conversations will appear here." />
          ) : (
            <ul className="mt-3 space-y-2">
              {chats.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: c.id }}
                    className="flex items-center gap-2 rounded-2xl border border-border/60 p-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    <MessageSquare className="size-3.5 text-accent" />
                    <span className="truncate">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Topics learned</h2>
          {topicProgress.length === 0 ? (
            <EmptyState text="Capture a lecture to build your topic map." />
          ) : (
            <div className="mt-3 space-y-3">
              {topicProgress.map((t, i) => (
                <div key={t}>
                  <p className="truncate text-xs font-medium">{t}</p>
                  <Progress value={Math.max(30, 95 - i * 12)} className="mt-1.5 h-1.5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <QuickCard to="/notes" icon={NotebookPen} label="Saved notes" count={notes.length} />
        <QuickCard to="/bookmarks" icon={BookMarked} label="Bookmarks" count={bookmarks.length} />
        <QuickCard to="/study-packs" icon={BookOpen} label="Study packs" count={studyPacks.length} />
      </div>
    </AppShell>
  );
}

function QuickCard({
  to,
  icon: Icon,
  label,
  count,
}: {
  to: string;
  icon: typeof BookOpen;
  label: string;
  count: number;
}) {
  return (
    <Link to={to} className="glass card-hover flex items-center justify-between rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <span className="gradient-gold flex size-9 items-center justify-center rounded-xl text-accent-foreground">
          <Icon className="size-4" />
        </span>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <span className="font-display text-xl font-semibold">{count}</span>
    </Link>
  );
}

function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 p-6 text-center">
      <Bell className="size-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
