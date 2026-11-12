import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Kasir from "@/app/components/Kasir";

async function KasirLoader() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, menus] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    prisma.menu.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <Kasir
      role={session.role}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      menus={menus.map((m) => ({
        id: m.id,
        categoryId: m.categoryId,
        name: m.name,
        price: m.price,
        available: m.available,
      }))}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-neutral-500">
          Memuat menu...
        </div>
      }
    >
      <KasirLoader />
    </Suspense>
  );
}