import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, GraduationCap, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your ContextBell account" },
      {
        name: "description",
        content: "Join ContextBell as a student or teacher and start learning from lecture context.",
      },
      { property: "og:title", content: "Create your ContextBell account" },
      { property: "og:description", content: "Contextual AI learning built for real lectures." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 4) {
      toast.error("Fill in your name, email and a password of at least 4 characters");
      return;
    }
    const user = signIn({
      name: name.trim(),
      email: email.trim(),
      role,
      ...(institution.trim() ? { institution: institution.trim() } : {}),
    });
    toast.success(`Account created · ID ${user.studentId}`);
    navigate({ to: role === "teacher" ? "/teacher" : "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora absolute -right-32 top-10 size-[32rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="animate-aurora absolute -left-24 bottom-0 size-[28rem] rounded-full bg-primary/20 blur-3xl [animation-delay:-9s]" />
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass relative w-full max-w-md rounded-[2rem] p-8"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <span className="gradient-gold flex size-9 items-center justify-center rounded-xl shadow-glow">
            <Bell className="size-4 text-accent-foreground" />
          </span>
          <span className="font-display text-lg font-semibold">ContextBell</span>
        </Link>

        <h1 className="mt-6 font-display text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Who are you?</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {(
            [
              { id: "student", label: "Student", icon: GraduationCap },
              { id: "teacher", label: "Teacher", icon: Presentation },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-sm transition-all",
                role === r.id
                  ? "border-accent bg-accent/10 font-semibold shadow-glow"
                  : "border-border/60 hover:bg-muted/60",
              )}
            >
              <r.icon className="size-5" />
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shreya Kumari" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
            />
          </div>
          <div>
            <Label htmlFor="institution">College / Institution</Label>
            <Input
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="IGDTUW"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full">
          Create {role} account
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="text-accent underline decoration-dotted">
            Log in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
