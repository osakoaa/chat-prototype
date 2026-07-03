import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quory Chat Prototype",
  description: "アンケートセルフレビュー用AIコーチのチャットプロトタイプ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
