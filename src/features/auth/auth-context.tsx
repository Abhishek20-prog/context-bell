import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { db, logActivity, uid } from "@/lib/storage";
import type { User } from "@/types";

type AuthState = {
  user: Omit<User, "password"> | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "bio" | "avatarSeed">>) => void;
};

const AuthContext = createContext<AuthState | null>(null);

const strip = (u: User): Omit<User, "password"> => {
  const { password: _password, ...rest } = u;
  return rest;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = db.sessionUserId();
    const found = db.users().find((u) => u.id === id);
    setUser(found ? strip(found) : null);
    setHydrated(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await wait(650);
    const found = db.users().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) throw new Error("No account found for that email. Try signing up.");
    if (found.password !== password) throw new Error("Incorrect password.");
    db.setSessionUserId(found.id);
    logActivity("auth", `Signed in as ${found.name}`);
    setUser(strip(found));
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await wait(750);
    const users = db.users();
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
      throw new Error("An account with that email already exists.");
    const created: User = {
      id: uid("usr"),
      name: name.trim(),
      email: email.trim(),
      password,
      joinedAt: new Date().toISOString(),
      avatarSeed: Math.random().toString(36).slice(2, 8),
    };
    db.setUsers([...users, created]);
    db.setSessionUserId(created.id);
    logActivity("auth", `Created account for ${created.name}`);
    setUser(strip(created));
  }, []);

  const logout = useCallback(() => {
    db.setSessionUserId(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<User>) => {
    const users = db.users();
    const id = db.sessionUserId();
    const next = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    db.setUsers(next);
    const found = next.find((u) => u.id === id);
    if (found) setUser(strip(found));
  }, []);

  const value = useMemo(
    () => ({ user, hydrated, login, signup, logout, updateProfile }),
    [user, hydrated, login, signup, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
