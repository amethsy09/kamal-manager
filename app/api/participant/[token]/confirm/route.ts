import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { tokenAcces: token }, include: { kamal: true } });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.statut === "REASSIGNE" || assignment.statut === "ANNULE") return NextResponse.json({ error: "Token invalid" }, { status: 410 });
  if (assignment.statut === "CONFIRME") return NextResponse.json({ ok: true, alreadyConfirmed: true });
  if (assignment.kamal.statut !== "EN_COURS") return NextResponse.json({ error: "Kamal closed" }, { status: 410 });

  const update = await prisma.assignment.updateMany({
    where: { id: assignment.id, statut: "EN_ATTENTE", kamal: { statut: "EN_COURS" } },
    data: { statut: "CONFIRME", confirmedAt: new Date(), confirmedBy: "MEMBER" },
  });
  if (update.count === 1) return NextResponse.json({ ok: true });

  const current = await prisma.assignment.findUnique({ where: { id: assignment.id }, include: { kamal: true } });
  if (current?.statut === "CONFIRME") return NextResponse.json({ ok: true, alreadyConfirmed: true });
  return NextResponse.json({ error: "Assignment unavailable" }, { status: 410 });
}
