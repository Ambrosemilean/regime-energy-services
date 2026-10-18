"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = { id: string; year: string; title: string; description: string | null; display_order: number; is_active: boolean };
type Draft = { id?: string; year: string; title: string; description: string; display_order: number; is_active: boolean };
const emptyDraft: Draft = { year: "", title: "", description: "", display_order: 0, is_active: true };

export default function CompanyHistoryManager({ milestones }: { milestones: Milestone[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function startCreate() { setSuccess(""); setError(""); setDraft({ ...emptyDraft }); }
  function startEdit(item: Milestone) {
    setSuccess(""); setError("");
    setDraft({ id: item.id, year: String(item.year ?? ""), title: item.title, description: item.description || "", display_order: item.display_order ?? 0, is_active: item.is_active });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/company-history", { method: draft.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, year: draft.year.trim(), title: draft.title.trim(), description: draft.description.trim() }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to save milestone.");
      setDraft(null); setSuccess(draft.id ? "Milestone updated successfully." : "Milestone created successfully."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (deletingId || !window.confirm("Delete this milestone? This cannot be undone.")) return;
    setDeletingId(id); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/admin/company-history?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to delete milestone.");
      setSuccess("Milestone deleted successfully."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete milestone."); }
    finally { setDeletingId(null); }
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-gray-900">History milestones</p><p className="mt-1 text-sm text-gray-500">{milestones.length} saved {milestones.length === 1 ? "milestone" : "milestones"} · {milestones.filter((item) => item.is_active).length} published</p></div>{!draft && <button type="button" onClick={startCreate} className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><span className="mr-2 text-lg leading-none" aria-hidden="true">+</span>Add milestone</button>}</div></section>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Something went wrong</p><p className="mt-1">{error}</p></div>}
    {success && !draft && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</div>}

    {draft && <form onSubmit={handleSave} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Milestone details</p><h2 className="mt-1 text-xl font-extrabold text-gray-950">{draft.id ? "Edit milestone" : "Add a milestone"}</h2><p className="mt-1 text-sm text-gray-500">Required fields are marked with an asterisk (*).</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${draft.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{draft.is_active ? "Will be published" : "Hidden from website"}</span></div>
      <div className="mt-6 grid gap-5 md:grid-cols-3"><div><label htmlFor="history-year" className="mb-2 block text-sm font-semibold text-gray-700">Year *</label><input id="history-year" type="text" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} required maxLength={30} placeholder="2013" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"/><p className="mt-1.5 text-xs text-gray-500">A year or period, such as “2013” or “2013–2015”.</p></div>
      <div className="md:col-span-2"><label htmlFor="history-title" className="mb-2 block text-sm font-semibold text-gray-700">Milestone title *</label><input id="history-title" type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required maxLength={180} placeholder="Our journey into LPG distribution" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"/></div>
      <div className="md:col-span-3"><label htmlFor="history-description" className="mb-2 block text-sm font-semibold text-gray-700">Description</label><textarea id="history-description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={5} maxLength={5000} placeholder="Describe this milestone and why it matters to the company..." className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"/><p className="mt-1.5 text-right text-xs text-gray-400">{draft.description.length}/5000 characters</p></div>
      <div><label htmlFor="history-order" className="mb-2 block text-sm font-semibold text-gray-700">Display order</label><input id="history-order" type="number" value={draft.display_order} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"/><p className="mt-1.5 text-xs text-gray-500">Lower numbers appear first.</p></div>
      <div className="flex items-center md:col-span-2"><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-700 focus:ring-blue-500"/><span><span className="block text-sm font-semibold text-gray-800">Publish on public website</span><span className="mt-1 block text-xs leading-5 text-gray-500">Turn this off to keep the milestone in the admin list without showing it publicly.</span></span></label></div></div>
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setDraft(null); setError(""); }} disabled={saving} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : draft.id ? "Save changes" : "Create milestone"}</button></div>
    </form>}

    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-5 py-4 sm:px-6"><h2 className="font-bold text-gray-950">Saved milestones</h2><p className="mt-1 text-sm text-gray-500">Edit, publish, or remove milestones from the public timeline.</p></div>
      {milestones.length === 0 ? <div className="px-6 py-14 text-center"><h3 className="text-lg font-bold text-gray-900">No milestones yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Add the first milestone to start building the company history timeline.</p>{!draft && <button type="button" onClick={startCreate} className="mt-5 rounded-lg bg-blue-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-800">Add first milestone</button>}</div> : <ol className="divide-y divide-gray-100">{milestones.map((item) => <li key={item.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2.5"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-800">{item.year}</span><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{item.is_active ? "Published" : "Hidden"}</span><span className="text-xs text-gray-400">Order: {item.display_order}</span></div><h3 className="mt-3 text-base font-bold text-gray-950">{item.title}</h3>{item.description && <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-gray-600">{item.description}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">Edit</button><button type="button" onClick={() => handleDelete(item.id)} disabled={deletingId !== null} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{deletingId === item.id ? "Deleting…" : "Delete"}</button></div></li>)}</ol>}
    </section>
  </div>;
}
