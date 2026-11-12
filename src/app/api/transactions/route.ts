import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { dateStr, todayStart } from "@/lib/time";

type ItemInput = { menuId: number; qty: number; note?: string };
type Body = {
  items?: ItemInput[];
  orderType?: string;
  tableNo?: string;
  paymentMethod?: string;
  paid?: number;
};

const ORDER_TYPES = ["DINE_IN", "TAKEAWAY"];
const METHODS = ["CASH", "QRIS", "TRANSFER"];

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Data tidak valid");
  }

  const input = Array.isArray(body.items) ? body.items : [];
  if (input.length === 0) return fail("Keranjang kosong");

  const orderType = body.orderType ?? "DINE_IN";
  const method = body.paymentMethod ?? "CASH";
  if (!ORDER_TYPES.includes(orderType)) return fail("Tipe pesanan tidak valid");
  if (!METHODS.includes(method)) return fail("Metode bayar tidak valid");

  // Ambil harga dari database, jangan percaya harga dari browser
  const ids = input.map((i) => Number(i.menuId));
  const menus = await prisma.menu.findMany({ where: { id: { in: ids } } });
  const menuMap = new Map(menus.map((m) => [m.id, m]));

  const lines: {
    menuId: number;
    menuName: string;
    price: number;
    qty: number;
    note: string | null;
    subtotal: number;
  }[] = [];

  for (const i of input) {
    const menu = menuMap.get(Number(i.menuId));
    const qty = Number(i.qty);
    if (!menu) return fail("Ada menu yang tidak ditemukan");
    if (!menu.available) return fail(`${menu.name} sedang habis`);
    if (!Number.isInteger(qty) || qty < 1) return fail("Jumlah tidak valid");
    lines.push({
      menuId: menu.id,
      menuName: menu.name,
      price: menu.price,
      qty,
      note: i.note?.trim() ? i.note.trim() : null,
      subtotal: menu.price * qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const discount = 0; // fitur diskon menyusul
  const total = subtotal - discount;

  const paid = method === "CASH" ? Number(body.paid) : total;
  if (!Number.isFinite(paid) || paid < total) return fail("Uang yang dibayar kurang");
  const change = paid - total;

  const session = await getSession();
  if (!session) return fail("Sesi habis, silakan login lagi", 401);

  // Kode transaksi: TRX-YYYYMMDD-001, nomor urut per hari
  const ymd = dateStr(todayStart()).replace(/-/g, "");
  const prefix = `TRX-${ymd}-`;
  const todays = await prisma.transaction.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });
  const lastNo = todays.reduce(
    (max, t) => Math.max(max, Number(t.code.slice(prefix.length)) || 0),
    0
  );
  const code = `${prefix}${String(lastNo + 1).padStart(3, "0")}`;

  const trx = await prisma.transaction.create({
    data: {
      code,
      userId: session.userId,
      orderType,
      tableNo: orderType === "DINE_IN" && body.tableNo?.trim() ? body.tableNo.trim() : null,
      subtotal,
      discount,
      total,
      paymentMethod: method,
      paid,
      change,
      items: { create: lines },
    },
  });

  return NextResponse.json({ code: trx.code, total, change });
}