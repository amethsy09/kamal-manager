import { prisma } from "@/lib/prisma";
import { MemberManager } from "@/components/member-manager";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const members = await prisma.user.findMany({ where: { role: "MEMBER" }, orderBy: [{ actif: "desc" }, { nom: "asc" }, { prenom: "asc" }], select: { id: true, prenom: true, nom: true, telephone: true, actif: true } });
  const activeCount = members.filter((member) => member.actif).length;
  const notice = params.error ? { kind: "error" as const, message: params.error === "duplicate" ? "Ce numéro de téléphone est déjà utilisé." : params.error === "not-found" ? "Ce membre n’existe plus." : "Vérifiez les informations saisies." } : params.success ? { kind: "success" as const, message: params.success === "created" ? "Le membre a bien été ajouté." : params.success === "updated" ? "Les modifications ont été enregistrées." : params.success === "archived" ? "Le membre est archivé : il ne recevra plus de nouvelles affectations, son historique est conservé." : params.success === "restored" ? "Le membre a été restauré et peut recevoir de nouvelles affectations." : "Le membre a été supprimé." } : null;
  return <div className="space-y-7">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-700">Votre communauté</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Membres</h1><p className="mt-2 text-sm text-slate-500">Ajoutez, modifiez ou supprimez les personnes de vos lectures collectives.</p></div><div className="flex gap-2"><Count label="Total" value={members.length} /><Count label="Actifs" value={activeCount} /></div></header>
    <MemberManager members={members} notice={notice}/>
  </div>;
}
function Count({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center"><div className="text-lg font-bold leading-5 text-slate-900">{value}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div></div>; }
