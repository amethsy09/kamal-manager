import Link from "next/link";
import { prisma } from "@/lib/prisma";

const labels: Record<string, string> = { BROUILLON: "Brouillon", EN_COURS: "En cours", TERMINE: "Terminé", EXPIRE: "Expiré" };
const statuses = ["BROUILLON", "EN_COURS", "TERMINE", "EXPIRE"] as const;

export default async function KamalsPage({ searchParams }: { searchParams: Promise<{ error?: string; q?: string; status?: string; archived?: string }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const status = statuses.find((item) => item === params.status);
  const archived = params.archived === "true";
  const kamals = await prisma.kamal.findMany({
    where: {
      archivedAt: archived ? { not: null } : null,
      ...(status ? { statut: status } : {}),
      ...(query ? { titre: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      assignments: { where: { statut: { in: ["EN_ATTENTE", "CONFIRME"] } } },
    },
  });

  return <div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-700">Cycles de lecture</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{archived ? "Archives" : "Kamals"}</h1><p className="mt-2 text-sm text-slate-500">{archived ? "Retrouvez et restaurez vos cycles archivés." : "Créez un cycle et gardez un œil sur chaque Jukki."}</p></div><div className="flex flex-wrap gap-2"><Link href={archived ? "/admin/kamals" : "/admin/kamals?archived=true"} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">{archived ? "Kamals actifs" : "Archives"}</Link>{!archived && <Link href="/admin/kamals/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"><span className="text-lg">+</span>Nouveau Kamal</Link>}</div></header>
    {params.error && <p role="alert" className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">Cette action n’a pas pu être effectuée. Vérifiez le statut du Kamal et la disponibilité du membre.</p>}

    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <form method="get" action="/admin/kamals" className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_12rem_auto_auto] sm:items-end">
        {archived && <input type="hidden" name="archived" value="true"/>}<label className="block text-xs font-semibold text-slate-600">Rechercher par titre<input name="q" type="search" maxLength={120} defaultValue={query} placeholder="Ex. Kamal du vendredi" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10" /></label>
        <label className="block text-xs font-semibold text-slate-600">Statut<select name="status" defaultValue={status ?? "TOUS"} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"><option value="TOUS">Tous les statuts</option>{statuses.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <button className="min-h-11 rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900">Filtrer</button>
        <Link href={archived ? "/admin/kamals?archived=true" : "/admin/kamals"} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Réinitialiser</Link>
      </form>
      <p className="mt-3 text-xs text-slate-400">{kamals.length} résultat{kamals.length === 1 ? "" : "s"}{query ? ` pour « ${query} »` : ""}{status ? ` · ${labels[status]}` : ""}</p>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{kamals.length ? kamals.map((kamal) => { const confirmed = kamal.assignments.filter((a) => a.statut === "CONFIRME").length; const progress = Math.round(confirmed / 30 * 100); return <Link key={kamal.id} href={`/admin/kamals/${kamal.id}`} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-lg text-emerald-800">▤</span><Status status={kamal.statut} /></div><h2 className="mt-4 truncate text-lg font-bold text-slate-950">{kamal.titre}</h2><p className="mt-1 text-sm text-slate-500">{archivedAtLabel(kamal.archivedAt)}</p><div className="mt-5 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{confirmed} <span className="font-normal text-slate-400">/ 30 Jukkis terminés</span></span><span className="font-semibold text-emerald-800">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex items-center justify-between text-xs text-slate-400"><span>{kamal.assignments.filter(a => a.statut === "EN_ATTENTE").length} en attente</span><span className="font-semibold text-emerald-800 opacity-0 transition group-hover:opacity-100">Voir le suivi →</span></div></Link>; }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center sm:col-span-2 xl:col-span-3"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl text-emerald-800">☾</span><h2 className="mt-4 font-semibold text-slate-900">{query || status ? "Aucun résultat pour ces filtres" : archived ? "Aucun Kamal archivé" : "Aucun Kamal pour l’instant"}</h2><p className="mt-1 text-sm text-slate-500">{query || status ? "Essayez un autre titre ou statut, ou réinitialisez les filtres." : archived ? "Les Kamals terminés ou expirés apparaîtront ici après archivage." : "Créez votre premier cycle pour distribuer les 30 Jukkis."}</p>{query || status ? <Link href={archived ? "/admin/kamals?archived=true" : "/admin/kamals"} className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Effacer les filtres</Link> : <Link href="/admin/kamals/new" className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white">Créer un Kamal</Link>}</div>}</section>
  </div>;
}
function Status({ status }: { status: string }) { const tone = status === "EN_COURS" ? "bg-emerald-50 text-emerald-800" : status === "TERMINE" ? "bg-blue-50 text-blue-800" : status === "EXPIRE" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{labels[status] ?? status}</span>; }

function archivedAtLabel(date: Date | null) { return date ? `Archivé le ${date.toLocaleDateString("fr-FR")}` : "Aucune date limite"; }
