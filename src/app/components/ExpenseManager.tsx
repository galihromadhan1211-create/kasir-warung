"use client";

import { useState, useTransition } from "react";
import { rupiah } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/config";
import { addExpense, deleteExpense } from "@/app/actions/expenses";

type ExpenseRow = {
  id: number;
  title: string;
  category: string;
  amount: number;
  dateLabel: string;
};

export default function ExpenseManager({
  expenses,
  today,
}: {
  expenses: ExpenseRow[];
  today: string; // YYYY-MM-DD
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");

  const input =
    "mb-3 mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base";

  function openForm() {
    setTitle("");
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount("");
    setDate(today);
    setError("");
    setOpen(true);
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const r = await addExpense({
        title,
        category,
        amount: Number(amount),
        date,
      });
      if (r.error) setError(r.error);
      else setOpen(false);
    });
  }

  function remove(e: ExpenseRow) {
    if (!confirm(`Hapus pengeluaran "${e.title}"?`)) return;
    startTransition(async () => {
      await deleteExpense(e.id);
    });
  }

  return (
    <div className={pending ? "opacity-70" : ""}>
      <ul className="space-y-3 pb-28">
        {expenses.map((e) => (
          <li key={e.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{e.title}</div>
                <div className="text-xs text-neutral-500">
                  {e.category} · {e.dateLabel}
                </div>
              </div>
              <div className="shrink-0 font-bold">{rupiah(e.amount)}</div>
            </div>
            <button
              onClick={() => remove(e)}
              className="mt-2 text-sm font-medium text-red-600"
            >
              Hapus
            </button>
          </li>
        ))}
        {expenses.length === 0 && (
          <p className="py-10 text-center text-neutral-500">
            Belum ada pengeluaran pada periode ini
          </p>
        )}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-20 p-4">
        <button
          onClick={openForm}
          className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg active:scale-95"
        >
          + Catat pengeluaran
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Catat pengeluaran</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 text-neutral-600"
              >
                Tutup ✕
              </button>
            </div>

            <label className="text-sm font-medium">Keterangan</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Beli ayam 5 kg"
              className={input}
            />

            <label className="text-sm font-medium">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${input} bg-white`}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium">Nominal (Rp)</label>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              className={input}
            />

            <label className="text-sm font-medium">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={input}
            />

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={pending}
              className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white disabled:bg-neutral-300"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}