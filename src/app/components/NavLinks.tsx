"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function NavLinks({ role }: { role: "ADMIN" | "KASIR" }) {
  const [open, setOpen] = useState(false);
  const item =
    "block w-full px-4 py-3 text-left text-sm font-medium active:bg-neutral-100";
  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu navigasi"
        className="rounded-lg bg-neutral-100 px-3 py-1 text-lg leading-none"
      >
        ☰
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/10">
            <Link href="/riwayat" className={item} onClick={close}>
              Riwayat
            </Link>
            {role === "ADMIN" && (
              <>
                <Link href="/laporan" className={item} onClick={close}>
                  Laporan
                </Link>
                <Link href="/pengeluaran" className={item} onClick={close}>
                  Pengeluaran
                </Link>
                <Link href="/kelola-menu" className={item} onClick={close}>
                  Kelola menu
                </Link>
              </>
            )}
            <Link href="/pengaturan" className={item} onClick={close}>
              Akun
            </Link>
            <form action={logout}>
              <button type="submit" className={`${item} text-red-600`}>
                Keluar
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}