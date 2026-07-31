import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  FileText,
  Mic,
  MessagesSquare,
  Sparkle,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextBell — AI That Explains Your Own Lecture" },
      {
        name: "description",
        content:
          "Record only the confusing part of a lecture. ContextBell turns it into AI context and explains it in your teacher's terms — with notes, MCQs, flashcards and viva prep.",
      },
      { property: "og:title", content: "ContextBell — AI That Explains Your Own Lecture" },
      {
        property: "og:description",
        content:
          "Record only the confusing part of a lecture. ContextBell turns it into AI context and explains it in your teacher's terms — with notes, MCQs, flashcards and viva prep.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Mic,
    title: "Record the confusing minute",
    body: "One tap captures just the part you didn't get. Speech becomes searchable transcript instantly.",
  },
  {
    icon: BrainCircuit,
    title: "Transcript-first answers",
    body: "The assistant answers from your recording first, and flags clearly whenever it goes beyond it.",
  },
  {
    icon: FileText,
    title: "Auto study kit",
    body: "Every answer generates summary, revision notes, MCQs, flashcards, viva and interview questions.",
  },
  {
    icon: Youtube,
    title: "Learn along with video",
    body: "Search lectures, hit a confusing explanation, record it, and ask ContextBell right away.",
  },
  {
    icon: MessagesSquare,
    title: "ChatGPT-grade chat",
    body: "Streaming answers, markdown, math, code blocks, renaming, search and local chat history.",
  },
  {
    icon: BookOpen,
    title: "Notes you own",
    body: "Pin, edit and export AI notes as PDF or Markdown. Everything lives on your device.",
  },
];

const STEPS = [
  { n: "01", t: "Record", d: "Capture the confusing explanation from class or a video." },
  { n: "02", t: "Transcribe", d: "ContextBell converts the audio into lecture context." },
  { n: "03", t: "Ask", d: '"What did the teacher mean?" — answered from your recording.' },
  { n: "04", t: "Revise", d: "Turn the answer into notes, flashcards and exam questions." },
];

function Landing() {
  const { settings, toggleTheme } = useSettings();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="aurora" aria-hidden />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <BrandMark />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {settings.theme === "dark" ? "Light" : "Dark"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/about">About</Link>
          </Button>
          {user ? (
            <Button size="sm" asChild>
              <Link to="/dashboard">Open app</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground glass">
              <Sparkle className="size-3.5 text-accent" /> Contextual AI for students
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
              The AI that explains <span className="text-gradient">your lecture</span>, not the
              internet's.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Record only the confusing part of a class. ContextBell turns that audio into context
              and answers your questions the way your teacher actually taught it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link to={user ? "/record" : "/signup"}>
                  <Mic className="size-4" /> Record your first context
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link to="/chat">
                  Try the chatbot <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>🎙️ 30-second capture</span>
              <span>🧠 Transcript-first answers</span>
              <span>🔒 Stored on your device</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card relative p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-hero">
                <Bell className="size-5 text-primary-foreground" />
              </span>
              <div>
                <p className="text-sm font-medium">Recording · Signals & Systems</p>
                <p className="text-xs text-muted-foreground">00:42 captured · transcript ready</p>
              </div>
            </div>
            <div className="mt-5 flex h-16 items-end gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="flex-1 rounded-full bg-primary/60"
                  animate={{ height: [`${12 + ((i * 13) % 40)}%`, `${30 + ((i * 29) % 70)}%`] }}
                  transition={{
                    duration: 0.9 + (i % 5) * 0.12,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                What did the teacher mean by "convolution flips the signal"?
              </div>
              <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border/60 bg-secondary/50 px-4 py-3 text-sm">
                From your recording: your teacher described flipping <em>h(t)</em> around the y-axis
                and sliding it across <em>x(t)</em>…
                <p className="mt-2 text-xs text-muted-foreground">
                  Grounded in your 42-second recording.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              whileHover={{ y: -5 }}
              className="glass-card p-5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="text-center font-display text-3xl font-semibold">How ContextBell works</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="glass-card p-5"
              >
                <p className="font-mono text-sm text-accent">{s.n}</p>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="glass-card mt-20 flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="font-display text-3xl font-semibold">Stop re-watching whole lectures.</h2>
          <p className="max-w-lg text-muted-foreground">
            Capture the 40 seconds that confused you and let ContextBell teach it back to you.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link to={user ? "/dashboard" : "/signup"}>
              Get started free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 px-5 py-6 text-center text-xs text-muted-foreground">
        ContextBell · Hackathon MVP · Your data stays in your browser
      </footer>
    </div>
  );
}
