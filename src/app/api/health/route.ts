import { NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";

// SEMENTARA: hanya untuk mencari penyebab login gagal setelah deploy.
// Tidak menampilkan nilai rahasia apa pun. HAPUS file ini setelah masalah selesai.
export async function GET() {
  await connection(); // paksa dijalankan saat diakses, bukan saat build

  const secret = process.env.SESSION_SECRET;
  const result = {
    sessionSecretSet: Boolean(secret),
    sessionSecretLongEnough: (secret?.length ?? 0) >= 32,
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
    directUrlSet: Boolean(process.env.DIRECT_URL),
    database: "belum dicek",
    jumlahAkun: -1,
  };

  try {
    result.jumlahAkun = await prisma.user.count();
    result.database = "ok";
  } catch (e) {
    result.database = "gagal (" + (e instanceof Error ? e.name : "unknown") + ")";
  }

  return NextResponse.json(result);
}