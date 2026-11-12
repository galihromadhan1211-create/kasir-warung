import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rupiah } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/config";

type SearchParams = Promise<{ periode?: string }>;
type Periode = "hari" | "minggu" | "bulan";
type Point = { label: string; value: number };

const TABS: { key: Periode; label: string }[] = [
  { key: "hari", label: "Hari ini" },
  { key: "minggu", label: "7 hari" },
  { key: "bulan", label: "Bulan ini" },
];

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function Report({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const periode: Periode =
    sp.periode === "minggu" || sp.periode === "bulan" ? sp.periode : "hari";

  // Rentang waktu
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date;
  let title: string;
  if (periode === "hari") {
    start = today;
    end = addDays(today, 1);
    title = "Hari ini";
  } else if (periode === "minggu") {
    start = addDays(today, -6);
    end = addDays(today, 1);
    title = "7 hari terakhir";
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    title = start.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  const trxs = await prisma.transaction.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  // Ringkasan
  const omzet = trxs.reduce((s, t) => s + t.total, 0);
  const count = trxs.length;
  const avg = count > 0 ? Math.round(omzet / count) : 0;
  const itemsSold = trxs.reduce(
    (s, t) => s + t.items.reduce((a, i) => a + i.qty, 0),
    0
  );

  // Pengeluaran & laba pada periode yang sama
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
  });
  const pengeluaran = expenses.reduce((s, e) => s + e.amount, 0);
  const laba = omzet - pengeluaran;

  // Per metode bayar
  const methodMap = new Map<string, { count: number; total: number }>();
  for (const t of trxs) {
    const cur = methodMap.get(t.paymentMethod) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += t.total;
    methodMap.set(t.paymentMethod, cur);
  }

  // Menu terlaris
  const menuMap = new Map<string, { qty: number; revenue: number }>();
  for (const t of trxs) {
    for (const i of t.items) {
      const cur = menuMap.get(i.menuName) ?? { qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.subtotal;
      menuMap.set(i.menuName, cur);
    }
  }
  const top = [...menuMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxQty = top[0]?.qty ?? 1;

  // Data grafik
  const series: Point[] = [];
  if (periode === "hari") {
    const perHour: number[] = new Array(24).fill(0);
    for (const t of trxs) perHour[t.createdAt.getHours()] += t.total;
    const used = perHour.map((v, h) => (v > 0 ? h : -1)).filter((h) => h >= 0);
    if (used.length > 0) {
      for (let h = Math.min(...used); h <= Math.max(...used); h++) {
        series.push({ label: String(h).padStart(2, "0"), value: perHour[h] });
      }
    }
  } else {
    const perDay = new Map<string, number>();
    for (const t of trxs) {
      const k = dayKey(t.createdAt);
      perDay.set(k, (perDay.get(k) ?? 0) + t.total);
    }
    const last = addDays(today, 1);
    for (let d = new Date(start); d < last; d = addDays(d, 1)) {
      series.push({
        label:
          periode === "minggu"
            ? d.toLocaleDateString("id-ID", { weekday: "short" })
            : String(d.getDate()),
        value: perDay.get(dayKey(d)) ?? 0,
      });
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Pilihan periode */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/laporan?periode=${t.key}`}
            className={`rounded-lg py-2 text-center text-sm font-medium ${
              periode === t.key
                ? "bg-orange-500 text-white"
                : "bg-white text-neutral-700 shadow-sm"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <p className="text-sm text-neutral-500">Periode: {title}</p>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <Card label="Omzet" value={rupiah(omzet)} big />
        <Card label="Transaksi" value={String(count)} />
        <Card label="Rata-rata / transaksi" value={rupiah(avg)} />
        <Card label="Item terjual" value={String(itemsSold)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card label="Pengeluaran" value={rupiah(pengeluaran)} />
        <Card label="Laba (omzet - pengeluaran)" value={rupiah(laba)} big />
      </div>

      {/* Grafik */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">
          {periode === "hari" ? "Omzet per jam" : "Omzet per hari"}
        </h2>
        <BarChart data={series} />
      </section>

      {/* Menu terlaris */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Menu terlaris</h2>
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">
            Belum ada penjualan
          </p>
        ) : (
          <ol className="space-y-3">
            {top.map((m, idx) => (
              <li key={m.name}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {idx + 1}. {m.name}
                  </span>
                  <span className="shrink-0 text-neutral-600">
                    {m.qty} porsi · {rupiah(m.revenue)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-neutral-100">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${(m.qty / maxQty) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Metode pembayaran */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Metode pembayaran</h2>
        {methodMap.size === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">
            Belum ada penjualan
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {[...methodMap.entries()].map(([m, v]) => (
              <li key={m} className="flex justify-between">
                <span>
                  {METHOD_LABEL[m] ?? m}{" "}
                  <span className="text-neutral-400">({v.count}x)</span>
                </span>
                <span className="font-medium">{rupiah(v.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`font-bold ${big ? "text-xl text-orange-600" : "text-lg"}`}>
        {value}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (data.length === 0 || max === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Belum ada penjualan
      </p>
    );
  }
  const step = Math.ceil(data.length / 10);
  return (
    <div>
      <div className="flex h-36 items-end gap-0.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex h-full flex-1 items-end"
            title={`${d.label}: ${rupiah(d.value)}`}
          >
            <div
              className="w-full rounded-t bg-orange-500"
              style={{
                height: d.value > 0 ? `${Math.max((d.value / max) * 100, 3)}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-neutral-500"
          >
            {i % step === 0 ? d.label : ""}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-500">Tertinggi: {rupiah(max)}</p>
    </div>
  );
}

export default function LaporanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/"
          className="rounded-lg bg-neutral-100 px-3 py-1 text-sm font-medium"
        >
          ← Kasir
        </Link>
        <h1 className="text-lg font-bold">Laporan Penjualan</h1>
      </header>
      <Suspense
        fallback={<p className="p-10 text-center text-neutral-500">Memuat...</p>}
      >
        <Report searchParams={searchParams} />
      </Suspense>
    </div>
  );
}