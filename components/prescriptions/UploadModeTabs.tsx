"use client";

import Link from "next/link";
import { ScanLine, PenLine } from "lucide-react";

export function UploadModeTabs({ active }: { active: "ocr" | "manual" }) {
  return (
    <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl mb-6">
      <Link
        href="/dashboard/upload"
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active === "ocr"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        <ScanLine className="w-4 h-4" />
        Numériser (OCR)
      </Link>
      <Link
        href="/dashboard/upload?mode=manual"
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active === "manual"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        <PenLine className="w-4 h-4" />
        Saisie manuelle
      </Link>
    </div>
  );
}
