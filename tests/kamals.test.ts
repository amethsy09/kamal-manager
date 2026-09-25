import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { POST as confirmParticipant } from "../app/api/participant/[token]/confirm/route";
import { prisma } from "../lib/prisma";
import { archiveKamal, confirmJuzAsAdmin, reassignPendingJuz, restoreKamal } from "../lib/kamal-operations";
import { planJuzAssignments } from "../lib/kamal-assignments";
import { generateAccessToken } from "../lib/tokens";
import { participantMessage, smsRecipientUrl, whatsappRecipientUrl } from "../lib/whatsapp";

after(async () => {
  await prisma.$disconnect();
});

test("Juz distribution produces exactly 30 unique, round-robin assignments", () => {
  const members = [
    { id: "c", prenom: "Zara", nom: "Fall" },
    { id: "a", prenom: "Ali", nom: "Ba" },
    { id: "b", prenom: "Moussa", nom: "Diallo" },
  ];
  const assignments = planJuzAssignments("kamal-test", members, "alphabetique", () => "test-token");

  assert.equal(assignments.length, 30);
  assert.deepEqual(assignments.map((item) => item.juzNumber), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.deepEqual(assignments.slice(0, 3).map((item) => item.userId), ["a", "b", "c"]);
  assert.equal(new Set(assignments.map((item) => item.juzNumber)).size, 30);
  assert.throws(() => planJuzAssignments("kamal-test", [], "alphabetique"));
});

test("Kamal listing filters, admin and participant confirmation, and reassignment work end to end", async () => {
  const marker = randomUUID();
  const firstPhone = `+22177${Date.now().toString().slice(-7)}`;
  const secondPhone = `+22178${Date.now().toString().slice(-7)}`;
  const members = await Promise.all([
    prisma.user.create({ data: { prenom: "TestA", nom: marker.slice(0, 8), telephone: firstPhone, role: "MEMBER" } }),
    prisma.user.create({ data: { prenom: "TestB", nom: marker.slice(8, 16), telephone: secondPhone, role: "MEMBER" } }),
  ]);
  let kamalId: string | undefined;

  try {
    const kamal = await prisma.kamal.create({ data: { titre: `TEST ${marker}`, statut: "EN_COURS" } });
    kamalId = kamal.id;
    const drafts = planJuzAssignments(kamal.id, members, "alphabetique");
    await prisma.assignment.createMany({ data: drafts });
    const assignments = await prisma.assignment.findMany({ where: { kamalId: kamal.id }, orderBy: { juzNumber: "asc" } });

    const listed = await prisma.kamal.findMany({
      where: { statut: "EN_COURS", titre: { contains: marker, mode: "insensitive" } },
      include: { assignments: { where: { statut: { in: ["EN_ATTENTE", "CONFIRME"] } } } },
    });
    assert.equal(listed.length, 1, "status and title filters should find only the fixture Kamal");
    assert.equal(listed[0].assignments.length, 30, "new Kamal should contain all 30 active Juz");

    const adminFirstReading = await confirmJuzAsAdmin(assignments[0].id);
    const adminSecondReading = await confirmJuzAsAdmin(assignments[0].id);
    const adminRepeat = await confirmJuzAsAdmin(assignments[0].id);
    assert.equal(adminFirstReading.lectureCount, 1);
    assert.equal(adminFirstReading.completed, false, "the first reading should leave the Juz pending");
    assert.equal(adminSecondReading.lectureCount, 2);
    assert.equal(adminSecondReading.completed, true, "the second reading should complete the Juz");
    assert.equal(adminRepeat.count, 0, "confirmation after completion should be idempotent");
    const adminRow = await prisma.assignment.findUniqueOrThrow({ where: { id: assignments[0].id } });
    assert.equal(adminRow.lectureCount, 2);
    assert.equal(adminRow.confirmedBy, "ADMIN");
    assert.ok(adminRow.confirmedAt);

    const participantToken = drafts[1].tokenAcces;
    const participantContext = { params: Promise.resolve({ token: participantToken }) };
    const firstResponse = await confirmParticipant(new Request("http://localhost/api/participant/confirm", { method: "POST" }), participantContext);
    const secondResponse = await confirmParticipant(new Request("http://localhost/api/participant/confirm", { method: "POST" }), participantContext);
    const thirdResponse = await confirmParticipant(new Request("http://localhost/api/participant/confirm", { method: "POST" }), participantContext);
    assert.equal(firstResponse.status, 200);
    assert.deepEqual(await firstResponse.json(), { ok: true, lectureCount: 1, completed: false, alreadyCompleted: false });
    assert.equal(secondResponse.status, 200);
    assert.deepEqual(await secondResponse.json(), { ok: true, lectureCount: 2, completed: true, alreadyCompleted: false });
    assert.equal(thirdResponse.status, 200);
    assert.equal((await thirdResponse.json()).alreadyCompleted, true);
    const participantRow = await prisma.assignment.findUniqueOrThrow({ where: { id: assignments[1].id } });
    assert.equal(participantRow.lectureCount, 2);
    assert.equal(participantRow.confirmedBy, "MEMBER");

    const oldToken = drafts[2].tokenAcces;
    const previousOwner = assignments[2].userId;
    const newOwner = members.find((member) => member.id !== previousOwner)!;
    const reassigned = await reassignPendingJuz(assignments[2].id, newOwner.id);
    assert.deepEqual(reassigned, { ok: true, kamalId: kamal.id, juzNumber: 3 });
    const history = await prisma.assignment.findMany({ where: { kamalId: kamal.id, juzNumber: 3 }, orderBy: { createdAt: "asc" } });
    assert.equal(history.length, 2, "old assignment should remain in history beside the active assignment");
    assert.equal(history.filter((item) => item.statut === "EN_ATTENTE").length, 1, "only one assignment should remain active");
    assert.equal(history.find((item) => item.statut === "REASSIGNE")?.tokenAcces === oldToken, false, "old participant token should be rotated");
    const currentAssignment = history.find((item) => item.statut === "EN_ATTENTE");
    assert.ok(currentAssignment);
    assert.deepEqual(await reassignPendingJuz(currentAssignment.id, currentAssignment.userId), { ok: false, reason: "same-member" });

    const revokedResponse = await confirmParticipant(new Request("http://localhost/api/participant/confirm", { method: "POST" }), { params: Promise.resolve({ token: oldToken }) });
    assert.equal(revokedResponse.status, 404, "the old participant link should no longer resolve");

    const closedToken = drafts[3].tokenAcces;
    assert.deepEqual(await archiveKamal(kamal.id), { ok: false, reason: "not-terminal" }, "an in-progress Kamal cannot be archived");
    await prisma.kamal.update({ where: { id: kamal.id }, data: { statut: "TERMINE" } });
    const archiveResult = await archiveKamal(kamal.id);
    assert.deepEqual(archiveResult, { ok: true, reason: "archived" });
    assert.deepEqual(await archiveKamal(kamal.id), { ok: true, reason: "already-archived" }, "archive is idempotent");
    const archiveListing = await prisma.kamal.findMany({ where: { archivedAt: { not: null }, titre: { contains: marker } } });
    const activeListing = await prisma.kamal.findMany({ where: { archivedAt: null, titre: { contains: marker } } });
    assert.equal(archiveListing.length, 1);
    assert.equal(activeListing.length, 0, "archived cycles disappear from the active list");
    assert.equal(await restoreKamal(kamal.id), true);
    assert.equal(await prisma.kamal.count({ where: { id: kamal.id, archivedAt: null } }), 1, "restored cycle returns to active list");
    assert.equal(await restoreKamal(kamal.id), false, "restoration of an active cycle is rejected");
    const closedResponse = await confirmParticipant(new Request("http://localhost/api/participant/confirm", { method: "POST" }), { params: Promise.resolve({ token: closedToken }) });
    assert.equal(closedResponse.status, 410, "a closed Kamal must reject new confirmations");

    const message = participantMessage({ prenom: "Aminata", kamal: kamal.titre, juz: 3, url: "https://example.test/p/secure-token" });
    const whatsapp = whatsappRecipientUrl("77 123 45 67", message);
    const sms = smsRecipientUrl("+221 77 123 45 67", message);
    assert.ok(whatsapp?.startsWith("https://wa.me/221771234567?text="));
    assert.ok(sms?.startsWith("sms:+221771234567?body="));
    assert.ok(decodeURIComponent(whatsapp!.split("text=")[1]).includes("https://example.test/p/secure-token"));
    assert.equal(whatsappRecipientUrl("123", message), null);
  } finally {
    if (kamalId) await prisma.kamal.delete({ where: { id: kamalId } });
    await prisma.user.deleteMany({ where: { id: { in: members.map((member) => member.id) } } });
  }
});
