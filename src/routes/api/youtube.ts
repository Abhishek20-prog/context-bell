import { createFileRoute } from "@tanstack/react-router";

type Video = { id: string; title: string; channel: string; thumbnail: string };

/** Lightweight YouTube search: parses the public results page (no API key). */
export const Route = createFileRoute("/api/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q")?.trim();
        if (!q) return new Response("A search query is required", { status: 400 });

        try {
          const res = await fetch(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
              },
            },
          );
          const html = await res.text();
          return Response.json({ results: parseVideos(html) });
        } catch {
          return Response.json({ results: [] as Video[] });
        }
      },
    },
  },
});

function parseVideos(html: string): Video[] {
  const start = html.indexOf("var ytInitialData = ");
  if (start === -1) return [];
  const slice = html.slice(start + 20);
  const end = slice.indexOf(";</script>");
  let data: unknown;
  try {
    data = JSON.parse(slice.slice(0, end));
  } catch {
    return [];
  }

  const out: Video[] = [];
  const seen = new Set<string>();
  const walk = (node: unknown) => {
    if (out.length >= 24 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    const renderer = obj.videoRenderer;
    if (isRecord(renderer) && typeof renderer.videoId === "string" && !seen.has(renderer.videoId)) {
      const videoId = renderer.videoId;
      seen.add(videoId);
      out.push({
        id: videoId,
        title: rendererText(renderer.title) ?? "Untitled video",
        channel:
          rendererText(renderer.ownerText) ?? rendererText(renderer.longBylineText) ?? "YouTube",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
    Object.values(obj).forEach(walk);
  };
  walk(data);
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function rendererText(value: unknown): string | undefined {
  if (!isRecord(value) || !Array.isArray(value.runs)) return undefined;
  const [firstRun] = value.runs;
  return isRecord(firstRun) && typeof firstRun.text === "string" ? firstRun.text : undefined;
}
