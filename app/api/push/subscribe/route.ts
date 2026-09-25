import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAfterOptIn } from "@/lib/push-notifications";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
});
const bodySchema = z.object({ subscription: subscriptionSchema, token: z.string().min(1).max(512).optional() });
const deleteSchema = z.object({ endpoint: z.string().url().max(2048), token: z.string().min(1).max(512).optional() });

async function getUserId(token?: string) {
  const session = await getSession();
  if (session) return session.userId;
  if (!token) return null;
  const assignment = await prisma.assignment.findUnique({ where: { tokenAcces: token }, select: { statut: true, userId: true, user: { select: { actif: true, role: true } } } });
  if (!assignment || !assignment.user.actif || assignment.user.role !== "MEMBER" || assignment.statut === "REASSIGNE" || assignment.statut === "ANNULE") return null;
  return assignment.userId;
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const userId = await getUserId(parsed.data.token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.subscription.endpoint },
    create: { userId, endpoint: parsed.data.subscription.endpoint, ...parsed.data.subscription.keys },
    update: { userId, ...parsed.data.subscription.keys },
  });
  await notifyAfterOptIn(userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const userId = await getUserId(parsed.data.token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, userId } });
  return NextResponse.json({ ok: true });
}
