import { createFileRoute } from "@tanstack/react-router";
import { Download, NotebookPen, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Markdown } from "@/components/markdown";
import { EmptyState } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStore } from "@/hooks/use-local-store";
import { KEYS, logActivity, uid } from "@/lib/storage";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes · ContextBell" },
      {
        name: "description",
        content: "Write, pin and export lecture notes alongside AI-generated revision material.",
      },
      { property: "og:title", content: "Notes · ContextBell" },
      {
        property: "og:description",
        content: "Your lecture notes and AI revision material in one place.",
      },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { value: notes, setValue: setNotes } = useLocalStore<Note[]>(KEYS.notes, []);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [notes, query]);

  const active = sorted.find((n) => n.id === activeId) ?? sorted[0] ?? null;

  const create = () => {
    const note: Note = {
      id: uid("note"),
      title: "Untitled note",
      content: "",
      source: "manual",
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setActiveId(note.id);
    logActivity("note", "Created a note");
  };

  const patch = (id: string, p: Partial<Note>) =>
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, ...p, updatedAt: new Date().toISOString() } : n)),
    );

  const exportNote = (note: Note) => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^\w\s-]/g, "").trim() || "note"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Note exported as Markdown");
  };

  return (
    <AppShell
      title="Notes"
      subtitle={`${notes.length} note${notes.length === 1 ? "" : "s"} saved on this device`}
      action={
        <Button size="sm" className="gap-2" onClick={create}>
          <Plus className="size-4" /> New note
        </Button>
      }
    >
      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Create a note manually, or save an AI answer from the chat to build your revision library."
          action={
            <Button className="gap-2" onClick={create}>
              <Plus className="size-4" /> New note
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes"
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {sorted.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActiveId(n.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active?.id === n.id
                      ? "border-primary/40 bg-secondary"
                      : "border-border/60 hover:bg-secondary/60",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {n.pinned && <Pin className="size-3.5 shrink-0 text-primary" />}
                    <p className="truncate text-sm font-medium">{n.title}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {n.content || "Empty note"}
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {n.source === "ai" ? "AI generated" : "Manual"}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {active && (
            <div className="glass-card space-y-4 p-5">
              <Input
                value={active.title}
                onChange={(e) => patch(active.id, { title: e.target.value })}
                className="border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => patch(active.id, { pinned: !active.pinned })}
                >
                  {active.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  {active.pinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => exportNote(active)}
                >
                  <Download className="size-3.5" /> Export
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-destructive"
                  onClick={() => {
                    setNotes(notes.filter((n) => n.id !== active.id));
                    setActiveId(null);
                    toast.success("Note deleted");
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
              <Textarea
                value={active.content}
                onChange={(e) => patch(active.id, { content: e.target.value })}
                placeholder="Write in Markdown — headings, lists and $math$ are supported."
                className="min-h-56 resize-y"
              />
              {active.content && (
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Preview
                  </p>
                  <Markdown>{active.content}</Markdown>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
