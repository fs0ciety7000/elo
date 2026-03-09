// ============================================================
// Landing Page — Antigravity Medical SaaS
// Page publique présentant la plateforme
// ============================================================

import Link from "next/link";
import Image from "next/image";
import {
  ScanLine,
  FileCheck,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Stethoscope,
  Users,
} from "lucide-react";

// ── Composant principal ──────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Antigravity" width={32} height={32} className="rounded-lg" />
            <span className="font-display font-bold text-lg text-zinc-900">
              Antigravity
              <span className="text-medical-600"> Medical</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 transition-colors"
            >
              Commencer →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Fond décoratif */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-medical-50 to-transparent rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-medical-50 text-medical-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-medical-100">
            <ShieldCheck className="w-4 h-4" />
            Conforme RGPD — Données hébergées en Europe
          </div>

          {/* Titre */}
          <h1 className="font-display text-5xl md:text-6xl font-bold text-zinc-900 leading-tight mb-6 text-balance">
            La prescription médicale{" "}
            <span className="text-medical-600">réinventée</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Digitalisez vos ordonnances en quelques secondes grâce à notre
            technologie OCR. Fini les pertes de documents et les erreurs
            d&apos;interprétation manuscrite.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-medical-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-medical-700 transition-all hover:shadow-lg hover:shadow-medical-200 group"
            >
              Créer un compte gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-200 transition-all"
            >
              <Stethoscope className="w-5 h-5" />
              Espace professionnel
            </Link>
          </div>
        </div>
      </section>

      {/* ── Statistiques ── */}
      <section className="py-12 border-y border-zinc-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "99.2%", label: "Précision OCR" },
              { value: "< 3s", label: "Temps de traitement" },
              { value: "RGPD", label: "Conformité légale" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl font-bold text-medical-700">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-zinc-900 mb-4">
              Deux workflows, une seule plateforme
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Adaptée aux patients comme aux professionnels de santé
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte Patient */}
            <div className="bg-gradient-to-br from-medical-50 to-blue-50 rounded-2xl p-8 border border-medical-100">
              <div className="w-12 h-12 bg-medical-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-zinc-900 mb-3">
                Espace Patient
              </h3>
              <p className="text-zinc-600 mb-6">
                Photographiez votre ordonnance manuscrite et laissez notre IA
                extraire automatiquement les informations médicales.
              </p>
              <ul className="space-y-3">
                {[
                  "Upload photo de l'ordonnance",
                  "Extraction OCR automatique",
                  "Vérification & correction",
                  "QR Code pour le jour J",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-medical-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Carte Médecin */}
            <div className="bg-gradient-to-br from-zinc-50 to-slate-50 rounded-2xl p-8 border border-zinc-200">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-zinc-900 mb-3">
                Espace Médical
              </h3>
              <p className="text-zinc-600 mb-6">
                Encodez directement les prescriptions de vos patients via un
                formulaire structuré. La prescription apparaît instantanément
                dans leur dossier.
              </p>
              <ul className="space-y-3">
                {[
                  "Formulaire d'encodage rapide",
                  "Autocomplétion des examens",
                  "Attribution directe au patient",
                  "Suivi des statuts en temps réel",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-16 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ScanLine,
                title: "OCR de précision",
                description:
                  "Google Cloud Vision analyse les écritures manuscrites avec une précision médicale.",
              },
              {
                icon: QrCode,
                title: "QR Code unique",
                description:
                  "Chaque prescription génère un QR Code sécurisé présentable à l'examen.",
              },
              {
                icon: FileCheck,
                title: "Traçabilité totale",
                description:
                  "Journal d'audit complet conforme aux exigences RGPD et médicales.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-zinc-200 hover:border-medical-200 hover:shadow-md transition-all"
              >
                <feature.icon className="w-8 h-8 text-medical-600 mb-4" />
                <h3 className="font-semibold text-zinc-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-medical-700 to-medical-500 rounded-3xl p-12 text-white">
            <h2 className="font-display text-3xl font-bold mb-4">
              Prêt à digitaliser vos prescriptions ?
            </h2>
            <p className="text-medical-100 mb-8 text-lg">
              Rejoignez la plateforme qui modernise la gestion des examens
              radiologiques.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-medical-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-medical-50 transition-all"
            >
              Démarrer maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Image src="/logo.svg" alt="Antigravity" width={16} height={16} />
            <span>© 2024 Antigravity Medical SaaS — Travail de Fin d&apos;Études</span>
          </div>
          <div className="text-xs text-zinc-400">
            Données hébergées en Europe · Conforme RGPD · Application médicale sécurisée
          </div>
        </div>
      </footer>
    </div>
  );
}
