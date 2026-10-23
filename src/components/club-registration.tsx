import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/account-provider";
import { getRegistrationState, registerForClub } from "@/lib/registration.functions";
import { registrationSchema } from "@/lib/registration-schema";
import { CLUB_CAPACITY } from "@/lib/clubs";

export function ClubRegistration({ clubSlug, clubName }: { clubSlug: string; clubName: string }) {
  const { user, loading } = useAccount();
  const fetchState = useServerFn(getRegistrationState);
  const register = useServerFn(registerForClub);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["registrations", user?.id], queryFn: () => fetchState(), enabled: Boolean(user) && !loading });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({ mutationFn: (data: { clubSlug: string; displayName: string; studentId: string }) => register({ data }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["registrations", user?.id] }); setOpen(false); } });
  const registered = mutation.isSuccess || query.data?.registrations.some((row) => row.club_slug === clubSlug);
  const count = query.data?.availability.find((row) => row.club_slug === clubSlug)?.registered_count ?? 0;
  const full = count >= CLUB_CAPACITY;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const parsed = registrationSchema.safeParse({ clubSlug, displayName: name, studentId });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    try { await mutation.mutateAsync(parsed.data); } catch (err) { setError(err instanceof Error ? err.message : "Registration failed. Try again."); await queryClient.invalidateQueries({ queryKey: ["registrations", user?.id] }); }
  }
  return <div className="mt-10 border-t border-border pt-8">
    {query.data && <p className="mb-4 text-sm text-muted-foreground">{count} / {CLUB_CAPACITY} registered students</p>}
    {loading ? <p role="status" className="text-muted-foreground">Checking account…</p> : !user ? <Button asChild><Link to="/auth" search={{ club: clubSlug }}><UserPlus />Sign in to register</Link></Button> : query.isPending ? <p role="status">Loading registration…</p> : query.isError ? <><p role="alert" className="text-destructive">Could not check your registration.</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Try again</Button></> : registered ? <><p role="status" className="flex items-center gap-2 font-medium text-primary"><CheckCircle2 className="size-5" />You’re registered for {clubName} Club.</p><Button asChild variant="outline" className="mt-4"><Link to="/my-clubs">View my clubs</Link></Button></> : !open ? <Button onClick={() => { setName(query.data?.profile?.display_name ?? ""); setStudentId(query.data?.profile?.student_id ?? ""); setOpen(true); }}><UserPlus />Register for this club</Button> : <form onSubmit={submit} className="max-w-md space-y-5">
      <h2 className="text-xl font-semibold">Register for {clubName} Club</h2>
      <label className="block text-sm font-medium">Full name<input autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
      <label className="block text-sm font-medium">Student ID<input required maxLength={30} value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Registering…" : "Confirm registration"}</Button><Button variant="ghost" type="button" disabled={mutation.isPending} onClick={() => setOpen(false)}>Cancel</Button></div>
    </form>}
  </div>;
}