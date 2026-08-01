import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Brain,
  FileDown,
  GraduationCap,
  Mic,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Video,
  Youtube,
} from "lucide-react";
import heroImage from "@/assests/hero-contextbell.jpg";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextBell — AI That Understands Your Lecture" },
      {
        name: "description",
        content:
          "Ring the bell when you get confused. ContextBell captures the surrounding lecture audio, transcribes it, and explains it with lecture-grounded AI.",
      },
      { property: "og:title", content: "ContextBell — AI That Understands Your Lecture" },
      {
        property: "og:description",
        content:
          "Ring the bell when you get confused. ContextBell captures the surrounding lecture audio, transcribes it, and explains it with lecture-grounded AI.",
      },
    ],
  }),
  component: Landing,
});

const SOURCES = [
  { icon: GraduationCap, label: "Offline Classroom" },
  { icon: Youtube, label: "YouTube" },
  { icon: MonitorPlay, label: "Google Meet" },
  { icon: Video, label: "Zoom" },
  { icon: Mic, label: "Uploaded Audio" },
  { icon: Video, label: "Uploaded Video" },
];

const FEATURES = [
  {
    icon: Bell,
    title: "Ring at the moment of confusion",
    body: "A rolling audio buffer means the context is already saved. Pick a 20, 30, 45 or 60 second window and ContextBell grabs the lecture around that timestamp.",
  },
  {
    icon: Brain,
    title: "Transcript-first AI",
    body: "Answers are grounded in what your teacher actually said. Anything beyond it is clearly flagged as extending past your lecture context.",
  },
  {
    icon: BookOpen,
    title: "Study Packs on demand",
    body: "Notes, mind maps, MCQs, flashcards, viva questions, cheat sheets, books and roadmaps — generated from your lecture, not the internet.",
  },
  {
    icon: ShieldCheck,
    title: "Strict Mode focus",
    body: "Keep the AI on the captured topic plus one supporting concept so you never lose lecture continuity.",
  },
];

function Landing() {
  const { user } = useApp();
  const primaryTo = user?.role === "teacher" ? "/teacher" : "/dashboard";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora absolute -left-32 -top-32 size-[36rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="animate-aurora absolute -right-24 top-40 size-[30rem] rounded-full bg-accent/20 blur-3xl [animation-delay:-8s]" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="gradient-gold flex size-9 items-center justify-center rounded-xl shadow-glow">
            <Bell className="size-4 text-accent-foreground" />
          </span>
          <span className="font-display text-lg font-semibold">ContextBell</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/youtube" className="transition-colors hover:text-foreground">
            YouTube Learning
          </Link>
          <Link to="/record" className="transition-colors hover:text-foreground">
            Record Context
          </Link>
          <Link to="/credits" className="transition-colors hover:text-foreground">
            Credits
          </Link>
          <Link to="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to={user ? primaryTo : "/signup"}>{user ? "Open app" : "Get started"}</Link>
          </Button>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
            <Sparkles className="size-3.5 text-accent" /> Contextual learning, not generic answers
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            The AI that knows <span className="text-gradient">what your teacher just said</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            ChatGPT never attended your lecture. ContextBell keeps a rolling buffer of the class, and
            the moment you get confused you ring the bell — it captures the surrounding lecture
            audio, transcribes it, and explains that exact moment.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to={user ? primaryTo : "/signup"}>
                <Bell className="size-4" /> Start learning contextually
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/youtube">
                <Youtube className="size-4" /> Try YouTube Learning
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <span
                key={s.label}
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium"
              >
                <s.icon className="size-3.5 text-accent" />
                {s.label}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="glass animate-float-slow overflow-hidden rounded-[2rem] p-2">
            <img
              src={heroImage}
              alt="ContextBell capturing lecture audio context around a student's moment of confusion"
              className="w-full rounded-[1.6rem] object-cover"
              loading="eager"
            />
          </div>
          <div className="glass absolute -bottom-6 left-6 rounded-2xl px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Context window</p>
            <p className="font-display text-lg font-semibold">30s around your confusion</p>
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">How ContextBell works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { step: "01", title: "Attend", body: "ContextBell buffers your lecture from any source." },
            { step: "02", title: "Ring", body: "Confused? Tap the bell and pick your context window." },
            { step: "03", title: "Transcribe", body: "The surrounding segment becomes an accurate transcript." },
            { step: "04", title: "Understand", body: "The chatbot opens and explains that lecture moment." },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass card-hover rounded-3xl p-5"
            >
              <span className="text-gradient font-display text-2xl font-bold">{s.step}</span>
              <p className="mt-2 font-display text-base font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="glass card-hover rounded-3xl p-6"
            >
              <span className="gradient-hero flex size-10 items-center justify-center rounded-2xl text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20">
        <div className="glass flex flex-col items-center gap-4 rounded-[2rem] p-10 text-center">
          <FileDown className="size-8 text-accent" />
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Turn one confusing minute into a full study pack
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Detailed notes, mind maps, MCQs, viva and interview questions, flashcards, cheat sheets,
            recommended books and a learning roadmap — exportable as PDF or Markdown.
          </p>
          <Button size="lg" asChild>
            <Link to={user ? primaryTo : "/signup"}>Create my first study pack</Link>
          </Button>
        </div>
      </section>

      <footer className="relative border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ContextBell · Hackathon MVP</p>
          <div className="flex gap-4">
            <Link to="/credits" className="hover:text-foreground">
              Credits
            </Link>
            <Link to="/about" className="hover:text-foreground">
              About
            </Link>
            <a
              href="https://insights-ai.info/"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground"
            >
              iNSIGHTS AI
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
