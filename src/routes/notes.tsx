import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { useApp } from "@/context/AppContext";
import { uid } from "@/services/storage";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "My Lecture Notes — ContextBell" },
      {
        name: "description",
        content: "All notes saved from your lecture-grounded AI explanations, in one searchable place.",
      },
      { property: "og:title", content: "My Lecture Notes — ContextBell" },
      { property: "og:description", content: "Keep every explanation your teacher gave, organised." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { data, addNote, deleteNote } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");

  const notes = data.notes.filter(
    (n) =>
      !query.trim() ||
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.body.toLowerCase().includes(query.toLowerCase()),
  );

  const save = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Add a title and some content");
      return;
    }
    addNote({
      id: uid("note"),
      title: title.trim(),
      body: body.trim(),
      tags: ["manual"],
      createdAt: new Date().toISOString(),
    });
    setTitle("");
    setBody("");
    toast.success("Note saved");
  };

  return (
    <AppShell title="Notes" subtitle="Saved explanations and your own revision notes">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="glass h-fit rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">New note</h2>
          <Input
            className="mt-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title"
          />
          <Textarea
            className="mt-2 min-h-40"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Markdown supported…"
          />
          <Button className="mt-3 w-full" onClick={save}>
            <Plus className="size-4" /> Save note
          </Button>
        </div>

        <div>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" />
          {notes.length === 0 ? (
            <div className="glass mt-4 flex flex-col items-center gap-2 rounded-3xl p-12 text-center">
              <NotebookPen className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No notes yet — save an AI explanation from any chat.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="glass rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold">{n.title}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteNote(n.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-2 max-h-64 overflow-y-auto">
                    <Markdown>{n.body}</Markdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
