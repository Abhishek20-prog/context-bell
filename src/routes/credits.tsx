import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ExternalLink, GraduationCap, Heart, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Credits — The ContextBell Team" },
      {
        name: "description",
        content:
          "Meet the ContextBell team from DTU, IGDTUW and MAIT, plus our research and data credits to iNSIGHTS AI.",
      },
      { property: "og:title", content: "Credits — The ContextBell Team" },
      {
        property: "og:description",
        content: "Built by Abhishek Kumar, Shreya Kumari, Krshav Garg and Upasana Khanna.",
      },
    ],
  }),
  component: CreditsPage,
});

const TEAM = [
  {
    name: "Abhishek Kumar",
    college: "Delhi Technological University (DTU)",
    branch: "Electrical Engineering",
  },
  { name: "Shreya Kumari", college: "IGDTUW", branch: "ECE-AI" },
  { name: "Krshav Garg", college: "MAIT", branch: "Computer Science Engineering" },
  { name: "Upasana Khanna", college: "IGDTUW", branch: "ECE-AI" },
];

function CreditsPage() {
  return (
    <AppShell title="Credits" subtitle="The people and research behind ContextBell">
      <section>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles className="size-4 text-accent" /> Team
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass card-hover rounded-3xl p-6"
            >
              <span className="gradient-hero flex size-12 items-center justify-center rounded-2xl font-display text-base font-semibold text-primary-foreground">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{member.name}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="size-3.5" /> {member.college}
              </p>
              <p className="text-sm text-muted-foreground">{member.branch}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Heart className="size-4 text-accent" /> Research Support and Data Credits
        </h2>
        <div className="glass mt-4 rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">iNSIGHTS AI</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Research support and data credits for ContextBell's contextual learning approach, lecture
            comprehension research and student doubt analysis.
          </p>
          <a
            href="https://insights-ai.info/"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent underline decoration-dotted"
          >
            https://insights-ai.info/ <ExternalLink className="size-3.5" />
          </a>
        </div>
      </section>
    </AppShell>
  );
}
