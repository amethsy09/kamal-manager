import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordJuzReading } from "@/lib/kamal-operations";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { tokenAcces: token }, include: { kamal: true } });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.statut === "REASSIGNE" || assignment.statut === "ANNULE") return NextResponse.json({ error: "Token invalid" }, { status: 410 });
  if (assignment.statut === "CONFIRME") return NextResponse.json({ ok: true, lectureCount: 2, completed: true, alreadyCompleted: true });
  if (assignment.kamal.statut !== "EN_COURS") return NextResponse.json({ error: "Kamal closed" }, { status: 410 });

  const result = await recordJuzReading(assignment.id, "MEMBER");
  if (result.ok) return NextResponse.json(result);
  if (result.reason === "not-found") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (result.reason === "closed") return NextResponse.json({ error: "Assignment unavailable" }, { status: 410 });
  return NextResponse.json({ error: "Please retry" }, { status: 409 });
}
