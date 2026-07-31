import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AudioLines, Check, Loader2, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, SectionCard } from "@/components/ui-kit";
import { formatDuration, useRecorder } from "@/features/recording/use-recorder";
import { aiService } from "@/services/ai-service";
import { useLocalStore } from "@/hooks/use-local-store";
import { KEYS, db, logActivity, trackLearning, uid } from "@/lib/storage";
import type { ChatSession, Recording } from "@/types";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Record Context · ContextBell" },
      {
        name: "description",
        content:
          "Record only the confusing part of a lecture — ContextBell transcribes it and uses it as AI context.",
      },
      { property: "og:title", content: "Record Context · ContextBell" },
      {
        property: "og:description",
        content: "Capture the confusing minute and turn it into AI context.",
      },
    ],
  }),
  component: RecordPage,
});

function RecordPage() {
  const recorder = useRecorder();
  const router = useRouter();
  const { value: recordings, setValue: setRecordings } = useLocalStore<Recording[]>(
    KEYS.recordings,
    [],
  );
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [processing, setProcessing] = useState(false);
  const [draft, setDraft] = useState<Recording | null>(null);

  const handleStop = async () => {
    const result = await recorder.stop();
    if (!result) {
      toast.error(recorder.error ?? "Recording was empty");
      recorder.reset();
      return;
    }
    setProcessing(true);
    const record: Recording = {
      id: uid("rec"),
      title: title.trim() || `Lecture context · ${new Date().toLocaleString()}`,
      subject: subject.trim() || "General",
      createdAt: new Date().toISOString(),
      durationSec: result.durationSec,
      transcript: "",
      status: "processing",
    };
    try {
      const transcript = await aiService.transcribe(result.blob);
      if (!transcript.trim()) throw new Error("No speech detected in that recording.");
      const ready: Recording = { ...record, transcript, status: "ready" };
      setRecordings([ready, ...recordings]);
      setDraft(ready);
      logActivity("recording", `Recorded context: ${ready.title}`);
      trackLearning(Math.max(1, Math.round(result.durationSec / 60)));
      toast.success("Transcript ready — ask ContextBell anything about it");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process recording");
    } finally {
      setProcessing(false);
      recorder.reset();
      setTitle("");
      setSubject("");
    }
  };

  const askAboutRecording = (recording: Recording) => {
    const session: ChatSession = {
      id: uid("chat"),
      title: recording.title,
      recordingId: recording.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    db.setChats([session, ...db.chats()]);
    logActivity("chat", `Started chat on ${recording.title}`);
    router.navigate({ to: "/chat", search: { session: session.id } });
  };

  const remove = (id: string) => {
    setRecordings(recordings.filter((r) => r.id !== id));
    toast.success("Recording deleted");
  };

  const isRecording = recorder.state === "recording" || recorder.state === "paused";

  return (
    <AppShell
      title="Record Context"
      subtitle="Capture only the confusing explanation — 20 to 90 seconds is perfect."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <SectionCard
          title="New context recording"
          description="Your microphone audio never leaves this device except to be transcribed."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rtitle">Title (optional)</Label>
              <Input
                id="rtitle"
                placeholder="Convolution intuition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isRecording}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsubject">Subject (optional)</Label>
              <Input
                id="rsubject"
                placeholder="Signals & Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isRecording}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-secondary/30 p-8">
            <motion.button
              type="button"
              onClick={isRecording ? handleStop : recorder.start}
              disabled={processing}
              whileTap={{ scale: 0.94 }}
              className="relative grid size-24 place-items-center rounded-full bg-gradient-hero glow-ring disabled:opacity-60"
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {processing ? (
                <Loader2 className="size-8 animate-spin text-primary-foreground" />
              ) : isRecording ? (
                <Square className="size-7 text-primary-foreground" />
              ) : (
                <Mic className="size-8 text-primary-foreground" />
              )}
              {recorder.state === "recording" && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.button>

            <p className="font-mono text-3xl font-semibold tabular-nums">
              {formatDuration(recorder.seconds)}
            </p>

            <div className="flex h-14 w-full max-w-md items-end gap-1">
              {Array.from({ length: 48 }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-full bg-primary/60 transition-all duration-100"
                  style={{
                    height: isRecording
                      ? `${Math.max(6, Math.min(100, recorder.level * 320 * (0.5 + Math.abs(Math.sin((i + recorder.seconds) / 3)))))}%`
                      : "6%",
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {isRecording && (
                <Button variant="outline" onClick={recorder.togglePause} className="gap-2">
                  {recorder.state === "paused" ? (
                    <Play className="size-4" />
                  ) : (
                    <Pause className="size-4" />
                  )}
                  {recorder.state === "paused" ? "Resume" : "Pause"}
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                {processing
                  ? "Transcribing your context…"
                  : isRecording
                    ? "Recording — press stop when the teacher finishes the point."
                    : "Press the mic to start recording."}
              </p>
            </div>
            {recorder.error && <p className="text-sm text-destructive">{recorder.error}</p>}
          </div>
        </SectionCard>

        {draft && (
          <SectionCard
            title="Transcript ready"
            description={draft.title}
            action={
              <Button size="sm" className="gap-2" onClick={() => askAboutRecording(draft)}>
                <AudioLines className="size-4" /> Ask ContextBell
              </Button>
            }
          >
            <Textarea readOnly value={draft.transcript} className="min-h-40 font-mono text-xs" />
          </SectionCard>
        )}

        <SectionCard title="Your recordings" description={`${recordings.length} saved contexts`}>
          {recordings.length === 0 ? (
            <EmptyState
              icon={Mic}
              title="No recordings yet"
              description="Record the confusing part of a lecture and it will appear here as reusable AI context."
            />
          ) : (
            <ul className="space-y-3">
              {recordings.map((r) => (
                <li key={r.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        {r.title}
                        {r.status === "ready" && <Check className="size-4 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.subject} · {formatDuration(r.durationSec)} ·{" "}
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => askAboutRecording(r)}>
                        Ask AI
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(r.id)}
                        aria-label="Delete recording"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{r.transcript}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
