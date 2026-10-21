import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { useAccount } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { emailSchema, passwordSchema } from "@/lib/registration-schema";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { club?: string } => ({ club: typeof search['club'] === "string" ? search['club'] : undefined }),
  head: () => ({ meta: [
    { title: "Student Sign In — MUICT Clubs" },
    { name: "description", content: "Sign in or create a student account to register for MUICT clubs." },
    { property: "og:title", content: "Student Sign In — MUICT Clubs" },
    { property: "og:description", content: "Sign in to manage your MUICT club registrations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { club } = Route.useSearch();
  const { user, loading } = useAccount();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    if (club) void navigate({ to: "/clubs/$clubId", params: { clubId: club } });
    else void navigate({ to: "/my-clubs" });
  }, [user, loading, club, navigate]);
  function changeMode(next: typeof mode) { setMode(next); setError(""); setMessage(""); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedEmail.success) { setError(parsedEmail.error.issues[0]?.message ?? "Invalid email."); return; }
    if (mode !== "forgot" && !parsedPassword.success) { setError(parsedPassword.error.issues[0]?.message ?? "Invalid password."); return; }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(parsedEmail.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setMessage("If an account exists, a password reset link has been sent to your email.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({ email: parsedEmail.data, password, options: { emailRedirectTo: window.location.origin } });
        if (result.error) throw result.error;
        if (!result.data.session) setMessage("Check your email to confirm your account, then return here to sign in.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email: parsedEmail.data, password });
        if (result.error) throw result.error;
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setError(""); setBusy(true);
    try {
      const callback = new URL("/auth", window.location.origin);
      if (club) callback.searchParams.set("club", club);
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: callback.href });
      if (result.error) setError(result.error.message);
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto min-h-screen max-w-md px-6 py-12">
    <Link to="/" className="text-sm text-primary hover:underline">← All clubs</Link>
    <p className="mt-8 text-sm font-semibold text-primary">MUICT CLUBS</p>
    <h1 className="mt-2 text-3xl font-bold">{mode === "signup" ? "Create an account" : mode === "forgot" ? "Reset your password" : "Student sign in"}</h1>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm font-medium">Email<input className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {mode !== "forgot" && <label className="block text-sm font-medium">Password<input className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-primary">{message}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    {mode !== "forgot" && <div className="mt-6 space-y-3 border-t border-border pt-6"><Button variant="outline" className="w-full" disabled={busy} onClick={() => social("google")}>Continue with Google</Button><Button variant="outline" className="lovable-auth-button w-full" disabled={busy} onClick={() => social("lovable")}>Continue with Lovable</Button></div>}
    <div className="mt-5 flex flex-wrap justify-between gap-2"><Button variant="link" onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Back to sign in"}</Button>{mode === "signin" && <Button variant="link" onClick={() => changeMode("forgot")}>Forgot password?</Button>}</div>
  </main>;
}