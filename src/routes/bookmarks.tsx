import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, ExternalLink, Mic, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalStore } from "@/hooks/use-local-store";
import { KEYS } from "@/lib/storage";
import type { Bookmark as BookmarkType } from "@/types";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks · ContextBell" },
      {
        name: "description",
        content: "Every lecture moment, answer and video you saved for later revision.",
      },
      { property: "og:title", content: "Bookmarks · ContextBell" },
      {
        property: "og:description",
        content: "Saved lectures, answers and videos in one revision shelf.",
      },
    ],
  }),
  component: BookmarksPage,
});

export function BookmarksPage() {
  const { value: bookmarks, setValue: setBookmarks } = useLocalStore<BookmarkType[]>(
    KEYS.bookmarks,
    [],
  );

  const iconFor = (kind: BookmarkType["kind"]) =>
    kind === "video" ? Youtube : kind === "answer" ? Mic : Bookmark;

  return (
    <AppShell
      title="Bookmarks"
      subtitle={`${bookmarks.length} saved item${bookmarks.length === 1 ? "" : "s"}`}
    >
      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing bookmarked yet"
          description="Save answers from chat or videos from the YouTube tab and they will appear here."
          action={
            <Button asChild className="gap-2">
              <Link to="/chat">Open chat</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((b) => {
            const Icon = iconFor(b.kind);
            return (
              <article key={b.id} className="glass-card flex flex-col p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {b.kind}
                  </Badge>
                </div>
                <h2 className="mt-3 line-clamp-2 text-sm font-semibold">{b.title}</h2>
                <p className="mt-1.5 line-clamp-3 flex-1 text-xs text-muted-foreground">
                  {b.subtitle ?? b.content ?? ""}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {b.url && (
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <a href={b.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5" /> Open
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive"
                    onClick={() => {
                      setBookmarks(bookmarks.filter((x) => x.id !== b.id));
                      toast.success("Bookmark removed");
                    }}
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
