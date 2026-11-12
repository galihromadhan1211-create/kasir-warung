import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import MenuManager from "@/app/components/MenuManager";

async function Loader() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const [categories, menus] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    prisma.menu.findMany({
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      include: { category: true },
    }),
  ]);

  return (
    <MenuManager
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      menus={menus.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        available: m.available,
        categoryId: m.categoryId,
        categoryName: m.category.name,
      }))}
    />
  );
}

export default function KelolaMenuPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <Link href="/" className="rounded-lg bg-neutral-100 px-3 py-1 text-sm font-medium">
          ← Kasir
        </Link>
        <h1 className="text-lg font-bold">Kelola Menu</h1>
      </header>
      <Suspense
        fallback={<p className="p-10 text-center text-neutral-500">Memuat...</p>}
      >
        <Loader />
      </Suspense>
    </div>
  );
}