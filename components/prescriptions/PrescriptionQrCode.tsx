// ============================================================
// Composant QR Code — Prescription numérique
// Génère et affiche le QR Code unique de la prescription
// ============================================================

"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";

interface PrescriptionQrCodeProps {
  prescriptionId: string;
  qrCode: string;
  examType: string;
}

export function PrescriptionQrCode({
  prescriptionId,
  qrCode,
  examType,
}: PrescriptionQrCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // URL encodée dans le QR Code (lien vers la prescription)
  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://elodie.fs0ciety.org"}/dashboard/prescriptions/${prescriptionId}`;

  // ── Téléchargement du QR Code en SVG ──────────────────
  function handleDownload() {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-prescription-${prescriptionId.slice(0, 8)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6 text-center">
      <div className="flex items-center gap-2 justify-center mb-4">
        <QrCode className="w-4 h-4 text-medical-600" />
        <h3 className="font-semibold text-zinc-900 text-sm">QR Code de l&apos;examen</h3>
      </div>

      {/* QR Code */}
      <div
        ref={qrRef}
        className="flex items-center justify-center p-4 bg-white rounded-xl border border-zinc-100 mb-3"
      >
        <QRCodeSVG
          value={qrValue}
          size={160}
          level="H"
          includeMargin={false}
          fgColor="#1e293b"
          bgColor="#ffffff"
        />
      </div>

      <p className="text-xs text-zinc-400 mb-1">{examType}</p>
      <p className="text-xs text-zinc-300 font-mono mb-4 truncate">
        {qrCode.slice(0, 20)}...
      </p>

      <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg p-2 mb-4">
        Présentez ce QR Code à l&apos;accueil du centre d&apos;imagerie
        le jour de votre examen.
      </p>

      {/* Bouton téléchargement */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 border border-zinc-200 text-zinc-600 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-all"
      >
        <Download className="w-4 h-4" />
        Télécharger (SVG)
      </button>
    </div>
  );
}
