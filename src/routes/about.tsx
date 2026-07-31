import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Brain,
  Cloud,
  Database,
  ExternalLink,
  GraduationCap,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ContextBell — Contextual Learning, Not Generic Answers" },
      {
        name: "description",
        content:
          "Why ContextBell exists, how the contextual capture workflow works, its AI rules, and the roadmap toward RAG and collaborative classrooms.",
      },
      { property: "og:title", content: "About ContextBell" },
      {
        property: "og:description",
        content: "The problem, the innovation, the AI rules and the roadmap behind ContextBell.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell title="About ContextBell" subtitle="Contextual learning assistant for real lectures">
      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold">The problem</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Students learn from offline classrooms, YouTube, Google Meet, Zoom and recorded videos. The
          moment they get confused they ask a generic chatbot — which never attended the lecture. The
          answer arrives without the teacher's framing, notation or examples, and lecture continuity
          breaks.
        </p>
      </section>

      <section className="mt-4 glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold">The innovation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ContextBell keeps a rolling audio buffer while you attend a lecture. When you get confused you
          ring the bell — instead of recording from that moment onwards, ContextBell reaches backwards and
          captures the lecture segment surrounding that timestamp, using the context window you chose (20,
          30, 45 or 60 seconds). That segment is transcribed and becomes the AI's context.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { icon: Bell, title: "One button", body: "Works identically for every lecture source." },
            { icon: Brain, title: "Transcript-first AI", body: "Lecture context always outranks internet knowledge." },
            {
              icon: ShieldCheck,
              title: "Strict Mode",
              body: "Stay on the captured topic plus one supporting concept.",
            },
            {
              icon: GraduationCap,
              title: "Teacher insights",
              body: "Anonymised doubt analytics help teachers improve lectures.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 p-4">
              <f.icon className="size-4 text-accent" />
              <p className="mt-2 text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold">AI rules</h2>
        <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <li>1. Use the lecture transcript first, always.</li>
          <li>2. Interpret what the teacher meant, including what was implied.</li>
          <li>3. Explain according to the lecture — never contradict it.</li>
          <li>
            4. When general knowledge is needed, state clearly: “This explanation extends beyond your
            recorded lecture context.”
          </li>
        </ol>
      </section>

      <section className="mt-4 glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold">Architecture & roadmap</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ContextBell is built with React, TypeScript, TailwindCSS, ShadCN UI, TanStack Router & Query and
          Framer Motion. The AI layer is a modular service, so Gemini can be swapped for any other LLM
          without touching feature code. This MVP stores everything in local storage.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Database, title: "Storage today", body: "Local storage repository behind one service." },
            { icon: Layers, title: "Next", body: "PostgreSQL + Drizzle, JWT & Google OAuth, RAG with Pinecone." },
            { icon: Cloud, title: "Later", body: "Cloud storage, mobile app, collaborative classrooms." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 p-4">
              <f.icon className="size-4 text-accent" />
              <p className="mt-2 text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold">Research support</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Research support and data credits: iNSIGHTS AI.
        </p>
        <a
          href="https://insights-ai.info/"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent underline decoration-dotted"
        >
          https://insights-ai.info/ <ExternalLink className="size-3.5" />
        </a>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link to="/credits">Meet the team</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/record">Try a capture</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
