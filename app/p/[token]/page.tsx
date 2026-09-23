import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParticipantConfirmButton } from "@/components/participant-confirm-button";

export default async function ParticipantPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { tokenAcces: token }, include: { user: true, kamal: true } });
  if (!assignment) notFound();
  const confirmed = assignment.statut === "CONFIRME";
  const kamalClosed = assignment.kamal.statut !== "EN_COURS";
  return <main className="min-h-screen grid place-items-center p-5"><div className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm"><div className="text-sm font-bold text-emerald-700">KAMAL MANAGER</div><p className="mt-8 text-sm text-slate-500">Assalamou alaykoum</p><h1 className="mt-1 text-2xl font-bold">{assignment.user.prenom} {assignment.user.nom}</h1><div className="mt-7 rounded-2xl bg-emerald-50 p-6 text-center"><p className="text-sm text-emerald-800">{assignment.kamal.titre}</p><div className="mt-3 text-5xl font-black text-emerald-800">Juz {assignment.juzNumber}</div></div>{confirmed ? <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center"><div className="text-3xl">✓</div><h2 className="mt-2 font-bold text-emerald-800">Lecture confirmée</h2><p className="mt-1 text-sm text-emerald-700">Merci. Qu&apos;Allah accepte votre lecture.</p>{assignment.confirmedAt && <p className="mt-2 text-xs text-emerald-700">Confirmée le {assignment.confirmedAt.toLocaleString("fr-FR")}</p>}</div> : kamalClosed ? <div className="mt-6 rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-600">Ce Kamal n’accepte plus de confirmations.</div> : <ParticipantConfirmButton token={token} />}</div></main>;
}
