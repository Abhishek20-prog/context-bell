import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Loader2, Play, Search, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStore } from "@/hooks/use-local-store";
import { KEYS, logActivity, uid } from "@/lib/storage";
import { aiService } from "@/services/ai-service";
import type { Bookmark as BookmarkType } from "@/types";

export const Route = createFileRoute("/youtube")({
  head: () => ({
    meta: [
      { title: "Video Library · ContextBell" },
      {
        name: "description",
        content: "Find lecture-matching YouTube explainers and save them to your revision shelf.",
      },
      { property: "og:title", content: "Video Library · ContextBell" },
      {
        property: "og:description",
        content: "Curated YouTube explainers for the topic you just studied.",
      },
    ],
  }),
  component: YoutubePage,
});

type Video = { id: string; title: string; channel: string; thumbnail: string };

const TOPICS = ["Fourier transform", "Dynamic programming", "Photosynthesis", "Operating systems"];

function YoutubePage() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<Video | null>(null);
  const { value: bookmarks, setValue: setBookmarks } = useLocalStore<BookmarkType[]>(
    KEYS.bookmarks,
    [],
  );

  const search = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setActive(null);
    try {
      const { results } = await aiService.searchVideos(q.trim());
      setVideos(results);
      logActivity("video", `Searched videos: ${q.trim()}`);
      if (results.length === 0) toast.info("No videos found for that topic.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Video search failed");
    } finally {
      setLoading(false);
    }
  };

  const save = (v: Video) => {
    const item: BookmarkType = {
      id: uid("bm"),
      kind: "video",
      title: v.title,
      subtitle: v.channel,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      createdAt: new Date().toISOString(),
    };
    setBookmarks([item, ...bookmarks]);
    toast.success("Video bookmarked");
  };

  return (
    <AppShell
      title="Video Library"
      subtitle="Reinforce a lecture with the best explainer on YouTube"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a topic, e.g. 'Bayes theorem explained'"
            className="pl-9"
          />
        </div>
        <Button type="submit" className="gap-2" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => search(t)}
            className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t}
          </button>
        ))}
      </div>

      {active && (
        <div className="glass-card mt-6 overflow-hidden">
          <div className="aspect-video w-full">
            <iframe
              key={active.id}
              className="size-full"
              src={`https://www.youtube.com/embed/${active.id}`}
              title={active.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{active.title}</h2>
              <p className="text-xs text-muted-foreground">{active.channel}</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => save(active)}>
              <Bookmark className="size-3.5" /> Bookmark
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {videos.length === 0 && !loading ? (
          <EmptyState
            icon={Youtube}
            title="Search for a topic"
            description="ContextBell finds focused explainer videos so you can revise a concept visually."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videos.map((v) => (
              <article key={v.id} className="glass-card overflow-hidden">
                <button className="group relative block w-full" onClick={() => setActive(v)}>
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="size-8 text-primary" />
                  </span>
                </button>
                <div className="p-4">
                  <h2 className="line-clamp-2 text-sm font-semibold">{v.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{v.channel}</p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setActive(v)}
                    >
                      <Play className="size-3.5" /> Watch
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => save(v)}>
                      <Bookmark className="size-3.5" /> Save
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
