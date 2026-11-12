"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { rupiah } from "@/lib/format";
import  NavLinks  from "@/app/components/NavLinks";

type Category = { id: number; name: string };
type Menu = {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  available: boolean;
};
type Result = { code: string; total: number; change: number; method: string };
type Method = "CASH" | "QRIS" | "TRANSFER";
type OrderType = "DINE_IN" | "TAKEAWAY";

const QUICK_CASH = [20000, 50000, 100000];
const METHOD_LABEL: Record<Method, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
};

export default function Kasir({
  role,
  categories,
  menus,
}: {
  role: "ADMIN" | "KASIR";
  categories: Category[];
  menus: Menu[];
}) {
  const { items, add, inc, dec, setNote, clear } = useCart();

  const [cat, setCat] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [tableNo, setTableNo] = useState("");
  const [method, setMethod] = useState<Method>("CASH");
  const [paid, setPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const filtered = useMemo(
    () =>
      menus.filter(
        (m) =>
          (cat === null || m.categoryId === cat) &&
          m.name.toLowerCase().includes(query.toLowerCase())
      ),
    [menus, cat, query]
  );

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const change = method === "CASH" ? paid - total : 0;
  const canPay =
    items.length > 0 && (method !== "CASH" || paid >= total) && !loading;

  const qtyOf = (id: number) => items.find((i) => i.menuId === id)?.qty ?? 0;

  async function pay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            menuId: i.menuId,
            qty: i.qty,
            note: i.note,
          })),
          orderType,
          tableNo: orderType === "DINE_IN" ? tableNo : "",
          paymentMethod: method,
          paid: method === "CASH" ? paid : total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan transaksi");
      setResult({ code: data.code, total: data.total, change: data.change, method });
      clear();
      setPaid(0);
      setTableNo("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function newTransaction() {
    setResult(null);
    setOpen(false);
    setMethod("CASH");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 pt-3">
         <div className="flex items-center justify-between">
           <h1 className="text-lg font-bold">Kasir Warung</h1>
          <NavLinks role={role} />
         </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu..."
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          <Tab active={cat === null} onClick={() => setCat(null)}>
            Semua
          </Tab>
          {categories.map((c) => (
            <Tab key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name}
            </Tab>
          ))}
        </div>
      </header>

      {/* Grid menu */}
      <main className="grid grid-cols-2 gap-3 p-4 pb-28">
        {filtered.map((m) => {
          const q = qtyOf(m.id);
          return (
            <button
              key={m.id}
              disabled={!m.available}
              onClick={() => add(m)}
              className={`relative rounded-xl border bg-white p-3 text-left shadow-sm active:scale-95 ${
                m.available ? "border-neutral-200" : "opacity-50"
              }`}
            >
              {q > 0 && (
                <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">
                  {q}
                </span>
              )}
              <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-neutral-100 text-3xl">
                🍽️
              </div>
              <div className="font-medium leading-tight">{m.name}</div>
              <div className="mt-1 text-sm text-neutral-600">
                {m.available ? rupiah(m.price) : "Habis"}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 py-10 text-center text-neutral-500">
            Menu tidak ditemukan
          </p>
        )}
      </main>

      {/* Tombol keranjang melayang */}
      {count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-4">
          <button
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-orange-500 px-4 py-4 text-white shadow-lg active:scale-95"
          >
            <span className="font-semibold">🛒 {count} item</span>
            <span className="font-bold">{rupiah(total)} ▲</span>
          </button>
        </div>
      )}

      {/* Bottom sheet keranjang */}
      {open && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Pesanan</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 text-neutral-600"
              >
                Tutup ✕
              </button>
            </div>

            {items.length === 0 ? (
              <p className="py-6 text-center text-neutral-500">Keranjang kosong</p>
            ) : (
              <>
                {/* Daftar item */}
                <ul className="space-y-3">
                  {items.map((i) => (
                    <li key={i.menuId} className="border-b border-neutral-100 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{i.name}</div>
                          <div className="text-sm text-neutral-500">
                            {rupiah(i.price)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <RoundBtn onClick={() => dec(i.menuId)}>−</RoundBtn>
                          <span className="w-6 text-center font-semibold">{i.qty}</span>
                          <RoundBtn onClick={() => inc(i.menuId)}>+</RoundBtn>
                        </div>
                      </div>
                      <input
                        value={i.note}
                        onChange={(e) => setNote(i.menuId, e.target.value)}
                        placeholder="Catatan (mis. tanpa pedas)"
                        className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </li>
                  ))}
                </ul>

                {/* Tipe pesanan */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Toggle
                    active={orderType === "DINE_IN"}
                    onClick={() => setOrderType("DINE_IN")}
                  >
                    Makan di tempat
                  </Toggle>
                  <Toggle
                    active={orderType === "TAKEAWAY"}
                    onClick={() => setOrderType("TAKEAWAY")}
                  >
                    Bungkus
                  </Toggle>
                </div>
                {orderType === "DINE_IN" && (
                  <input
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    placeholder="Nomor meja (opsional)"
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                )}

                {/* Metode bayar */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(Object.keys(METHOD_LABEL) as Method[]).map((m) => (
                    <Toggle key={m} active={method === m} onClick={() => setMethod(m)}>
                      {METHOD_LABEL[m]}
                    </Toggle>
                  ))}
                </div>

                {method === "CASH" && (
                  <div className="mt-3">
                    <input
                      inputMode="numeric"
                      value={paid === 0 ? "" : String(paid)}
                      onChange={(e) =>
                        setPaid(Number(e.target.value.replace(/\D/g, "")) || 0)
                      }
                      placeholder="Uang diterima"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-lg"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Chip onClick={() => setPaid(total)}>Uang pas</Chip>
                      {QUICK_CASH.map((n) => (
                        <Chip key={n} onClick={() => setPaid(n)}>
                          {n / 1000}rb
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ringkasan */}
                <div className="mt-4 space-y-1 rounded-lg bg-neutral-50 p-3">
                  <Row label="Total" value={rupiah(total)} bold />
                  {method === "CASH" && paid > 0 && (
                    <Row
                      label={change >= 0 ? "Kembalian" : "Kurang"}
                      value={rupiah(Math.abs(change))}
                    />
                  )}
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <button
                  onClick={pay}
                  disabled={!canPay}
                  className="mt-4 w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white disabled:bg-neutral-300"
                >
                  {loading ? "Menyimpan..." : `Bayar ${rupiah(total)}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Layar sukses */}
      {result && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="text-6xl">✅</div>
          <h2 className="mt-3 text-2xl font-bold">Transaksi berhasil</h2>
          <p className="mt-1 text-neutral-500">{result.code}</p>
          <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl bg-neutral-50 p-4">
            <Row label="Total" value={rupiah(result.total)} bold />
            <Row label="Metode" value={METHOD_LABEL[result.method as Method]} />
            {result.method === "CASH" && (
              <Row label="Kembalian" value={rupiah(result.change)} bold />
            )}
          </div>
          <button
            onClick={newTransaction}
            className="mt-8 w-full max-w-xs rounded-xl bg-orange-500 py-4 text-lg font-bold text-white"
          >
            Transaksi baru
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Komponen kecil ---------- */

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
        active ? "bg-orange-500 text-white" : "bg-neutral-100 text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2 py-3 text-sm font-medium ${
        active
          ? "border-orange-500 bg-orange-50 text-orange-600"
          : "border-neutral-300 text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function RoundBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xl font-bold active:scale-90"
    >
      {children}
    </button>
  );
}

function Chip({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-neutral-300 px-4 py-2 text-sm active:bg-neutral-100"
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}