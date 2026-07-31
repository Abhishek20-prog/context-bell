import { createFileRoute } from "@tanstack/react-router";
import { Brain, Bell, Layers, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui-kit";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ContextBell · Contextual Learning Assistant" },
      {
        name: "description",
        content:
          "ContextBell records your lecture, then answers your questions grounded in what your teacher actually said.",
      },
      { property: "og:title", content: "About ContextBell" },
      {
        property: "og:description",
        content: "How ContextBell turns a recorded lecture into grounded answers and study kits.",
      },
    ],
  }),
  component: AboutPage,
});

const STEPS = [
  {
    icon: Mic,
    title: "1 · Record the moment",
    body: "Capture the part of the lecture you didn't follow. Audio is transcribed on the spot so the words are yours, not a generic textbook's.",
  },
  {
    icon: Brain,
    title: "2 · Ask in your own words",
    body: "ContextBell answers from your transcript first, and clearly flags when it steps beyond the recording into general knowledge.",
  },
  {
    icon: Sparkles,
    title: "3 · Turn it into revision",
    body: "One tap produces a study kit: summary, revision notes, MCQs, flashcards, viva questions and reference material.",
  },
];

function AboutPage() {
  return (
    <AppShell title="About ContextBell" subtitle="Why context beats a generic AI answer">
      <div className="mx-auto max-w-3xl space-y-6">
        <SectionCard
          title="The problem"
          description="Students don't need another chatbot — they need the missing 30 seconds of their own class."
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            When a lecture moves too fast, generic AI tools answer a different question than the one
            your teacher was actually asking. ContextBell keeps the teacher's own words as the
            source of truth, so explanations line up with your syllabus, notation and exam.
          </p>
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.title} className="glass-card p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
                <s.icon className="size-4.5" />
              </span>
              <h2 className="mt-3 text-sm font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>

        <SectionCard
          title="Built for the hackathon MVP"
          description="Small footprint, real workflow."
        >
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
              Recordings, chats, notes and bookmarks live in your browser storage — no account
              server needed to demo the full flow.
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              AI calls run through server routes, so the API key never reaches the browser.
            </li>
            <li className="flex gap-3">
              <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
              Every answer states whether it came from your lecture or from beyond it — no silent
              guessing.
            </li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
