
#!/usr/bin/env bash

set -e

echo ""
echo "=============================================="
echo "       KAMAL MANAGER - INSTALLATION"
echo "=============================================="
echo ""

# ==================================================
# CONFIGURATION
# ==================================================

DB_CONTAINER="kamal-manager-postgres"
DB_NAME="kamal_manager"
DB_USER="kamal"
DB_PORT="5433"

ADMIN_PHONE="785234420"
ADMIN_PASSWORD="ChangeMe123!"

# ==================================================
# 1. Vérification Docker
# ==================================================

echo "🐳 Vérification de Docker..."

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker n'est pas installé."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker n'est pas démarré."
  echo "👉 Démarre Docker puis relance ce script."
  exit 1
fi

echo "✅ Docker OK"
echo ""

# ==================================================
# 2. Vérification du fichier .env
# ==================================================

echo "🔐 Vérification du fichier .env..."

if [ ! -f ".env" ]; then
  echo "❌ Fichier .env introuvable."
  exit 1
fi

if ! grep -q '^DATABASE_URL=' .env; then
  echo "❌ DATABASE_URL manque dans .env"
  exit 1
fi

echo "✅ .env OK"
echo ""

# ==================================================
# 3. Vérification du DATABASE_URL
# ==================================================

echo "🔎 Configuration de la base..."

DATABASE_URL_VALUE=$(grep '^DATABASE_URL=' .env | cut -d '=' -f2-)

if [ -z "$DATABASE_URL_VALUE" ]; then
  echo "❌ DATABASE_URL est vide."
  exit 1
fi

echo "✅ DATABASE_URL configuré"
echo ""

# ==================================================
# 4. Démarrage PostgreSQL
# ==================================================

echo "🐘 Démarrage de PostgreSQL..."

docker compose up -d postgres

echo "⏳ Attente de PostgreSQL..."

for i in {1..30}; do

  if docker compose exec -T postgres \
    pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1
  then
    echo "✅ PostgreSQL est prêt."
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "❌ PostgreSQL ne répond pas."
    echo ""
    echo "📋 Logs PostgreSQL :"
    docker compose logs --tail=100 postgres
    exit 1
  fi

  sleep 1

done

echo ""

# ==================================================
# 5. Installation des dépendances
# ==================================================

echo "📦 Vérification des dépendances Node.js..."

if [ ! -d "node_modules" ]; then
  npm install
else
  echo "✅ node_modules déjà présent."
fi

echo ""

# ==================================================
# 6. Installation de bcryptjs
# ==================================================

echo "🔐 Vérification de bcryptjs..."

if npm list bcryptjs >/dev/null 2>&1; then
  echo "✅ bcryptjs déjà installé."
else
  echo "📦 Installation de bcryptjs..."
  npm install bcryptjs
fi

echo ""

# ==================================================
# 7. Installation de tsx
# ==================================================

echo "⚙️ Vérification de tsx..."

if npm list tsx >/dev/null 2>&1; then
  echo "✅ tsx déjà installé."
else
  echo "📦 Installation de tsx..."
  npm install -D tsx
fi

echo ""

# ==================================================
# 8. Vérification du schema Prisma
# ==================================================

if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ prisma/schema.prisma introuvable."
  exit 1
fi

echo "✅ prisma/schema.prisma trouvé."
echo ""

# ==================================================
# 9. Génération Prisma Client
# ==================================================

echo "🔧 Génération de Prisma Client..."

npx prisma generate

echo "✅ Prisma Client généré."
echo ""

# ==================================================
# 10. Migration PostgreSQL
# ==================================================

echo "🗄️ Vérification des migrations..."

if [ ! -d "prisma/migrations" ] || \
   [ -z "$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null)" ]
then

  echo "🆕 Aucune migration trouvée."
  echo "Création de la migration initiale..."

  npx prisma migrate dev --name init

else

  echo "📋 Migrations existantes détectées."
  echo "Application des migrations..."

  npx prisma migrate dev

fi

echo ""

# ==================================================
# 11. Validation Prisma
# ==================================================

echo "🔍 Validation du schéma Prisma..."

npx prisma validate

echo "✅ Schéma Prisma valide."
echo ""

# ==================================================
# 12. Création du dossier scripts
# ==================================================

mkdir -p scripts

# ==================================================
# 13. Création du bootstrap administrateur
# ==================================================

echo "👤 Préparation du compte administrateur..."

cat > scripts/bootstrap-admin.ts <<'EOF'
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const phone = process.env.ADMIN_PHONE || "785234420";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  console.log("");
  console.log("👤 Configuration du compte administrateur...");
  console.log(`📱 Téléphone : ${phone}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: {
      telephone: phone,
    },
  });

  if (existing) {
    await prisma.user.update({
      where: {
        id: existing.id,
      },
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
EOF

echo "✅ Script bootstrap-admin.ts créé."
echo ""

# ==================================================
# 14. Création / mise à jour de l'administrateur
# ==================================================

echo "👤 Création / mise à jour de l'administrateur..."

ADMIN_PHONE="$ADMIN_PHONE" \
ADMIN_PASSWORD="$ADMIN_PASSWORD" \
npx tsx scripts/bootstrap-admin.ts

echo ""

# ==================================================
# 15. Vérification PostgreSQL
# ==================================================

echo "🔎 Vérification des tables PostgreSQL..."

docker compose exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME" \
  -c '\dt'

echo ""

# ==================================================
# 16. Vérification de l'administrateur
# ==================================================

echo "🔎 Vérification du compte administrateur..."

docker compose exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME" \
  -c 'SELECT id, nom, prenom, telephone, role, actif FROM "User" WHERE role = '\''ADMIN'\'';'

echo ""

# ==================================================
# 17. Résumé
# ==================================================

echo "=============================================="
echo "       ✅ INSTALLATION TERMINÉE"
echo "=============================================="
echo ""

echo "🐘 PostgreSQL"
echo "  Host       : localhost"
echo "  Port       : $DB_PORT"
echo "  Database   : $DB_NAME"
echo "  User       : $DB_USER"
echo ""

echo "👤 ADMINISTRATEUR"
echo "  Téléphone  : $ADMIN_PHONE"
echo "  Mot de passe : $ADMIN_PASSWORD"
echo ""

echo "📦 Prisma"
echo "  Client     : OK"
echo "  Migration  : OK"
echo "  Validation : OK"
echo ""

echo "🌱 Seed"
echo "  Utilisé    : NON"
echo ""

echo "=============================================="
echo "COMMANDES UTILES"
echo "=============================================="
echo ""

echo "Lancer l'application :"
echo "  npm run dev"
echo ""

echo "Ouvrir Prisma Studio :"
echo "  npx prisma studio"
echo ""

echo "Voir PostgreSQL :"
echo "  docker compose ps"
echo ""

echo "Voir les logs PostgreSQL :"
echo "  docker compose logs -f postgres"
echo ""

echo "=============================================="

