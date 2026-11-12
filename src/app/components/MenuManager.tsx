"use client";

import { useState, useTransition } from "react";
import { rupiah } from "@/lib/format";
import {
  saveMenu,
  toggleAvailable,
  deleteMenu,
  addCategory,
} from "@/app/actions/menu";

type Category = { id: number; name: string };
type MenuRow = {
  id: number;
  name: string;
  price: number;
  available: boolean;
  categoryId: number;
  categoryName: string;
};

export default function MenuManager({
  categories,
  menus,
}: {
  categories: Category[];
  menus: MenuRow[];
}) {
  const [pending, startTransition] = useTransition();

  const [sheet, setSheet] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 0);
  const [error, setError] = useState("");

  const [newCat, setNewCat] = useState("");
  const [catError, setCatError] = useState("");

  function openNew() {
    setEditId(null);
    setName("");
    setPrice("");
    setCategoryId(categories[0]?.id ?? 0);
    setError("");
    setSheet(true);
  }

  function openEdit(m: MenuRow) {
    setEditId(m.id);
    setName(m.name);
    setPrice(String(m.price));
    setCategoryId(m.categoryId);
    setError("");
    setSheet(true);
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const r = await saveMenu({
        id: editId ?? undefined,
        name,
        price: Number(price),
        categoryId,
      });
      if (r.error) setError(r.error);
      else setSheet(false);
    });
  }

  function remove(m: MenuRow) {
    if (!confirm(`Hapus "${m.name}"? Riwayat transaksi lama tetap aman.`)) return;
    startTransition(async () => {
      await deleteMenu(m.id);
    });
  }

  function submitCategory() {
    setCatError("");
    startTransition(async () => {
      const r = await addCategory(newCat);
      if (r.error) setCatError(r.error);
      else setNewCat("");
    });
  }

  return (
    <div className={pending ? "opacity-70" : ""}>
      {/* Tambah kategori */}
      <div className="p-4 pb-0">
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Kategori baru (mis. Snack)"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2"
          />
          <button
            onClick={submitCategory}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Tambah
          </button>
        </div>
        {catError && <p className="mt-1 text-sm text-red-600">{catError}</p>}
      </div>

      {/* Daftar menu */}
      <ul className="space-y-3 p-4 pb-28">
        {menus.map((m) => (
          <li key={m.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-neutral-500">
                  {m.categoryName} · {rupiah(m.price)}
                </div>
              </div>
              <button
                onClick={() => startTransition(async () => { await toggleAvailable(m.id); })}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  m.available
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {m.available ? "Tersedia" : "Habis"}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => openEdit(m)}
                className="flex-1 rounded-lg border border-neutral-300 py-2 text-sm font-medium"
              >
                Ubah
              </button>
              <button
                onClick={() => remove(m)}
                className="flex-1 rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600"
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
        {menus.length === 0 && (
          <p className="py-10 text-center text-neutral-500">Belum ada menu</p>
        )}
      </ul>

      {/* Tombol tambah menu */}
      <div className="fixed inset-x-0 bottom-0 z-20 p-4">
        <button
          onClick={openNew}
          className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg active:scale-95"
        >
          + Tambah menu
        </button>
      </div>

      {/* Form tambah / ubah */}
      {sheet && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editId ? "Ubah menu" : "Tambah menu"}
              </h2>
              <button
                onClick={() => setSheet(false)}
                className="rounded-lg px-3 py-1 text-neutral-600"
              >
                Tutup ✕
              </button>
            </div>

            <label className="text-sm font-medium">Nama menu</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
            />

            <label className="text-sm font-medium">Harga (Rp)</label>
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              className="mb-3 mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
            />

            <label className="text-sm font-medium">Kategori</label>
            {categories.length === 0 ? (
              <p className="mb-3 mt-1 text-sm text-red-600">
                Tambahkan kategori dulu di bagian atas halaman.
              </p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="mb-3 mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-base"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={pending || categories.length === 0}
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