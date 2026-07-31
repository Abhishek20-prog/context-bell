import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, ExternalLink, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — ContextBell" },
      { name: "description", content: "Your bookmarked lectures, chats, notes and study packs." },
      { property: "og:title", content: "Bookmarks — ContextBell" },
      { property: "og:description", content: "Everything you saved for later revision." },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { data, toggleBookmark } = useApp();

  return (
    <AppShell title="Bookmarks" subtitle="Saved lectures, chats and study material">
      {data.bookmarks.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
          <BookMarked className="size-7 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">Nothing bookmarked yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Bookmark a YouTube lecture or an AI conversation to find it instantly later.
          </p>
          <Button asChild>
            <Link to="/youtube">Browse YouTube Learning</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.bookmarks.map((b) => (
            <div key={b.id} className="glass card-hover flex items-start justify-between gap-3 rounded-3xl p-5">
              <div className="min-w-0">
                <Badge variant="secondary" className="capitalize">
                  {b.kind}
                </Badge>
                <p className="mt-2 truncate text-sm font-medium">{b.title}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(b.createdAt).toLocaleString()}</p>
                {b.url && (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent underline decoration-dotted"
                  >
                    Open <ExternalLink className="size-3" />
                  </a>
                )}
                {b.kind === "chat" && b.refId && (
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: b.refId }}
                    className="mt-1 block text-[11px] text-accent underline decoration-dotted"
                  >
                    Open conversation
                  </Link>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  toggleBookmark({
                    title: b.title,
                    kind: b.kind,
                    ...(b.refId ? { refId: b.refId } : {}),
                    ...(b.url ? { url: b.url } : {}),
                  })
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
