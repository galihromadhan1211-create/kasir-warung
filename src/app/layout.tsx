import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/app/components/RegisterSW";

export const metadata: Metadata = {
  title: "Kasir Warung",
  description: "Aplikasi kasir untuk warung makanan",
  applicationName: "Kasir Warung",
  appleWebApp: {
    capable: true,
    title: "Kasir Warung",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}