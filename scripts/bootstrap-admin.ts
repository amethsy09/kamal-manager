import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const phone = process.env.ADMIN_PHONE || "785234420";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  console.log("");
  console.log("👤 Configuration du compte administrateur...");
  console.log(`📱 Téléphone : ${phone}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { telephone: phone },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        actif: true,
        passwordHash,
      },
    });

    console.log("✅ Compte administrateur existant mis à jour.");
    return;
  }

  await prisma.user.create({
    data: {
      nom: "Administrateur",
      prenom: "Kamal",
      telephone: phone,
      passwordHash,
      role: "ADMIN",
      actif: true,
    },
  });

  console.log("✅ Compte administrateur créé.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Erreur lors de la création de l'administrateur :");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
