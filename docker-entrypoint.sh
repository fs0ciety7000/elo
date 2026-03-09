#!/bin/sh
# ============================================================
# Entrypoint Docker — Antigravity Medical SaaS
# Exécuté à chaque démarrage du conteneur :
#   1. Migrations Prisma (idempotent)
#   2. Seed initial si la base est vide
#   3. Démarrage du serveur Next.js
# ============================================================

set -e

echo "🏥 Antigravity Medical — Démarrage..."

# ── 1. Migrations Prisma ─────────────────────────────────────
echo "📦 Application des migrations Prisma..."
npx prisma migrate deploy
echo "✅ Migrations OK"

# ── 2. Seed conditionnel (uniquement si la base est vide) ────
echo "🔍 Vérification de l'état de la base de données..."

USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => { console.log(count); prisma.\$disconnect(); })
  .catch(() => { console.log(0); process.exit(0); });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Base de données vide — lancement du seed initial..."
  npx tsx prisma/seed.ts
  echo "✅ Seed terminé"
else
  echo "ℹ️  Base déjà initialisée ($USER_COUNT utilisateurs) — seed ignoré"
fi

# ── 3. Démarrage de l'application ────────────────────────────
echo "🚀 Démarrage du serveur Next.js..."
exec node server.js
