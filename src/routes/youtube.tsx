import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, BookMarked, Radio, Search, Youtube } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { youtubeTopics } from "@/data/demo";
import { useApp } from "@/context/AppContext";
import { useContextBell } from "@/features/recording/ContextBellProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/youtube")({
  head: () => ({
    meta: [
      { title: "YouTube Learning — Watch & Ring ContextBell" },
      {
        name: "description",
        content:
          "Search educational YouTube lectures, watch them inside ContextBell and capture context whenever you get confused.",
      },
      { property: "og:title", content: "YouTube Learning — ContextBell" },
      {
        property: "og:description",
        content: "Watch lectures inside ContextBell and get lecture-grounded AI explanations.",
      },
    ],
  }),
  component: YoutubeLearning,
});

function extractVideoId(value: string) {
  const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match?.[1] ?? (/^[\w-]{11}$/.test(value.trim()) ? value.trim() : null);
}

function YoutubeLearning() {
  const bell = useContextBell();
  const { toggleBookmark } = useApp();
  const [query, setQuery] = useState("react js full course tutorial");
  const [activeQuery, setActiveQuery] = useState("react js full course tutorial");
  const [videoId, setVideoId] = useState<string | null>(null);

  const embedSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(activeQuery)}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(query);
    if (id) {
      setVideoId(id);
      toast.success("Loading that video inside ContextBell");
    } else {
      setVideoId(null);
      setActiveQuery(query.trim() || "engineering lectures");
    }
  };

  return (
    <AppShell title="YouTube Learning" subtitle="Watch lectures here and ring the bell the moment you're lost">
      <form onSubmit={submit} className="glass flex flex-wrap items-center gap-2 rounded-3xl p-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a topic, or paste a YouTube link"
            className="pl-9"
          />
        </div>
        <Button type="submit">
          <Youtube className="size-4" /> Load
        </Button>
        <Button
          type="button"
          variant={bell.listening ? "destructive" : "secondary"}
          onClick={() => (bell.listening ? bell.stopListening() : bell.startListening("youtube"))}
        >
          <Radio className="size-4" />
          {bell.listening ? "Stop listening" : "Capture this tab's audio"}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {youtubeTopics.map((t) => (
          <button
            key={t.label}
            onClick={() => {
              setVideoId(null);
              setQuery(t.query);
              setActiveQuery(t.query);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              activeQuery === t.query && !videoId
                ? "gradient-gold border-transparent font-semibold text-accent-foreground"
                : "border-border/60 hover:bg-muted/60",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mt-4 overflow-hidden rounded-3xl p-3"
      >
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          <iframe
            key={embedSrc}
            src={embedSrc}
            title="ContextBell YouTube learning player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-muted-foreground">
            {videoId ? `Now playing video ${videoId}` : `Search results for “${activeQuery}”`}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              toggleBookmark({
                title: videoId ? `YouTube video ${videoId}` : `Search: ${activeQuery}`,
                kind: "video",
                url: videoId ? `https://youtu.be/${videoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(activeQuery)}`,
              });
              toast.success("Bookmark updated");
            }}
          >
            <BookMarked className="size-3.5" /> Bookmark
          </Button>
        </div>
      </motion.div>

      <div className="glass mt-4 rounded-3xl p-5">
        <div className="flex items-start gap-3">
          <span className="gradient-gold flex size-9 shrink-0 items-center justify-center rounded-xl text-accent-foreground">
            <Bell className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">How to capture YouTube context</h2>
            <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>1. Press “Capture this tab's audio” and share this tab with audio enabled.</li>
              <li>2. Watch the lecture — ContextBell buffers it continuously, nothing is uploaded.</li>
              <li>
                3. Confused? Ring the floating bell. Your chosen window ({bell.contextWindow}s) around that
                moment is transcribed and opened in the AI chat.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
