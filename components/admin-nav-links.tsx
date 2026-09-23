"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Vue d’ensemble", short: "Accueil", icon: "home" },
  { href: "/admin/kamals", label: "Mes Kamals", short: "Kamals", icon: "book" },
  { href: "/admin/members", label: "Membres", short: "Membres", icon: "users" },
] as const;

function NavIcon({ name }: { name: (typeof links)[number]["icon"] }) {
  const common = "h-5 w-5 shrink-0";
  if (name === "home") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5v-7h-5v7h-5a1 1 0 0 1-1-1V10Z" /></svg>;
  if (name === "book") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5C9.5 4.8 6.5 4.5 3.5 5.5v14c3-1 6-.7 8.5 1 2.5-1.7 5.5-2 8.5-1v-14c-3-1-6-.7-8.5 1Zm0 0v14" /></svg>;
  return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 20v-1.2a5.5 5.5 0 0 1 11 0V20m1-10a3.2 3.2 0 1 0 0-6.4m2 10.2a5.4 5.4 0 0 1 3 4.9V20" /></svg>;
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
}

export function AdminNavLinks() {
  const pathname = usePathname();
  return <nav aria-label="Navigation principale" className="space-y-1">
    {links.map((link) => {
      const active = isActive(pathname, link.href);
      return <Link key={link.href} href={link.href} aria-label={link.label} data-tooltip={link.label} aria-current={active ? "page" : undefined} className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><NavIcon name={link.icon} /><span className="sidebar-label">{link.label}</span>{active && <span className="sidebar-active-dot ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />}</Link>;
    })}
  </nav>;
}

export function MobileAdminNav() {
  const pathname = usePathname();
  return <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-3 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur lg:hidden">
    {links.map((link) => {
      const active = isActive(pathname, link.href);
      return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${active ? "text-emerald-800" : "text-slate-400"}`}><NavIcon name={link.icon} /><span>{link.short}</span></Link>;
    })}
  </nav>;
}
