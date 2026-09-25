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

- Téléphone : `785234420`
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

## Rappels push mensuels

Les rappels sont planifiés le 1er de chaque mois à 8 h (heure de Dakar). L’administrateur active les notifications depuis le tableau de bord. Chaque membre les active depuis son lien de participation ; les rappels aux membres sont aussi envoyés à la création d’un nouveau cycle.

Pour activer les notifications en production :

1. Définir `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` et `CRON_SECRET` dans les variables d’environnement de Vercel. Une paire de clés et un secret local ont été écrits dans `.env.local` (non versionné) ; recopier ces valeurs dans Vercel et remplacer le sujet par une adresse de contact `mailto:` ou une URL HTTPS. Si tu régénères la paire VAPID, remplace-la partout et redemande aux appareils de s’abonner.
3. Appliquer les migrations Prisma puis redéployer. Le job cron est déclaré dans `vercel.json` et Vercel l’exécute en UTC ; Dakar étant en UTC, l’horaire correspond à 8 h locale.
4. Ouvrir le site sur chaque téléphone, autoriser les notifications dans le navigateur et activer les rappels sur la page de suivi du participant. Sur iPhone, ajouter le site à l’écran d’accueil avant d’activer les notifications.

Les navigateurs doivent autoriser les notifications et le site doit être servi en HTTPS (localhost convient au développement). Les rappels restent génériques et n’incluent pas de lien privé de participant.
