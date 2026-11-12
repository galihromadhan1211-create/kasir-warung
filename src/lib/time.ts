import { TIMEZONE, UTC_OFFSET_HOURS } from "@/lib/config";

// Server di internet biasanya memakai waktu UTC, bukan waktu warung.
// Semua hitungan "hari ini", "jam berapa", dan batas laporan memakai waktu warung
// (Indonesia tidak memakai jam musim panas, jadi selisih jamnya selalu tetap).

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Date yang field UTC-nya (getUTC...) sama dengan jam dinding di warung. */
export function wall(d: Date = new Date()): Date {
  return new Date(d.getTime() + UTC_OFFSET_HOURS * HOUR);
}

export function wallHour(d: Date): number {
  return wall(d).getUTCHours();
}

export function wallDay(d: Date): number {
  return wall(d).getUTCDate();
}

/** Waktu sebenarnya untuk pukul 00:00 waktu warung pada tanggal y-m-d (bulan 0-11). */
export function dayStart(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d) - UTC_OFFSET_HOURS * HOUR);
}

export function todayStart(): Date {
  const n = wall();
  return dayStart(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

/** Awal bulan ini (offset 0) atau bulan depan (offset 1), waktu warung. */
export function monthStart(offset = 0): Date {
  const n = wall();
  return dayStart(n.getUTCFullYear(), n.getUTCMonth() + offset, 1);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}

/** "2026-11-12" menurut waktu warung. */
export function dateStr(d: Date): string {
  return wall(d).toISOString().slice(0, 10);
}

/** Ubah "2026-11-12" menjadi pukul 00:00 waktu warung; null jika tidak valid. */
export function parseDateStr(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const result = dayStart(y, m - 1, d);
  return dateStr(result) === s ? result : null;
}

export function fmtDateTime(d: Date): string {
  return d.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE,
  });
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

export function fmtDate(d: Date, options: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString("id-ID", { ...options, timeZone: TIMEZONE });
}