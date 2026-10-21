import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { passwordSchema } from "@/lib/registration-schema";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset Password — MUICT Clubs" }, { name: "description", content: "Set a new password for your MUICT student club account." },
    { property: "og:title", content: "Reset Password — MUICT Clubs" }, { property: "og:description", content: "Recover access to your MUICT club account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ResetPassword,
});
function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "recovery") {
      void supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)));
    }
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid password."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) setError(error.message); else setDone(true);
  }
  return <main className="mx-auto min-h-screen max-w-md px-6 py-12"><h1 className="text-3xl font-bold">Reset password</h1>
    {done ? <p role="status" className="mt-6 text-primary">Your password has been updated.</p> : ready ? <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block text-sm">New password<input type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
      <label className="block text-sm">Confirm password<input type="password" autoComplete="new-password" required maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
      {error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit">{busy ? "Saving…" : "Update password"}</Button>
    </form> : <p className="mt-6 text-muted-foreground">Open the password reset link from your email to set a new password.</p>}
    <Button asChild variant="link" className="mt-6"><Link to="/auth">Back to sign in</Link></Button></main>;
}