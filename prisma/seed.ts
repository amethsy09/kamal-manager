import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: { telephone: "+221770000000" },
    update: { passwordHash, role: "ADMIN", actif: true },
    create: {
      prenom: "Responsable",
      nom: "Kamal",
      telephone: "+221770000000",
      passwordHash,
      role: "ADMIN",
    },
  });

  const members = [
    ["Abdou", "Diop", "+221770000001"],
    ["Awa", "Ndiaye", "+221770000002"],
    ["Moussa", "Fall", "+221770000003"],
    ["Fatou", "Sow", "+221770000004"],
    ["Alioune", "Ba", "+221770000005"],
  ];

  for (const [prenom, nom, telephone] of members) {
    await prisma.user.upsert({
      where: { telephone },
      update: { prenom, nom, actif: true },
      create: { prenom, nom, telephone, role: "MEMBER" },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
