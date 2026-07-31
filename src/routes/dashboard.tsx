import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BookMarked,
  Clock,
  Flame,
  MessageSquare,
  Mic,
  NotebookPen,
  Play,
  Sparkle,
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
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, SectionCard, StatCard } from "@/components/ui-kit";
import { useAuth } from "@/features/auth/auth-context";
import { useLocalStore } from "@/hooks/use-local-store";
import { KEYS } from "@/lib/storage";
import type { ActivityItem, Bookmark, ChatSession, LearningStats, Note, Recording } from "@/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · ContextBell" },
      {
        name: "description",
        content:
          "Track your learning streak, recordings, chats, notes and study progress in ContextBell.",
      },
      { property: "og:title", content: "Dashboard · ContextBell" },
      { property: "og:description", content: "Your contextual learning command center." },
    ],
  }),
  component: DashboardPage,
});

const ICONS: Record<ActivityItem["type"], typeof Mic> = {
  recording: Mic,
  chat: MessageSquare,
  note: NotebookPen,
  video: Play,
  auth: Sparkle,
};

function DashboardPage() {
  const { user } = useAuth();
  const recordings = useLocalStore<Recording[]>(KEYS.recordings, []).value;
  const chats = useLocalStore<ChatSession[]>(KEYS.chats, []).value;
  const notes = useLocalStore<Note[]>(KEYS.notes, []).value;
  const bookmarks = useLocalStore<Bookmark[]>(KEYS.bookmarks, []).value;
  const activity = useLocalStore<ActivityItem[]>(KEYS.activity, []).value;
  const stats = useLocalStore<LearningStats>(KEYS.stats, {
    streak: 1,
    minutes: 0,
    lastActive: new Date().toISOString(),
    history: [],
  }).value;

  const chartData = buildChart(stats);
  const learningHours = Math.round((stats.minutes / 60) * 10) / 10;
  const goal = Math.min(100, Math.round((stats.minutes / 120) * 100));
  const lastChat = chats[0];

  return (
    <AppShell
      title={`Welcome back, ${user?.name.split(" ")[0] ?? "learner"} 👋`}
      subtitle={`User ID ${user?.id} · joined ${new Date(user?.joinedAt ?? Date.now()).toLocaleDateString()}`}
      action={
        <Button asChild size="sm" className="gap-2">
          <Link to="/record">
            <Mic className="size-4" /> Record Context
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Flame}
            label="Learning streak"
            value={`${stats.streak}d`}
            hint="Keep it alive today"
            accent
            delay={0}
          />
          <StatCard
            icon={Clock}
            label="Learning hours"
            value={learningHours}
            hint={`${Math.round(stats.minutes)} minutes total`}
            delay={0.05}
          />
          <StatCard
            icon={Mic}
            label="Recordings"
            value={recordings.length}
            hint="Contexts captured"
            delay={0.1}
          />
          <StatCard
            icon={MessageSquare}
            label="Chats"
            value={chats.length}
            hint="AI conversations"
            delay={0.15}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={NotebookPen}
            label="Notes"
            value={notes.length}
            hint={`${notes.filter((n) => n.pinned).length} pinned`}
            delay={0.05}
          />
          <StatCard
            icon={BookMarked}
            label="Bookmarks"
            value={bookmarks.length}
            hint="Saved for later"
            accent
            delay={0.1}
          />
          <div className="glass-card p-5 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Weekly goal · 2 hours
            </p>
            <p className="mt-3 font-display text-3xl font-semibold">{goal}%</p>
            <Progress value={goal} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {goal >= 100
                ? "Goal smashed — go deeper on revision."
                : "Record one more confusing concept to move ahead."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <SectionCard title="Study minutes" description="Last 7 days of focused learning">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="minutesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    fill="url(#minutesFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Questions asked" description="Chat volume per day">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="chats" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Continue learning"
            description="Pick up where you left off"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/chat">Open chat</Link>
              </Button>
            }
          >
            {lastChat ? (
              <Link
                to="/chat"
                search={{ session: lastChat.id }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-secondary/40 p-4 transition-colors hover:bg-secondary"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <MessageSquare className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{lastChat.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lastChat.messages.length} messages · updated{" "}
                    {new Date(lastChat.updatedAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ) : (
              <EmptyState
                icon={Mic}
                title="No sessions yet"
                description="Record a confusing explanation and ContextBell will answer from it."
                action={
                  <Button asChild size="sm">
                    <Link to="/record">Record context</Link>
                  </Button>
                }
              />
            )}

            {recordings.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Recent recordings
                </p>
                {recordings.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 truncate">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {Math.round(r.durationSec)}s
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent activity" description="Everything you did lately">
            {activity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Nothing here yet"
                description="Your recordings, chats and notes will show up here."
              />
            ) : (
              <ul className="space-y-2">
                {activity.slice(0, 8).map((a) => {
                  const Icon = ICONS[a.type] ?? Activity;
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-secondary/50"
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{a.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function buildChart(stats: LearningStats) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const found = stats.history.find((h) => h.date === key);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: found?.minutes ?? 0,
      chats: found?.chats ?? 0,
    };
  });
  return days;
}
