import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FileDown, FileText, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/Markdown";
import { StudyPackDialog } from "@/features/studyPack/StudyPackDialog";
import { useApp } from "@/context/AppContext";
import { downloadMarkdown, downloadPdf } from "@/utils/export";

export const Route = createFileRoute("/study-packs")({
  head: () => ({
    meta: [
      { title: "Study Packs — Notes, MCQs & Flashcards from Your Lecture" },
      {
        name: "description",
        content:
          "Every ContextBell study pack: detailed notes, mind maps, MCQs, flashcards, cheat sheets and roadmaps, exportable as PDF or Markdown.",
      },
      { property: "og:title", content: "Study Packs — ContextBell" },
      { property: "og:description", content: "Exam-ready study material generated from your lecture context." },
    ],
  }),
  component: StudyPacksPage,
});

function StudyPacksPage() {
  const { data, deleteStudyPack } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const latestSession = data.sessions[0];

  return (
    <AppShell title="Study Packs" subtitle="Generated from your captured lecture context">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.studyPacks.length} saved packs</p>
        <Button onClick={() => setCreating(true)}>
          <BookOpen className="size-4" /> New study pack
        </Button>
      </div>

      {data.studyPacks.length === 0 ? (
        <div className="glass mt-4 flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
          <BookOpen className="size-7 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">No study packs yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ring the ContextBell during a lecture, then tap “Generate Study Pack” under any AI answer.
          </p>
          <Button onClick={() => setCreating(true)}>Create one now</Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.studyPacks.map((pack) => (
            <div key={pack.id} className="glass card-hover rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold">{pack.title}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(pack.createdAt).toLocaleString()} · {pack.sections.length} sections
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteStudyPack(pack.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pack.sections.slice(0, 5).map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
              {openId === pack.id && (
                <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-border/60 p-4">
                  <Markdown>{pack.markdown}</Markdown>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setOpenId(openId === pack.id ? null : pack.id)}>
                  {openId === pack.id ? "Hide" : "Read"}
                </Button>
                <Button size="sm" onClick={() => downloadPdf(pack.title, pack.markdown)}>
                  <FileDown className="size-3.5" /> PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={() => downloadMarkdown(pack.title, pack.markdown)}>
                  <FileText className="size-3.5" /> Markdown
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <StudyPackDialog
          open
          onOpenChange={(o) => !o && setCreating(false)}
          topic={latestSession?.title ?? "General revision"}
          {...(latestSession?.transcript ? { transcript: latestSession.transcript } : {})}
          {...(latestSession?.id ? { sessionId: latestSession.id } : {})}
        />
      )}
    </AppShell>
  );
}
