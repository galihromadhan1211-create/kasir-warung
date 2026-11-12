"use client";

import Link from "next/link";

export default function ReceiptActions({ waText }: { waText: string }) {
  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(waText)}`,
      "_blank",
      "noopener"
    );
  }

  return (
    <div className="mt-6 space-y-3 print:hidden">
      <button
        onClick={shareWhatsApp}
        className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white active:scale-95"
      >
        Bagikan ke WhatsApp
      </button>
      <button
        onClick={() => window.print()}
        className="w-full rounded-xl border border-neutral-300 bg-white py-4 text-lg font-semibold active:scale-95"
      >
        Cetak struk
      </button>
      <Link
        href="/"
        className="block w-full rounded-xl bg-orange-500 py-4 text-center text-lg font-bold text-white active:scale-95"
      >
        Kembali ke kasir
      </Link>
    </div>
  );
}