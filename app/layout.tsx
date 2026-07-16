import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "韓国の予約代行 | Booking Daijoubu",
  description: "韓国のレストランや美容室へ日本語で予約を依頼できます。空席確認後にPayPalまたはカードで支払います。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
