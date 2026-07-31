import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Clock, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useContextBell } from "@/features/recording/ContextBellProvider";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Learning Sessions — Captured Lecture Contexts" },
      {
        name: "description",
        content: "Every lecture segment ContextBell captured, with transcripts and linked AI conversations.",
      },
      { property: "og:title", content: "Learning Sessions — ContextBell" },
      { property: "og:description", content: "Replay the exact lecture context behind every doubt." },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data } = useApp();
  const bell = useContextBell();

  return (
    <AppShell title="Learning Sessions" subtitle="Transcripts captured around your moments of confusion">
      {data.sessions.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
          <Bell className="size-7 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">No sessions captured</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Start listening to a lecture and ring the bell whenever something doesn't click.
          </p>
          <Button onClick={() => bell.setPanelOpen(true)}>Start a capture</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s) => (
            <div key={s.id} className="glass rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold">{s.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {s.source.replace("-", " ")}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 size-3" />
                    {s.contextWindow}s
                  </Badge>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(s.createdAt).toLocaleString()}
              </p>
              <p className="mt-3 max-h-32 overflow-y-auto rounded-2xl border border-border/60 p-3 text-xs text-muted-foreground">
                {s.transcript}
              </p>
              {s.chatId && (
                <Button size="sm" variant="secondary" className="mt-3" asChild>
                  <Link to="/chat/$chatId" params={{ chatId: s.chatId }}>
                    <MessageSquare className="size-3.5" /> Open conversation
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
