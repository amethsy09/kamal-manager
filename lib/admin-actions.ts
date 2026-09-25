"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyKamalMembers } from "@/lib/push-notifications";
import { requireAdmin } from "@/lib/auth";
import { planJuzAssignments } from "@/lib/kamal-assignments";
import { archiveKamal as archiveKamalRecord, confirmJuzAsAdmin, reassignPendingJuz, restoreKamal as restoreKamalRecord } from "@/lib/kamal-operations";

const memberSchema = z.object({ prenom: z.string().trim().min(1).max(80), nom: z.string().trim().min(1).max(80), telephone: z.string().trim().min(8).max(30) });

export async function createMember(formData: FormData) {
  await requireAdmin();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/members?error=invalid");
  try { await prisma.user.create({ data: { ...parsed.data, role: "MEMBER" } }); }
  catch { redirect("/admin/members?error=duplicate"); }
  revalidatePath("/admin/members");
  redirect("/admin/members?success=created");
}

export async function updateMember(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), prenom: z.string().trim().min(1).max(80), nom: z.string().trim().min(1).max(80), telephone: z.string().trim().min(8).max(30), actif: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/members?error=invalid");
  try { await prisma.user.updateMany({ where: { id: parsed.data.id, role: "MEMBER" }, data: { prenom: parsed.data.prenom, nom: parsed.data.nom, telephone: parsed.data.telephone, actif: parsed.data.actif === "true" } }); }
  catch { redirect("/admin/members?error=duplicate"); }
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");
  redirect("/admin/members?success=updated");
}


export async function archiveMember(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/members?error=invalid");
  await prisma.user.updateMany({ where: { id: id.data, role: "MEMBER" }, data: { actif: false } });
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");
  redirect("/admin/members?success=archived");
}

export async function restoreMember(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/members?error=invalid");
  await prisma.user.updateMany({ where: { id: id.data, role: "MEMBER" }, data: { actif: true } });
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");
  redirect("/admin/members?success=restored");
}

export async function deleteMember(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/members?error=invalid");
  const member = await prisma.user.findFirst({ where: { id: id.data, role: "MEMBER" }, include: { _count: { select: { assignments: true } } } });
  if (!member) redirect("/admin/members?error=not-found");
  if (member._count.assignments > 0) {
    await prisma.user.update({ where: { id: member.id }, data: { actif: false } });
    revalidatePath("/admin/members");
    revalidatePath("/admin/dashboard");
    redirect("/admin/members?success=archived");
  }
  await prisma.user.delete({ where: { id: member.id } });
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");
  redirect("/admin/members?success=deleted");
}

export async function setMemberActive(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const actif = z.enum(["true", "false"]).safeParse(formData.get("actif"));
  if (!id.success || !actif.success) redirect("/admin/members?error=invalid");
  await prisma.user.updateMany({ where: { id: id.data, role: "MEMBER" }, data: { actif: actif.data === "true" } });
  revalidatePath("/admin/members");
}

export async function createKamal(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ titre: z.string().trim().min(3).max(120), dateLimite: z.string().optional(), mode: z.enum(["alphabetique", "aleatoire"]) }).safeParse({ titre: formData.get("titre"), dateLimite: formData.get("dateLimite") || undefined, mode: formData.get("mode") });
  if (!parsed.success) redirect("/admin/kamals/new?error=invalid");
  const members = await prisma.user.findMany({ where: { role: "MEMBER", actif: true }, orderBy: [{ nom: "asc" }, { prenom: "asc" }] });
  if (!members.length) redirect("/admin/kamals/new?error=no-members");
  if (parsed.data.dateLimite && Number.isNaN(new Date(parsed.data.dateLimite).getTime())) redirect("/admin/kamals/new?error=invalid");
  const kamal = await prisma.$transaction(async (tx) => {
    const item = await tx.kamal.create({ data: { titre: parsed.data.titre, dateLimite: parsed.data.dateLimite ? new Date(parsed.data.dateLimite) : null, statut: "EN_COURS" } });
    await tx.assignment.createMany({ data: planJuzAssignments(item.id, members, parsed.data.mode) });
    return item;
  });
  await notifyKamalMembers(kamal.id);
  revalidatePath("/admin/dashboard");
  redirect(`/admin/kamals/${kamal.id}`);
}

export async function confirmAssignment(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/kamals?error=invalid");
  await confirmJuzAsAdmin(id.data);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/kamals");
}

export async function reassignJuz(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), userId: z.string().uuid() }).safeParse({ id: formData.get("id"), userId: formData.get("userId") });
  if (!parsed.success) redirect("/admin/kamals?error=invalid");
  const result = await reassignPendingJuz(parsed.data.id, parsed.data.userId);
  if (!result.ok) redirect("/admin/kamals?error=reassign");
  revalidatePath(`/admin/kamals/${result.kamalId}`);
  revalidatePath("/admin/kamals");
  revalidatePath("/admin/dashboard");
}

export async function updateKamalDetails(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), titre: z.string().trim().min(3).max(120), dateLimite: z.string().optional() }).safeParse({ id: formData.get("id"), titre: formData.get("titre"), dateLimite: formData.get("dateLimite") || undefined });
  if (!parsed.success) redirect("/admin/kamals?error=invalid");
  if (parsed.data.dateLimite && Number.isNaN(new Date(parsed.data.dateLimite).getTime())) redirect("/admin/kamals?error=invalid");
  await prisma.kamal.update({ where: { id: parsed.data.id }, data: { titre: parsed.data.titre, dateLimite: parsed.data.dateLimite ? new Date(parsed.data.dateLimite) : null } });
  revalidatePath(`/admin/kamals/${parsed.data.id}`);
  revalidatePath("/admin/kamals");
  revalidatePath("/admin/dashboard");
}

export async function setKamalStatus(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), statut: z.enum(["EN_COURS", "TERMINE", "EXPIRE"]) }).safeParse({ id: formData.get("id"), statut: formData.get("statut") });
  if (!parsed.success) redirect("/admin/kamals?error=invalid");
  await prisma.kamal.updateMany({ where: { id: parsed.data.id, archivedAt: null }, data: { statut: parsed.data.statut } });
  revalidatePath(`/admin/kamals/${parsed.data.id}`);
  revalidatePath("/admin/kamals");
  revalidatePath("/admin/dashboard");
}


export async function archiveKamal(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/kamals?error=invalid");
  const result = await archiveKamalRecord(id.data);
  if (!result.ok) redirect(`/admin/kamals/${id.data}?error=archive`);
  revalidatePath("/admin/kamals");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/kamals/${id.data}`);
  redirect(`/admin/kamals/${id.data}?success=archived`);
}

export async function restoreKamal(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/kamals?error=invalid");
  const restored = await restoreKamalRecord(id.data);
  if (!restored) redirect(`/admin/kamals/${id.data}?error=restore`);
  revalidatePath("/admin/kamals");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/kamals/${id.data}`);
  redirect(`/admin/kamals/${id.data}?success=restored`);
}
