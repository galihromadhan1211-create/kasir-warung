import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import {
  WARUNG_NAME,
  WARUNG_ADDRESS,
  METHOD_LABEL,
  ORDER_LABEL,
} from "@/lib/config";
import ReceiptActions from "@/app/components/ReceiptActions";

async function Struk({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const trx = await prisma.transaction.findUnique({
    where: { code },
    include: { items: true, user: true },
  });
  if (!trx) notFound();

  const tanggal = trx.createdAt.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const metode = METHOD_LABEL[trx.paymentMethod] ?? trx.paymentMethod;
  const tipe = ORDER_LABEL[trx.orderType] ?? trx.orderType;

  // Teks untuk dibagikan lewat WhatsApp
  const waText = [
    `*${WARUNG_NAME}*`,
    tanggal,
    `No: ${trx.code}`,
    "------------------------",
    ...trx.items.map(
      (i) => `${i.qty}x ${i.menuName} - ${rupiah(i.subtotal)}`
    ),
    "------------------------",
    `Total: ${rupiah(trx.total)}`,
    `Bayar (${metode}): ${rupiah(trx.paid)}`,
    ...(trx.change > 0 ? [`Kembali: ${rupiah(trx.change)}`] : []),
    "",
    "Terima kasih sudah makan di sini!",
  ].join("\n");

  return (
    <div className="mx-auto max-w-sm p-4">
      <div className="rounded-xl bg-white p-5 shadow-sm print:shadow-none">
        <div className="text-center">
          <h1 className="text-xl font-bold">{WARUNG_NAME}</h1>
          <p className="text-sm text-neutral-500">{WARUNG_ADDRESS}</p>
        </div>

        <div className="my-3 border-t border-dashed border-neutral-400" />

        <div className="space-y-0.5 text-sm">
          <Line label="No" value={trx.code} />
          <Line label="Tanggal" value={tanggal} />
          <Line label="Kasir" value={trx.user.name} />
          <Line
            label="Tipe"
            value={trx.tableNo ? `${tipe} (Meja ${trx.tableNo})` : tipe}
          />
        </div>

        <div className="my-3 border-t border-dashed border-neutral-400" />

        <ul className="space-y-2 text-sm">
          {trx.items.map((i) => (
            <li key={i.id}>
              <div className="flex justify-between gap-2">
                <span>
                  {i.qty}x {i.menuName}
                </span>
                <span>{rupiah(i.subtotal)}</span>
              </div>
              {i.note && (
                <div className="text-xs text-neutral-500">Catatan: {i.note}</div>
              )}
            </li>
          ))}
        </ul>

        <div className="my-3 border-t border-dashed border-neutral-400" />

        <div className="space-y-0.5 text-sm">
          {trx.discount > 0 && (
            <Line label="Diskon" value={`- ${rupiah(trx.discount)}`} />
          )}
          <Line label="Total" value={rupiah(trx.total)} bold />
          <Line label={`Bayar (${metode})`} value={rupiah(trx.paid)} />
          {trx.change > 0 && <Line label="Kembali" value={rupiah(trx.change)} />}
        </div>

        <div className="my-3 border-t border-dashed border-neutral-400" />
        <p className="text-center text-sm">Terima kasih sudah makan di sini!</p>
      </div>

      <ReceiptActions waText={waText} />
    </div>
  );
}

function Line({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-2 ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default function StrukPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Suspense
        fallback={
          <p className="p-10 text-center text-neutral-500">Memuat struk...</p>
        }
      >
        <Struk params={params} />
      </Suspense>
    </div>
  );
}