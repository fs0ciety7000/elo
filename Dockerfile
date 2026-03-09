# ============================================================
# Dockerfile multi-stage optimisé pour Next.js 14 sur Coolify
# ============================================================

# ── Étape 1 : Installation des dépendances ──────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Installation sans scripts lifecycle (postinstall géré manuellement plus bas)
RUN npm install --ignore-scripts --no-audit --legacy-peer-deps

# ── Étape 2 : Build de l'application ───────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génère le client Prisma pour la production
RUN npx prisma generate

# Build Next.js en mode production standalone
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# ── Étape 3 : Image de production ──────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crée un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie les fichiers de build standalone Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copie Prisma (schéma + seed + client généré)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copie node_modules complet depuis le builder
# Nécessaire pour : prisma migrate, tsx (seed), bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copie et rend exécutable le script d'entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# L'entrypoint gère : migrations → seed conditionnel → démarrage
ENTRYPOINT ["./docker-entrypoint.sh"]
