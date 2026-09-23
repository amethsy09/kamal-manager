import "server-only";

import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/tokens";

export async function confirmJuzAsAdmin(assignmentId: string) {
  return prisma.assignment.updateMany({
    where: { id: assignmentId, statut: "EN_ATTENTE", kamal: { statut: "EN_COURS" } },
    data: { statut: "CONFIRME", confirmedAt: new Date(), confirmedBy: "ADMIN" },
  });
}

export async function archiveKamal(kamalId: string) {
  const kamal = await prisma.kamal.findUnique({ where: { id: kamalId }, select: { statut: true, archivedAt: true } });
  if (!kamal) return { ok: false as const, reason: "not-found" };
  if (kamal.archivedAt) return { ok: true as const, reason: "already-archived" };
  if (kamal.statut !== "TERMINE" && kamal.statut !== "EXPIRE") return { ok: false as const, reason: "not-terminal" };
  const result = await prisma.kamal.updateMany({ where: { id: kamalId, statut: { in: ["TERMINE", "EXPIRE"] }, archivedAt: null }, data: { archivedAt: new Date() } });
  return result.count === 1 ? { ok: true as const, reason: "archived" } : { ok: false as const, reason: "conflict" };
}

export async function restoreKamal(kamalId: string) {
  const result = await prisma.kamal.updateMany({ where: { id: kamalId, archivedAt: { not: null } }, data: { archivedAt: null } });
  return result.count === 1;
}

export async function reassignPendingJuz(assignmentId: string, userId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const [assignment, member] = await Promise.all([
        tx.assignment.findUnique({ where: { id: assignmentId }, include: { kamal: true } }),
        tx.user.findFirst({ where: { id: userId, role: "MEMBER", actif: true } }),
      ]);
      if (!assignment) return { ok: false as const, reason: "assignment" };
      if (!member) return { ok: false as const, reason: "member" };
      if (assignment.userId === member.id) return { ok: false as const, reason: "same-member" };
      if (assignment.statut !== "EN_ATTENTE" || assignment.kamal.statut !== "EN_COURS") return { ok: false as const, reason: "closed" };

      const changed = await tx.assignment.updateMany({
        where: { id: assignment.id, statut: "EN_ATTENTE", kamal: { statut: "EN_COURS" } },
        data: { statut: "REASSIGNE", tokenAcces: generateAccessToken() },
      });
      if (changed.count !== 1) return { ok: false as const, reason: "conflict" };
      await tx.assignment.create({ data: { kamalId: assignment.kamalId, userId: member.id, juzNumber: assignment.juzNumber, tokenAcces: generateAccessToken() } });
      return { ok: true as const, kamalId: assignment.kamalId, juzNumber: assignment.juzNumber };
    });
  } catch {
    return { ok: false as const, reason: "conflict" };
  }
}

