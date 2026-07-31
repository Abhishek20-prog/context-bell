import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, FileAudio, Loader2, Radio, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { LECTURE_SOURCES, useContextBell } from "@/features/recording/ContextBellProvider";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { ContextWindow } from "@/types";

const WINDOWS: ContextWindow[] = [20, 30, 45, 60];

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Record Lecture Context — ContextBell" },
      {
        name: "description",
        content:
          "Capture context from offline classes, Google Meet, Zoom, uploaded audio or video and turn it into AI explanations.",
      },
      { property: "og:title", content: "Record Lecture Context — ContextBell" },
      {
        property: "og:description",
        content: "One workflow for every lecture source: classroom, Meet, Zoom, YouTube, audio and video.",
      },
    ],
  }),
  component: RecordPage,
});

function RecordPage() {
  const bell = useContextBell();
  const { data } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("audio") && !file.type.startsWith("video")) {
      toast.error("Please upload an audio or video lecture file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is larger than 20MB — trim the lecture segment first");
      return;
    }
    void bell.captureFromFile(file);
  };

  return (
    <AppShell title="Record Context" subtitle="Choose your lecture source — the workflow is identical for all">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Lecture source</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {LECTURE_SOURCES.map((s) => {
              const active = bell.source === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    bell.setSource(s.id);
                    if (s.mode === "file") fileRef.current?.click();
                    else void bell.startListening(s.id);
                  }}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    active ? "border-accent bg-accent/10 shadow-glow" : "border-border/60 hover:bg-muted/60",
                  )}
                >
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{s.hint}</p>
                </button>
              );
            })}
          </div>

          <h3 className="mt-6 text-sm font-semibold">Context window</h3>
          <p className="text-xs text-muted-foreground">
            How much lecture around your moment of confusion should ContextBell capture?
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => bell.setContextWindow(w)}
                className={cn(
                  "rounded-2xl border py-3 text-sm font-semibold transition-all",
                  bell.contextWindow === w
                    ? "gradient-gold border-transparent text-accent-foreground shadow-glow"
                    : "border-border/60 hover:bg-muted/60",
                )}
              >
                {w}s
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {bell.listening ? (
              <>
                <Button variant="destructive" onClick={bell.stopListening}>
                  <Square className="size-4" /> Stop listening
                </Button>
                <Button onClick={() => void bell.ring()} disabled={bell.busy}>
                  {bell.busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
                  Ring ContextBell now
                </Button>
              </>
            ) : (
              <Button onClick={() => void bell.startListening()}>
                <Radio className="size-4" /> Start listening
              </Button>
            )}
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Upload lecture file
            </Button>
          </div>

          {bell.listening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 rounded-2xl border border-accent/40 bg-accent/5 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Buffering · {bell.elapsed}s in memory
              </p>
              <div className="mt-3 flex h-10 items-end gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full bg-accent/70"
                    style={{
                      height: `${Math.max(6, Math.min(100, bell.level * 300 * (0.4 + Math.abs(Math.sin(i * 0.7 + bell.elapsed)))))}%`,
                      transition: "height 120ms linear",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center transition-colors",
              dragging ? "border-accent bg-accent/10" : "border-border/70",
            )}
          >
            <FileAudio className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Drop an audio or video lecture here</p>
            <p className="text-xs text-muted-foreground">MP3 · WAV · M4A · MP4 · WebM (max 20MB)</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold">Captured sessions</h2>
          {data.sessions.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 p-8 text-center">
              <Bell className="size-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Nothing captured yet. Start listening, then ring the bell.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.sessions.slice(0, 8).map((s) => (
                <li key={s.id} className="rounded-2xl border border-border/60 p-3">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.source} · {s.contextWindow}s · {new Date(s.createdAt).toLocaleTimeString()}
                  </p>
                  {s.chatId && (
                    <Link
                      to="/chat/$chatId"
                      params={{ chatId: s.chatId }}
                      className="mt-1 inline-block text-[11px] text-accent underline decoration-dotted"
                    >
                      Open conversation
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
