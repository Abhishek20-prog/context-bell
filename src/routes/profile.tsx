import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Flame, LogOut, Mic, MessageSquare, NotebookPen, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { db } from "@/lib/storage";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile · ContextBell" },
      {
        name: "description",
        content: "Manage your ContextBell learner profile and review your study stats.",
      },
      { property: "og:title", content: "Your Profile · ContextBell" },
      {
        property: "og:description",
        content: "Your learning identity and study streak on ContextBell.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, hydrated, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [counts, setCounts] = useState({
    recordings: 0,
    chats: 0,
    notes: 0,
    bookmarks: 0,
    streak: 0,
  });

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/login" });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setBio(user.bio ?? "");
    setCounts({
      recordings: db.recordings().length,
      chats: db.chats().length,
      notes: db.notes().length,
      bookmarks: db.bookmarks().length,
      streak: db.stats().streak,
    });
  }, [user]);

  if (!user) return null;

  return (
    <AppShell title="Profile" subtitle="Your learner identity and study footprint">
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <form
          className="glass-card space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile({ name: name.trim(), email: email.trim(), bio: bio.trim() });
            toast.success("Profile updated");
          }}
        >
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.avatarSeed}`}
              alt={`${user.name}'s avatar`}
              className="size-16 rounded-2xl border border-border/60 bg-secondary"
            />
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                Learning since {new Date(user.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are you studying right now?"
              className="min-h-24"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="gap-2">
              <Save className="size-4" /> Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard icon={Flame} label="Day streak" value={String(counts.streak)} />
          <StatCard icon={Mic} label="Recordings" value={String(counts.recordings)} />
          <StatCard icon={MessageSquare} label="Conversations" value={String(counts.chats)} />
          <StatCard icon={NotebookPen} label="Notes" value={String(counts.notes)} />
          <StatCard icon={Bookmark} label="Bookmarks" value={String(counts.bookmarks)} />
        </div>
      </div>
    </AppShell>
  );
}
