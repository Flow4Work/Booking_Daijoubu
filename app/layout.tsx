import type { Metadata } from "next";
import "./globals.css";
import "./tokanyaku.css";
import "./tokanyaku-refine.css";

export const metadata: Metadata = {
  title: "韓国のお店予約を日本語で | Tokanyaku",
  description:
    "韓国のレストラン、カフェ、美容室などを日本語で予約サポート。InstagramやNaver Mapで見つけたお店も、まず無料で空席確認できます。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
