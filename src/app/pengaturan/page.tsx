import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ChangePasswordForm from "@/app/components/ChangePasswordForm";
import UserManager from "@/app/components/UserManager";

async function Loader() {
  const session = await getSession();
  if (!session) redirect("/login");

  const users =
    session.role === "ADMIN"
      ? await prisma.user.findMany({ orderBy: { id: "asc" } })
      : [];

  return (
    <div className="space-y-6 p-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">Ganti password</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Masuk sebagai {session.name}
        </p>
        <ChangePasswordForm />
      </section>

      {session.role === "ADMIN" && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Akun pengguna</h2>
          <UserManager
            users={users.map((u) => ({
              id: u.id,
              name: u.name,
              username: u.username,
              role: u.role === "ADMIN" ? "ADMIN" : "KASIR",
              isSelf: u.id === session.userId,
            }))}
          />
        </section>
      )}
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/"
          className="rounded-lg bg-neutral-100 px-3 py-1 text-sm font-medium"
        >
          ← Kasir
        </Link>
        <h1 className="text-lg font-bold">Pengaturan Akun</h1>
      </header>
      <Suspense
        fallback={<p className="p-10 text-center text-neutral-500">Memuat...</p>}
      >
        <Loader />
      </Suspense>
    </div>
  );
}