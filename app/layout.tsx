import type { Metadata } from "next";
import "./globals.css";
import "./booking-polish.css";

export const metadata: Metadata = {
  title: "韓国のお店予約を日本語で | Booking Daijoubu",
  description: "韓国のレストラン、カフェ、美容室を日本語で予約リクエスト。店名と希望日時を送れば、韓国語で空席を確認します。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
