import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Brain, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import {
  teacherMisconceptions,
  teacherSupportList,
  teacherTopicDoubts,
  teacherTrend,
} from "@/data/demo";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Insights — ContextBell Classroom Analytics" },
      {
        name: "description",
        content:
          "See which lecture topics confuse students most, AI summaries of misconceptions and class learning trends.",
      },
      { property: "og:title", content: "Teacher Insights — ContextBell" },
      {
        property: "og:description",
        content: "Privacy-respecting classroom analytics built from real student doubts.",
      },
    ],
  }),
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const { data } = useApp();
  const totalDoubts = teacherTopicDoubts.reduce((n, t) => n + t.doubts, 0) + data.doubts.length;

  return (
    <AppShell title="Classroom Insights" subtitle="Aggregated and anonymised — student privacy respected">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Doubts raised", value: totalDoubts, icon: Brain },
          { label: "Topics tracked", value: teacherTopicDoubts.length, icon: ShieldCheck },
          { label: "Needs support", value: teacherSupportList.length, icon: Users },
          {
            label: "Unresolved",
            value: teacherTopicDoubts.reduce((n, t) => n + t.unresolved, 0),
            icon: AlertTriangle,
          },
        ].map((s) => (
          <div key={s.label} className="glass card-hover rounded-3xl p-5">
            <span className="gradient-hero flex size-9 items-center justify-center rounded-xl text-primary-foreground">
              <s.icon className="size-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Most-asked topics</h2>
          <p className="text-xs text-muted-foreground">Number of doubts raised per topic</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherTopicDoubts} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="topic"
                  width={130}
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="doubts" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Learning trend</h2>
          <p className="text-xs text-muted-foreground">Doubts raised vs resolved across the class</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teacherTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="doubts" stroke="var(--color-chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="var(--color-chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">AI-summarised misconceptions</h2>
          <div className="mt-3 space-y-3">
            {teacherMisconceptions.map((m) => (
              <div key={m.topic} className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{m.topic}</p>
                  <Badge variant={m.severity === "High" ? "destructive" : "secondary"}>{m.severity}</Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{m.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Students who may need support</h2>
          <p className="text-xs text-muted-foreground">
            Identified by repeated or unresolved doubts — shown as anonymous aliases.
          </p>
          <div className="mt-3 space-y-2">
            {teacherSupportList.map((s) => (
              <div
                key={s.alias}
                className="flex items-center justify-between rounded-2xl border border-border/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{s.alias}</p>
                  <p className="text-[11px] text-muted-foreground">Struggling with {s.topic}</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <p>{s.repeated} repeated</p>
                  <p>{s.unresolved} unresolved</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-base font-semibold">Live doubt feed</h2>
        <p className="text-xs text-muted-foreground">Captured through the ContextBell button</p>
        <div className="mt-3 space-y-2">
          {data.doubts.slice(0, 6).map((d) => (
            <div key={d.id} className="rounded-2xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{d.topic}</p>
                <Badge variant={d.resolved ? "secondary" : "outline"}>
                  {d.resolved ? "resolved" : "open"}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {d.studentAlias} · {d.source} · {new Date(d.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
