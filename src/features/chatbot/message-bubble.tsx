import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Copy,
  GraduationCap,
  HelpCircle,
  Layers,
  ListChecks,
  Loader2,
  NotebookPen,
  Sparkles,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { db, logActivity, uid } from "@/lib/storage";
import type { ChatMessage, Note, StudyKit } from "@/types";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  onGenerateKit,
  kit,
  kitLoading,
}: {
  message: ChatMessage;
  onGenerateKit: () => void;
  kit?: StudyKit;
  kitLoading: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      {isUser ? (
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </div>
      ) : (
        <div className="w-full max-w-3xl">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-primary">
              <Brain className="size-3.5" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">ContextBell</span>
            {message.usedGeneralKnowledge && (
              <Badge variant="outline" className="border-accent/50 text-[10px] text-accent">
                extends beyond recording
              </Badge>
            )}
          </div>
          <Markdown>{message.content}</Markdown>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success("Answer copied");
              }}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                const note: Note = {
                  id: uid("note"),
                  title: message.content.slice(0, 48).replace(/[#*`]/g, "") || "AI note",
                  content: message.content,
                  source: "ai",
                  pinned: false,
                  tags: ["chat"],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                db.setNotes([note, ...db.notes()]);
                logActivity("note", `Saved AI note: ${note.title}`);
                toast.success("Saved to Notes");
              }}
            >
              <NotebookPen className="size-3.5" /> Save note
            </Button>
            <Button
              size="sm"
              variant={kit ? "ghost" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={onGenerateKit}
              disabled={kitLoading}
            >
              {kitLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {kit ? "Regenerate study kit" : "Generate study kit"}
            </Button>
          </div>
          {kit && <StudyKitPanel kit={kit} />}
        </div>
      )}
    </motion.div>
  );
}

export function StudyKitPanel({ kit }: { kit: StudyKit }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mt-4 p-4"
    >
      <Tabs defaultValue="summary">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            ["summary", "Summary", Sparkles],
            ["notes", "Revision", ListChecks],
            ["questions", "Questions", HelpCircle],
            ["mcqs", "MCQs", ListChecks],
            ["flashcards", "Flashcards", Layers],
            ["viva", "Viva & Interview", GraduationCap],
            ["refs", "References", BookOpen],
          ].map(([value, label, Icon]) => {
            const IconC = Icon as typeof BookOpen;
            return (
              <TabsTrigger
                key={value as string}
                value={value as string}
                className="gap-1.5 text-xs"
              >
                <IconC className="size-3.5" />
                {label as string}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="summary" className="mt-4 text-sm">
          <Markdown>{kit.summary}</Markdown>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ul className="space-y-2 text-sm">
            {kit.revisionNotes.map((n, i) => (
              <li key={i} className="rounded-lg border border-border/60 px-3 py-2">
                {n}
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 gap-1.5"
            onClick={() => {
              const note: Note = {
                id: uid("note"),
                title: kit.summary.slice(0, 48) || "AI revision notes",
                content: `## Summary\n${kit.summary}\n\n## Revision notes\n${kit.revisionNotes
                  .map((n) => `- ${n}`)
                  .join("\n")}\n\n## Important questions\n${kit.importantQuestions
                  .map((q) => `- ${q}`)
                  .join("\n")}`,
                source: "ai",
                pinned: false,
                tags: ["study-kit"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              db.setNotes([note, ...db.notes()]);
              logActivity("note", "Saved AI revision notes");
              toast.success("Revision notes saved");
            }}
          >
            <NotebookPen className="size-3.5" /> Save as note
          </Button>
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {kit.importantQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="mcqs" className="mt-4 space-y-4">
          {kit.mcqs.map((m, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-3 text-sm">
              <p className="font-medium">
                {i + 1}. {m.question}
              </p>
              <ul className="mt-2 space-y-1">
                {m.options.map((o, j) => (
                  <li key={j} className="rounded-md px-2 py-1 text-muted-foreground">
                    {String.fromCharCode(65 + j)}. {o}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-medium text-primary">Answer: {m.answer}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="flashcards" className="mt-4 grid gap-3 sm:grid-cols-2">
          {kit.flashcards.map((f, i) => (
            <button
              key={i}
              onClick={() => setRevealed((p) => ({ ...p, [i]: !p[i] }))}
              className="min-h-24 rounded-xl border border-border/60 bg-secondary/40 p-4 text-left text-sm transition-colors hover:bg-secondary"
            >
              <p className="font-medium">{f.front}</p>
              <p className="mt-2 text-muted-foreground">{revealed[i] ? f.back : "Tap to reveal"}</p>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="viva" className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Viva questions
            </p>
            <ul className="space-y-1.5">
              {kit.vivaQuestions.map((q, i) => (
                <li key={i} className="rounded-lg border border-border/60 px-3 py-2">
                  {q}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interview questions
            </p>
            <ul className="space-y-1.5">
              {kit.interviewQuestions.map((q, i) => (
                <li key={i} className="rounded-lg border border-border/60 px-3 py-2">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="refs" className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reference books
            </p>
            <ul className="space-y-2">
              {kit.referenceBooks.map((b, i) => (
                <li key={i} className="rounded-lg border border-border/60 px-3 py-2">
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.author} · {b.why}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reference videos
            </p>
            <ul className="space-y-2">
              {kit.referenceVideos.map((v, i) => (
                <li key={i} className="rounded-lg border border-border/60 px-3 py-2">
                  <p className="font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.channel}</p>
                  <a
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Youtube className="size-3.5" /> Search on YouTube
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
