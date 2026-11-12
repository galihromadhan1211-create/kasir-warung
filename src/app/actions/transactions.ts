"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Hanya admin. Pengecekan dilakukan di server, jadi kasir tidak bisa
// menjalankannya walau mencoba mengirim permintaan sendiri.
export async function deleteTransaction(
  code: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Hanya admin yang boleh menghapus transaksi" };
  }

  const trx = await prisma.transaction.findUnique({ where: { code } });
  if (!trx) return { error: "Transaksi tidak ditemukan" };

  // Rincian item ikut terhapus otomatis (onDelete: Cascade di skema)
  await prisma.transaction.delete({ where: { id: trx.id } });

  revalidatePath("/riwayat");
  revalidatePath("/laporan");
  redirect("/riwayat");
}