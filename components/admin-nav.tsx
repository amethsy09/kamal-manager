import Link from "next/link";
import { logoutAdmin } from "@/lib/auth";
import { AdminNavLinks } from "@/components/admin-nav-links";

export async function AdminNav() {
  async function logout() {
    "use server";
    await logoutAdmin();
  }

  return <div className="flex h-full min-h-0 flex-col px-5 py-6">
    <Link href="/admin/dashboard" className="sidebar-brand flex items-center gap-3 px-2">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-800 text-white shadow-sm"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-7-8h14M5 5l14 14M19 5 5 19" /></svg></span>
      <span className="sidebar-label"><span className="block text-sm font-black tracking-wide text-slate-900">KAMAL</span><span className="block text-xs font-medium tracking-[.18em] text-emerald-700">MANAGER</span></span>
    </Link>
    <div className="sidebar-label mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Espace responsable</div>
    <div className="mt-3"><AdminNavLinks /></div>
    <div className="sidebar-note mt-auto rounded-2xl bg-emerald-50 p-4"><div className="sidebar-label text-sm font-semibold text-emerald-950">Un pas à la fois</div><p className="sidebar-label mt-1 text-xs leading-5 text-emerald-800/80">Suivez chaque lecture jusqu’au dernier Juz.</p><span className="sidebar-note-icon hidden text-xl text-emerald-800">☾</span></div>
    <form action={logout} className="mt-4"><button aria-label="Déconnexion" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg><span className="sidebar-label">Déconnexion</span></button></form>
  </div>;
}
