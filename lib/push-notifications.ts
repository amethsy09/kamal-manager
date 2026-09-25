import "server-only";

import * as webpush from "web-push";
import { prisma } from "@/lib/prisma";

type Notice = { title: string; body: string; url: string };

function configured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  } catch {
    return false;
  }
}

async function sendOnce(userId: string, reminderKey: string, notice: Notice) {
  if (!configured()) return false;
  const alreadySent = await prisma.pushReminderLog.findUnique({ where: { userId_reminderKey: { userId, reminderKey } } });
  if (alreadySent) return false;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subscriptions.length) return false;

  let delivered = false;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(notice));
      delivered = true;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
    }
  }));
  if (!delivered) return false;
  try {
    await prisma.pushReminderLog.create({ data: { userId, reminderKey } });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
  }
  return true;
}

export async function notifyKamalMembers(kamalId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { kamalId, statut: "EN_ATTENTE", user: { actif: true }, kamal: { statut: "EN_COURS", archivedAt: null } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const results = await Promise.all(assignments.map((assignment) => sendOnce(assignment.userId, `kamal:${kamalId}`, {
    title: "Rappel du Kammil mensuel",
    body: "Le nouveau cycle est lancé. Pense à effectuer tes deux lectures et à les confirmer.",
    url: "/rappel",
  })));
  return results.filter(Boolean).length;
}

async function notifyAdmin(userId: string, monthKey: string) {
  return sendOnce(userId, `admin:${monthKey}`, {
    title: "Rappel mensuel du Kammil",
    body: "Pense à préparer et suivre le cycle de lecture de ce mois.",
    url: "/admin/dashboard",
  });
}

export async function notifyAfterOptIn(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return 0;
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  if (user.role === "ADMIN") return Number(await notifyAdmin(userId, monthKey));

  const kamal = await prisma.kamal.findFirst({
    where: { statut: "EN_COURS", archivedAt: null, assignments: { some: { userId, statut: "EN_ATTENTE" } } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!kamal) return 0;
  return Number(await sendOnce(userId, `kamal:${kamal.id}`, {
    title: "Rappel du Kammil mensuel",
    body: "Le nouveau cycle est lancé. Pense à effectuer tes deux lectures et à les confirmer.",
    url: "/rappel",
  }));
}

export async function sendMonthlyReminders(now = new Date()) {
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const currentKamal = await prisma.kamal.findFirst({
    where: { statut: "EN_COURS", archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", actif: true }, select: { id: true } });
  const adminResults = await Promise.all(admins.map((admin) => notifyAdmin(admin.id, monthKey)));
  const memberSent = currentKamal ? await notifyKamalMembers(currentKamal.id) : 0;
  const sent = adminResults.filter(Boolean).length + memberSent;
  return { monthKey, sent, configured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) };
}
