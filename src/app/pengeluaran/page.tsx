import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rupiah } from "@/lib/format";
import ExpenseManager from "@/app/components/ExpenseManager";

type SearchParams = Promise<{ periode?: string }>;
type Periode = "hari" | "minggu" | "bulan";

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

function toDateStr(d: Date): string {
  return (
    String(d.getFullYear()) +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const sp = await searchParams;
  const periode: Periode =
    sp.periode === "hari" || sp.periode === "minggu" ? sp.periode : "bulan";

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

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const breakdown = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/pengeluaran?periode=${t.key}`}
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

      <p className="mt-3 text-sm text-neutral-500">Periode: {title}</p>

      <div className="mb-4 mt-2 rounded-xl bg-white p-4 shadow-sm">
        <div className="text-xs text-neutral-500">Total pengeluaran</div>
        <div className="text-2xl font-bold text-red-600">{rupiah(total)}</div>
        {breakdown.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
            {breakdown.map(([cat, sum]) => (
              <li key={cat} className="flex justify-between">
                <span className="text-neutral-600">{cat}</span>
                <span className="font-medium">{rupiah(sum)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ExpenseManager
        today={toDateStr(today)}
        expenses={expenses.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          amount: e.amount,
          dateLabel: e.date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }))}
      />
    </div>
  );
}

export default function PengeluaranPage({
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
        <h1 className="text-lg font-bold">Pengeluaran</h1>
      </header>
      <Suspense
        fallback={<p className="p-10 text-center text-neutral-500">Memuat...</p>}
      >
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}