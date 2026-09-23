"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MobileAdminNav } from "@/components/admin-nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
    } else {
      setMobileOpen((value) => !value);
    }
  }

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return <div className="min-h-screen lg:flex">
    <aside data-collapsed={collapsed} aria-label="Menu administrateur" className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] border-r border-slate-200/80 bg-white transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:transition-[width] ${collapsed ? "lg:w-[88px]" : "lg:w-64"} ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`} id="admin-sidebar"><button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 lg:hidden"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18"/></svg></button>{sidebar}</aside>
    <button type="button" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur sm:px-6 lg:flex lg:justify-between lg:px-8">
        <a href="/admin/dashboard" className="flex min-w-0 items-center gap-2 justify-self-start lg:hidden"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-800 text-sm font-bold text-white">K</span><span className="truncate text-xs font-black tracking-wide text-slate-900">KAMAL MANAGER</span></a>
        <button type="button" onClick={toggleSidebar} aria-label={mobileOpen ? "Fermer le menu" : collapsed ? "Déplier le menu" : "Replier le menu"} aria-controls="admin-sidebar" aria-expanded={mobileOpen || !collapsed} className="grid h-10 w-10 place-items-center justify-self-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus-visible:outline-emerald-600 lg:justify-self-start"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/><path strokeLinecap="round" d="M9 6v12"/></svg></button>
        <div className="flex items-center justify-self-end lg:ml-auto"><span className="mr-3 hidden text-xs font-medium text-slate-400 sm:block">Espace responsable</span><ThemeToggle /></div>
      </header>
      <main className="min-w-0 px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:py-9 lg:pb-10"><div className="mx-auto max-w-7xl">{children}</div></main>
    </div>
    <MobileAdminNav />
  </div>;
}
