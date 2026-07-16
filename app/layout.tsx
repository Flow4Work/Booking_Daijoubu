import type { Metadata } from "next";
import "./globals.css";
import "./booking-polish.css";

export const metadata: Metadata = {
  title: "韓国のお店予約を日本語で | Booking Daijoubu",
  description: "韓国のレストラン、カフェ、美容室の空席を日本語で無料確認。予約可能な場合のみ、名義と先払い方法をご案内します。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
