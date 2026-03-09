# CLAUDE.md — Antigravity Medical SaaS

## Présentation du projet

Application médicale SaaS permettant la gestion de patients, ordonnances et prescriptions, avec OCR d'ordonnances manuscrites via Claude (Anthropic). Déployée sur **https://elodie.fs0ciety.org** via Coolify + Traefik.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript |
| UI | Tailwind CSS + Radix UI + shadcn/ui |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 15 |
| Auth | JWT custom (jose) + bcryptjs |
| OCR | Anthropic Claude (`@anthropic-ai/sdk`) |
| Mailing | Resend + React Email |
| QR Code | qrcode.react |
| Formulaires | react-hook-form + zod |
| Déploiement | Docker + Coolify + Traefik |

## Structure des fichiers

```
app/
├── api/
│   ├── auth/logout/          # Déconnexion (suppression cookie JWT)
│   ├── files/[filename]/     # Accès aux fichiers uploadés
│   ├── patients/
│   │   ├── check/            # Vérification existence patient
│   │   └── search/           # Recherche de patients
│   └── upload/               # Upload de fichiers (ordonnances)
├── dashboard/
│   ├── patients/             # Liste, nouveau, détail patient
│   ├── prescriptions/        # Liste, nouvelle, détail prescription
│   ├── profile/              # Profil utilisateur
│   └── upload/               # Upload d'ordonnance via OCR
├── login/                    # Page de connexion
├── register/                 # Page d'inscription
└── layout.tsx / globals.css

components/
├── layout/MobileNav.tsx
├── patients/
│   ├── AssignDoctorForm.tsx
│   ├── DoctorNotesForm.tsx
│   ├── NewPatientForm.tsx
│   └── PatientFileEditForm.tsx
└── prescriptions/
    ├── DeletePrescriptionButton.tsx
    ├── NewPrescriptionForm.tsx
    ├── OcrUploadForm.tsx
    ├── PatientManualForm.tsx
    ├── PrescriptionEditForm.tsx
    ├── PrescriptionQrCode.tsx
    ├── StatusUpdateForm.tsx
    └── UploadModeTabs.tsx

lib/
├── actions/
│   ├── auth.ts               # Server actions : login, register, logout
│   ├── ocr.ts                # OCR via Claude API (vision)
│   ├── patients.ts           # CRUD patients
│   └── prescriptions.ts      # CRUD prescriptions
├── auth.ts                   # Utilitaires JWT (session, cookies)
├── db.ts                     # Instance Prisma singleton
├── docx.ts                   # Génération de documents Word
├── email/send.ts             # Envoi d'emails via Resend
└── utils.ts                  # Helpers divers

prisma/
├── schema.prisma             # Schéma BDD
└── seed.ts                   # Données initiales
```

## Modèles de données (Prisma)

### User
- Rôles : `ADMIN`, `DOCTOR`, `PATIENT`
- Champs médicaux : `nationalId`, `birthDate`, `bloodType`, `allergies`, `medicalHistory`, `currentMeds`, `emergencyContact`
- Champs médecin : `speciality`, `inami`

### Prescription
- Statuts : `PENDING`, `SCHEDULED`, `COMPLETED`, `CANCELLED`
- Sources : `MANUAL` (saisie directe) ou `OCR` (scan ordonnance)
- Lié à un patient et optionnellement un médecin

### DoctorPatient
- Table de liaison médecin ↔ patient avec notes du médecin

### AuditLog
- Trace toutes les actions sensibles (RGPD)

## Variables d'environnement requises

```env
AUTH_URL=https://elodie.fs0ciety.org
AUTH_SECRET=<32 chars min>

ANTHROPIC_API_KEY=sk-ant-...        # Claude OCR

POSTGRES_USER=medical
POSTGRES_PASSWORD=...
POSTGRES_DB=medical_db
DATABASE_URL=postgresql://user:pass@postgres_db:5432/medical_db?schema=public

RESEND_API_KEY=re_...               # Emails transactionnels
RESEND_FROM_EMAIL=noreply@elodie.fs0ciety.org

SERVICE_FQDN_MEDICAL_APP=elodie.fs0ciety.org
```

## Commandes utiles

```bash
npm run dev              # Développement local
npm run build            # Build production
npm run db:migrate       # Appliquer les migrations Prisma
npm run db:generate      # Régénérer le client Prisma
npm run db:studio        # Interface Prisma Studio
npm run db:seed          # Seeder la BDD
npm run lint             # ESLint
```

## Déploiement (Docker + Coolify)

- `Dockerfile` : build multi-stage Next.js
- `docker-compose.yml` : services `app` + `postgres_db`
- `docker-entrypoint.sh` : exécute les migrations Prisma puis démarre Next.js
- Le réseau interne Docker permet à l'app de joindre la BDD via `postgres_db:5432`

## Authentification

- JWT stocké en cookie HTTP-only (`session`)
- Pas de NextAuth — auth custom avec `jose` pour signer/vérifier les tokens
- Middleware (`middleware.ts`) protège toutes les routes `/dashboard`
- Rôles vérifiés côté server actions

## OCR ordonnances

- Upload de l'image → stockage local → envoi à Claude via `lib/actions/ocr.ts`
- Claude extrait : type d'examen, patient, médecin, urgence, détails
- Résultat pré-remplit le formulaire de prescription

## Points d'attention

- Les fichiers uploadés sont stockés localement (pas de S3) — à adapter si multi-instance
- Pas de tests automatisés configurés
- Les migrations Prisma sont gérées via `prisma migrate deploy` (pas `dev`) en production

## Roadmap & Fonctionnalités à venir (Plan d'Action)

Le développement a été divisé en 3 phases pour apporter un maximum de valeur tout en sécurisant l'existant :

**Phase 1 - Les Fondations Sécurisées & UX rapide**
- **Tests Automatisés E2E (Playwright) :** Couverture des parcours critiques (Authentification, Gestion Patient, Prescription Manuelle & OCR simulé). Sécurise les futurs développements.
  - *[TODO POUR L'IA]* : Installer `playwright` (`npm init playwright@latest`), créer `playwright.config.ts`, et coder un test E2E `tests/login.spec.ts` et `tests/patient.spec.ts`.
- **Recherche Globale (Cmd+K) :** Navigation ultra-rapide pour chercher patients et prescriptions n'importe où dans l'application via un raccourci clavier.
  - *[TODO POUR L'IA]* : Ajouter `cmdk` via shadcn/ui (`npx shadcn-ui@latest add command`), créer `components/layout/CommandMenu.tsx` et une Route API `/api/search` faisant appel à Prisma.

**Phase 2 - L'Évolution du cœur de métier**
- **Modèles de Prescriptions (Templates) :** Nouveau modèle Prisma pour permettre au médecin de sauvegarder et appliquer en "1 clic" un set d'examens/médicaments habituels.
  - *[TODO POUR L'IA]* : Modifier `schema.prisma` avec le modèle `PrescriptionTemplate` lié à `User`, jouer `npx prisma db push`, puis créer un bouton "Sauvegarder comme modèle" sur `NewPrescriptionForm`.
- **e-Prescription (Signature Cryptographique) :** Sécurisation légale absolue de l'ordonnance PDF. Génération d'un hash SHA-256 (données document + médecin) vérifiable publiquement via la lecture du QR Code.
  - *[TODO POUR L'IA]* : Ajouter un champ `hash` dans le modèle `Prescription` Prisma, et utiliser l'API Web Crypto pour hasher le contenu lors de l'appel `/api/prescriptions/create`.

**Phase 3 - La Valeur Administrative & L'Écosystème**
- **Dashboard Analytique & Journal d'Audit :** 
  - *Journal d'Audit* pour les administrateurs (traçabilité RGPD via vue tableau dédiée).
  - *[TODO POUR L'IA]* : Exploiter la table `AuditLog` et créer `app/dashboard/audit/[page]/page.tsx` avec des DataTables shadcn complètes pour les Rôles ADMIN.
  - *Tableaux de bord cliniques* (KPIs, volume de prescriptions) à l'aide de graphiques `recharts`.
  - *[TODO POUR L'IA]* : Installer `recharts`, et remplacer les cartes génériques du `/dashboard` par des LineCharts (historique prescriptions) et PieCharts (statuts).
- **Interopérabilité Standard (Export HL7 / FHIR) :** Fonctionnalité d'export d'un dossier patient ou d'une prescription vers le format strict d'échange de santé mondial FHIR.
  - *[TODO POUR L'IA]* : Créer un objet DTO Type `FHIR` dans `lib/utils/fhir.ts` mappant les données Prisma (`Patient`, `Prescription`) vers le format standardisé, puis créer la Route API d'export JSON.
