"use client";

import { useMemo, useState } from "react";
import { archiveMember, createMember, deleteMember, restoreMember, updateMember } from "@/lib/admin-actions";

type Member = { id: string; prenom: string; nom: string; telephone: string; actif: boolean };
type Notice = { kind: "success" | "error"; message: string } | null;

export function MemberManager({ members, notice }: { members: Member[]; notice: Notice }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => members.find((member) => member.id === selectedId), [members, selectedId]);
  const action = selected ? updateMember : createMember;

  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(19rem,.8fr)_minmax(0,1.2fr)]">
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5"><span className="text-xs font-bold uppercase tracking-[.15em] text-emerald-700">{selected ? "Modifier" : "Nouveau"}</span><h2 className="mt-1 text-lg font-bold text-slate-950">{selected ? `${selected.prenom} ${selected.nom}` : "Ajouter un membre"}</h2><p className="mt-1 text-sm text-slate-500">{selected ? "Modifiez ses coordonnées ou son statut." : "Les nouveaux membres sont actifs et peuvent recevoir des Juz."}</p></div>
      <label className="mb-4 block text-xs font-semibold text-slate-600">Membre sélectionné<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className={inputClass}><option value="">Ajouter une nouvelle personne</option>{members.map((member) => <option key={member.id} value={member.id}>{member.prenom} {member.nom}{member.actif ? "" : " (inactif)"}</option>)}</select></label>
      {notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`mb-4 rounded-xl border px-3.5 py-3 text-sm ${notice.kind === "error" ? "border-red-100 bg-red-50 text-red-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>{notice.message}</p>}
      <form action={action} className="space-y-4">
        {selected && <input type="hidden" name="id" value={selected.id}/>}
        <Field label="Prénom"><input key={`prenom-${selectedId}`} name="prenom" required maxLength={80} defaultValue={selected?.prenom ?? ""} placeholder="Ex. Aïssatou" className={inputClass} /></Field>
        <Field label="Nom"><input key={`nom-${selectedId}`} name="nom" required maxLength={80} defaultValue={selected?.nom ?? ""} placeholder="Ex. Ndiaye" className={inputClass} /></Field>
        <Field label="Téléphone"><input key={`telephone-${selectedId}`} name="telephone" required minLength={8} maxLength={30} type="tel" defaultValue={selected?.telephone ?? ""} placeholder="+221 77 000 00 00" className={inputClass} /></Field>
        {selected && <label className="block text-xs font-semibold text-slate-600">Statut<select key={`actif-${selectedId}`} name="actif" defaultValue={String(selected.actif)} className={inputClass}><option value="true">Actif</option><option value="false">Archivé / inactif</option></select></label>}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap"><button className="min-h-11 flex-1 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900">{selected ? "Enregistrer les modifications" : "Ajouter le membre"}</button>{selected && <><button formAction={selected.actif ? archiveMember : restoreMember} formNoValidate className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{selected.actif ? "Archiver" : "Restaurer"}</button><button formAction={deleteMember} formNoValidate className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50" onClick={(event) => { if (!window.confirm(`Supprimer ${selected.prenom} ${selected.nom} ?`)) event.preventDefault(); }}>Supprimer</button></>}</div>
        {selected && <p className="text-xs leading-5 text-slate-400">Archiver retire le membre des prochaines affectations sans effacer son historique. Supprimer l’archive automatiquement si des affectations existent.</p>}
      </form>
    </section>

    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Liste des membres</h2><span className="text-xs text-slate-400">{members.length} au total</span></div><div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">{members.length ? <div className="divide-y divide-slate-100">{members.map((member) => <button type="button" key={member.id} onClick={() => setSelectedId(member.id)} aria-pressed={selectedId === member.id} className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:px-5 ${selectedId === member.id ? "bg-emerald-50/60" : ""}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold uppercase ${member.actif ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{member.prenom.slice(0, 1)}{member.nom.slice(0, 1)}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{member.prenom} {member.nom}</span><span className="mt-0.5 block text-sm text-slate-500">{member.telephone}</span></span><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.actif ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{member.actif ? "Actif" : "Archivé"}</span><span className="ml-1 text-slate-300" aria-hidden="true">›</span></button>)}</div> : <div className="px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">♧</span><h3 className="mt-4 font-semibold text-slate-900">La liste est encore vide</h3><p className="mt-1 text-sm text-slate-500">Ajoutez une personne avec le formulaire pour commencer.</p></div>}</div></section>
  </div>;
}

const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-slate-600">{label}{children}</label>; }
