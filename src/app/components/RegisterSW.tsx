"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // hanya saat versi produksi
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // diabaikan: aplikasi tetap berjalan tanpa service worker
    });
  }, []);

  return null;
}