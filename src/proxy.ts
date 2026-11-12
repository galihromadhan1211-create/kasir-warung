import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/jwt";

// Halaman yang hanya boleh dibuka admin
const ADMIN_ONLY = ["/kelola-menu", "/laporan", "/pengeluaran"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await decrypt(req.cookies.get("session")?.value);

  // Belum login -> ke halaman login
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Sudah login tapi buka /login -> ke kasir
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // Halaman khusus admin
  if (
    ADMIN_ONLY.some((p) => pathname.startsWith(p)) &&
    session?.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

// API tidak lewat sini; API dijaga langsung di route handler-nya
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}