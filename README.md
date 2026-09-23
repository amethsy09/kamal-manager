# Kamal Manager

MVP mono-dahira : Next.js + TypeScript + Tailwind CSS + PostgreSQL + Prisma 7.

## Prérequis

- Node.js 22+
- Docker / Docker Compose

## Installation

```bash
npm install
cp .env.example .env
npm run db:generate
```

Démarrer PostgreSQL :

```bash
docker compose up -d
```

Créer les tables :

```bash
npx prisma migrate dev --name init
```

Créer les données de démonstration :

```bash
npm run db:seed
```

Lancer l'application :

```bash
npm run dev
```

Compte admin de démonstration :

- Téléphone : `+221770000000`
- Mot de passe : `ChangeMe123!`

**À changer immédiatement en environnement réel.**

## Routes

- `/login` : connexion responsable
- `/admin/dashboard` : dashboard
- `/admin/members` : membres
- `/admin/kamals` : Kamals
- `/admin/kamals/new` : création
- `/p/[token]` : espace participant

## Notes

La V1 utilise le partage WhatsApp via `wa.me` et ne nécessite pas l'API WhatsApp Business.
