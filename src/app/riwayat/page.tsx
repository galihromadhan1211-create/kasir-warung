import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/config";

type SearchParams = Promise<{ tanggal?: string }>;

function toDateStr(d: Date): string {
  return (
    String(d.getFullYear()) +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

async function RiwayatList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  // Tanggal dari URL (?tanggal=2026-10-25); kalau tidak valid, pakai hari ini
  let start = new Date(`${sp.tanggal ?? ""}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sp.tanggal ?? "") || isNaN(start.getTime())) {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const tanggal = toDateStr(start);

  const trxs = await prisma.transaction.findMany({
    where: { createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const omzet = trxs.reduce((s, t) => s + t.total, 0);

  return (
    <>
      <form method="get" className="flex gap-2 p-4">
        <input
          type="date"
          name="tanggal"
          defaultValue={tanggal}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base"
        />
        <button
          type="submit"
          className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white"
        >
          Tampilkan
        </button>
      </form>

      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="text-xs text-neutral-500">Transaksi</div>
          <div className="text-xl font-bold">{trxs.length}</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="text-xs text-neutral-500">Omzet</div>
          <div className="text-xl font-bold">{rupiah(omzet)}</div>
        </div>
      </div>

      <ul className="space-y-3 p-4">
        {trxs.map((t) => {
          const ringkas = t.items.map((i) => `${i.qty}x ${i.menuName}`).join(", ");
          return (
            <li key={t.id}>
              <Link
                href={`/struk/${t.code}`}
                className="block rounded-xl bg-white p-3 shadow-sm active:scale-95"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.code}</span>
                  <span className="font-bold">{rupiah(t.total)}</span>
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {t.createdAt.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {METHOD_LABEL[t.paymentMethod] ?? t.paymentMethod}
                </div>
                <div className="mt-1 truncate text-sm text-neutral-600">
                  {ringkas}
                </div>
              </Link>
            </li>
          );
        })}
        {trxs.length === 0 && (
          <p className="py-10 text-center text-neutral-500">
            Belum ada transaksi pada tanggal ini
          </p>
        )}
      </ul>
    </>
  );
}

export default function RiwayatPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <Link href="/" className="rounded-lg bg-neutral-100 px-3 py-1 text-sm font-medium">
          ← Kasir
        </Link>
        <h1 className="text-lg font-bold">Riwayat Transaksi</h1>
      </header>

      <Suspense
        fallback={<p className="p-10 text-center text-neutral-500">Memuat...</p>}
      >
        <RiwayatList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}