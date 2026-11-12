"use client";

import { useState, useTransition } from "react";
import { deleteTransaction } from "@/app/actions/transactions";

export default function DeleteTransactionButton({ code }: { code: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onClick() {
    const ok = confirm(
      `Hapus transaksi ${code}?\n\nOmzet di laporan akan berkurang dan tindakan ini tidak bisa dibatalkan.`
    );
    if (!ok) return;
    setError("");
    startTransition(async () => {
      const r = await deleteTransaction(code);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <div className="mt-3 print:hidden">
      <button
        onClick={onClick}
        disabled={pending}
        className="w-full rounded-xl border border-red-300 py-3 font-semibold text-red-600 disabled:opacity-50"
      >
        {pending ? "Menghapus..." : "Hapus transaksi (admin)"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}