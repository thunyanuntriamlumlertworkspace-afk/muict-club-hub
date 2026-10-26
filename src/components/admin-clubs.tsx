import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Users, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAdminOverview, getClubRegistrations, saveClub, deleteClub, removeRegistration, type AdminClubRow } from "@/lib/admin.functions";
import { CLUB_CAPACITY, type Club } from "@/lib/clubs";

const emptyClub: Club = { slug: "", name: "", tag: "", short: "", about: "", meets: "", location: "", members: 0, founded: 0, president: "", activities: [], capacity: CLUB_CAPACITY };

export function AdminClubs({ userId }: { userId: string }) {
  const fetchOverview = useServerFn(getAdminOverview);
  const fetchStudents = useServerFn(getClubRegistrations);
  const save = useServerFn(saveClub);
  const removeClub = useServerFn(deleteClub);
  const removeStudent = useServerFn(removeRegistration);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryKey: ["admin-clubs", userId], queryFn: () => fetchOverview() });
  const [selected, setSelected] = useState<AdminClubRow | null>(null);
  const students = useQuery({ queryKey: ["admin-students", userId, selected?.slug], queryFn: () => selected ? fetchStudents({ data: { clubSlug: selected.slug } }) : Promise.resolve([]), enabled: Boolean(selected) });
  const [editor, setEditor] = useState<{ club: Club; existing: boolean } | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: "club" | "student"; id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-clubs"] }), queryClient.invalidateQueries({ queryKey: ["admin-students"] }), queryClient.invalidateQueries({ queryKey: ["clubs"] }), queryClient.invalidateQueries({ queryKey: ["registrations"] })]);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await save({ data: { ...editor.club, activities: editor.club.activities.map((activity) => activity.trim()).filter(Boolean), founded: editor.club.founded || null } });
      await refresh(); setEditor(null); setNotice("Club saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the club."); }
    finally { setBusy(false); }
  }
  async function confirmRemoval() {
    if (!confirmation) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (confirmation.type === "club") {
        await removeClub({ data: { slug: confirmation.id } });
        if (selected?.slug === confirmation.id) setSelected(null);
      } else await removeStudent({ data: { registrationId: confirmation.id } });
      await refresh(); setConfirmation(null); setNotice("Removed successfully.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not remove this item."); }
    finally { setBusy(false); }
  }
  if (overview.isPending) return <p role="status">Loading clubs…</p>;
  if (overview.isError) return <div><p role="alert" className="text-destructive">Could not load the club overview.</p><Button variant="outline" className="mt-4" onClick={() => overview.refetch()}>Try again</Button></div>;
  const clubs = overview.data;
  const activeClub = clubs.find((club) => club.slug === selected?.slug);
  function openEditor(club?: Club) { setError(""); setEditor({ club: club ? { ...club } : { ...emptyClub }, existing: Boolean(club) }); }
  return <>
    <div className="mb-8 grid grid-cols-2 gap-6 border-b border-border pb-6 sm:grid-cols-3">
      <div><p className="text-sm text-muted-foreground">Clubs</p><p className="mt-1 text-3xl font-semibold">{clubs.length}</p></div>
      <div><p className="text-sm text-muted-foreground">Registrations</p><p className="mt-1 text-3xl font-semibold">{clubs.reduce((sum, club) => sum + club.registered_count, 0)}</p></div>
      <div><p className="text-sm text-muted-foreground">Available places</p><p className="mt-1 text-3xl font-semibold">{clubs.reduce((sum, club) => sum + Math.max(0, club.capacity - club.registered_count), 0)}</p></div>
    </div>
    {notice && <p role="status" className="mb-5 text-primary">{notice}</p>}
    {error && !editor && !confirmation && <p role="alert" className="mb-5 text-destructive">{error}</p>}
    {selected ? <>
      <Button variant="ghost" className="mb-5" onClick={() => setSelected(null)}><ArrowLeft />All clubs</Button>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">{activeClub?.name ?? selected.name}</h2><p className="mt-2 text-muted-foreground">{activeClub?.registered_count ?? 0} / {activeClub?.capacity ?? selected.capacity} registered students</p></div><Button variant="outline" onClick={() => openEditor(activeClub ?? selected)}><Pencil />Edit club</Button></div>
      {students.isPending ? <p role="status" className="mt-8">Loading students…</p> : students.isError ? <div className="mt-8"><p role="alert" className="text-destructive">Could not load students.</p><Button variant="outline" onClick={() => students.refetch()}>Try again</Button></div> : students.data?.length ? <div className="mt-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3 pr-4">Seat</th><th className="py-3 pr-4">Student</th><th className="py-3 pr-4">Student ID</th><th className="py-3 pr-4">Registered</th><th className="py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{students.data.map((student) => <tr key={student.id} className="border-b border-border"><td className="py-4 pr-4">{student.seat_number}</td><td className="min-w-36 py-4 pr-4 font-medium">{student.display_name || "—"}</td><td className="py-4 pr-4">{student.student_id || "—"}</td><td className="whitespace-nowrap py-4 pr-4 text-muted-foreground">{new Date(student.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok" })}</td><td><Button variant="ghost" size="icon" aria-label={`Remove ${student.display_name || student.student_id}`} title="Remove registration" onClick={() => { setError(""); setConfirmation({ type: "student", id: student.id, name: student.display_name || student.student_id }); }}><Trash2 className="text-destructive" /></Button></td></tr>)}</tbody></table></div> : <p className="mt-10 text-muted-foreground">No students registered yet.</p>}
    </> : <>
      <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Clubs</h2><Button onClick={() => openEditor()}><Plus />Add club</Button></div>
      {!clubs.length && <p className="text-muted-foreground">No clubs yet.</p>}
      <div className="divide-y divide-border">{clubs.map((club) => <article key={club.slug} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0 flex-1 basis-52"><p className="text-xs font-medium text-muted-foreground">{club.tag}</p><Link to="/clubs/$clubId" params={{ clubId: club.slug }} className="mt-1 block text-lg font-semibold hover:text-primary">{club.name}</Link><p className="mt-1 text-sm text-muted-foreground">{club.registered_count} / {club.capacity} registered</p></div><div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => setSelected(club)}><Users />Students</Button><Button variant="ghost" size="icon" aria-label={`Edit ${club.name}`} title="Edit club" onClick={() => openEditor(club)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${club.name}`} title="Remove club" onClick={() => { setError(""); setConfirmation({ type: "club", id: club.slug, name: club.name }); }}><Trash2 className="text-destructive" /></Button></div></article>)}</div>
    </>}
    <Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open && !busy) { setEditor(null); setError(""); } }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{editor?.existing ? "Edit club" : "Add club"}</DialogTitle><DialogDescription>{editor?.club.name || "New club"}</DialogDescription></DialogHeader>{editor && <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">{([['name', 'Club name'], ['slug', 'Club ID'], ['tag', 'Category'], ['meets', 'Meeting time'], ['location', 'Location'], ['president', 'President']] as const).map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<Input className="mt-2" required={key === "name" || key === "slug" || key === "tag"} disabled={busy || (key === "slug" && editor.existing)} maxLength={key === "slug" || key === "tag" ? 50 : 100} pattern={key === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined} value={editor.club[key]} onChange={(e) => setEditor({ ...editor, club: { ...editor.club, [key]: e.target.value } })} /></label>)}</div>
      <label className="block text-sm font-medium">Short description<Textarea className="mt-2" maxLength={300} value={editor.club.short} onChange={(e) => setEditor({ ...editor, club: { ...editor.club, short: e.target.value } })} /></label>
      <label className="block text-sm font-medium">About<Textarea className="mt-2" maxLength={2000} rows={4} value={editor.club.about} onChange={(e) => setEditor({ ...editor, club: { ...editor.club, about: e.target.value } })} /></label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{([['capacity', 'Seat limit', 1, 500], ['members', 'Member count', 0, 100000], ['founded', 'Founded', 1900, 2100]] as const).map(([key, label, min, max]) => <label key={key} className="block text-sm font-medium">{label}<Input className="mt-2" type="number" step={1} min={min} max={max} required={key !== "founded"} value={key === "founded" && !editor.club.founded ? "" : editor.club[key]} onChange={(e) => setEditor({ ...editor, club: { ...editor.club, [key]: Number(e.target.value) } })} /></label>)}</div>
      <label className="block text-sm font-medium">Activities<Textarea className="mt-2" rows={4} value={editor.club.activities.join("\n")} onChange={(e) => setEditor({ ...editor, club: { ...editor.club, activities: e.target.value.split("\n") } })} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-border pt-4"><Button variant="outline" type="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</Button><Button type="submit" disabled={busy}><Save />{busy ? "Saving…" : "Save club"}</Button></div>
    </form>}</DialogContent></Dialog>
    <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !busy) { setConfirmation(null); setError(""); } }}><DialogContent className="w-[calc(100%-2rem)]"><DialogHeader><DialogTitle>{confirmation?.type === "club" ? "Remove club?" : "Remove registration?"}</DialogTitle><DialogDescription>{confirmation?.type === "club" ? `${confirmation.name} and all its registrations will be permanently removed.` : `${confirmation?.name}'s registration will be removed and their place will become available.`}</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-3"><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={confirmRemoval}><Trash2 />{busy ? "Removing…" : "Remove"}</Button></div></DialogContent></Dialog>
  </>;
}