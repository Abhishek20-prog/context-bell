import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, IdCard, Mail, Save, School } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — ContextBell" },
      { name: "description", content: "Manage your ContextBell learner profile and study stats." },
      { property: "og:title", content: "My Profile — ContextBell" },
      { property: "og:description", content: "Your learner identity, streak and stored learning data." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, data, updateUser, reset } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [institution, setInstitution] = useState(user?.institution ?? "");

  if (!user) {
    return (
      <AppShell title="Profile">
        <div className="glass flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
          <p className="text-sm text-muted-foreground">You're not signed in yet.</p>
          <Button asChild>
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile" subtitle="Stored locally on this device">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="glass rounded-3xl p-6 text-center">
          <span className="gradient-hero mx-auto flex size-20 items-center justify-center rounded-3xl font-display text-2xl font-semibold text-primary-foreground">
            {user.avatar}
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">{user.name}</h2>
          <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
          <div className="mt-5 space-y-2 text-left text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <IdCard className="size-3.5" /> {user.studentId}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-3.5" /> {user.email}
            </p>
            {user.institution && (
              <p className="flex items-center gap-2">
                <School className="size-3.5" /> {user.institution}
              </p>
            )}
            <p className="flex items-center gap-2">
              <CalendarDays className="size-3.5" /> Joined {new Date(user.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-3xl p-5">
            <h2 className="font-display text-base font-semibold">Edit details</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-inst">Institution</Label>
                <Input id="p-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() => {
                updateUser({ name, email, institution });
                toast.success("Profile updated");
              }}
            >
              <Save className="size-4" /> Save changes
            </Button>
          </div>

          <div className="glass rounded-3xl p-5">
            <h2 className="font-display text-base font-semibold">Your learning data</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Streak", value: `${data.progress.streak}d` },
                { label: "Sessions", value: data.sessions.length },
                { label: "Chats", value: data.chats.length },
                { label: "Packs", value: data.studyPacks.length },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/60 p-3 text-center">
                  <p className="font-display text-lg font-semibold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <Button
              variant="destructive"
              className="mt-4"
              onClick={() => {
                if (window.confirm("Clear all locally stored ContextBell data?")) {
                  reset();
                  toast.success("Local data cleared");
                }
              }}
            >
              Clear local data
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
