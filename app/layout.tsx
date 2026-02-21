import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PedeZap",
  description: "PedeZap - Pedidos por link e WhatsApp",
  icons: {
    icon: "/newfavicon.png",
    shortcut: "/newfavicon.png",
    apple: "/newfavicon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
