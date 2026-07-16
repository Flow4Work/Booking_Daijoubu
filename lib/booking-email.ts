type Language = "ja" | "en";
type Category = "restaurant" | "hair" | "nail" | "beauty";

type BookingReceiptInput = {
  requestCode: string;
  language: Language;
  category: Category;
  placeName: string;
  placeAddress: string | null;
  placeUrl: string | null;
  preferredDate: string;
  preferredTime: string;
  partySize: number;
  requestDetails: string | null;
  customerEmail: string;
};

const CATEGORY_LABELS: Record<Language, Record<Category, string>> = {
  ja: {
    restaurant: "飲食店・カフェ",
    hair: "ヘアサロン",
    nail: "ネイルサロン",
    beauty: "その他のご相談",
  },
  en: {
    restaurant: "Restaurant or café",
    hair: "Hair salon",
    nail: "Nail salon",
    beauty: "Other request",
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeLink(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatDateTime(date: string, time: string, language: Language) {
  const instant = new Date(`${date}T${time}:00+09:00`);
  if (language === "ja") {
    const dateText = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(instant);
    return `${dateText} ${time}（韓国時間）`;
  }

  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  }).format(instant);
  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
  return `${dateText}, ${timeText} KST`;
}

function detailRows(input: BookingReceiptInput) {
  const language = input.language;
  const labels = language === "ja"
    ? {
        code: "受付番号",
        category: "予約の種類",
        place: "店舗名",
        address: "住所",
        link: "店舗URL",
        date: "希望日時",
        guests: "人数",
        notes: "ご希望・注意事項",
        none: "なし",
        people: "名",
      }
    : {
        code: "Request code",
        category: "Booking type",
        place: "Venue",
        address: "Address",
        link: "Venue link",
        date: "Preferred date and time",
        guests: "Guests",
        notes: "Requests and notes",
        none: "None",
        people: "",
      };

  const link = safeLink(input.placeUrl);
  const rows = [
    [labels.code, input.requestCode],
    [labels.category, CATEGORY_LABELS[language][input.category]],
    [labels.place, input.placeName],
    [labels.address, input.placeAddress || labels.none],
    [labels.date, formatDateTime(input.preferredDate, input.preferredTime, language)],
    [labels.guests, language === "ja" ? `${input.partySize}${labels.people}` : String(input.partySize)],
    [labels.notes, input.requestDetails || labels.none],
  ];

  if (link) rows.splice(4, 0, [labels.link, link]);
  return { labels, rows, link };
}

function buildJapaneseEmail(input: BookingReceiptInput) {
  const { rows, link } = detailRows(input);
  const subject = `【Booking Daijoubu】予約リクエストを受け付けました（${input.requestCode}）`;
  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const text = `予約リクエストを受け付けました。\n\n現在、以下の内容で店舗へ予約可能か確認しています。\n\n${textRows}\n\n※この時点では、まだ予約は確定していません。\n\n【確認時間について】\n平日9:00〜21:00（韓国時間）は、通常もっとも早く確認できます。時間外・週末・店舗の返信状況によっては、回答までお時間をいただく場合があります。\n\n【予約可能な場合】\nメールで予約名義（パスポートと同じ英字名を推奨）と、代行手数料・店舗予約金の先払い方法をご案内します。お支払いの確認後に予約を確定します。空席確認までは無料です。\n\n同じ内容を重複して送信せず、このメールを保管してください。\n\nBooking Daijoubu`;

  const htmlRows = rows.map(([label, value]) => {
    const rendered = link && value === link
      ? `<a href="${escapeHtml(link)}" style="color:#1b64da;text-decoration:none;word-break:break-all">${escapeHtml(link)}</a>`
      : escapeHtml(value);
    return `<tr><td style="padding:10px 12px;color:#6b7684;font-size:13px;vertical-align:top;width:118px;border-bottom:1px solid #eef1f4">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#191f28;font-size:13px;line-height:1.6;border-bottom:1px solid #eef1f4">${rendered}</td></tr>`;
  }).join("");

  const html = `<!doctype html><html lang="ja"><body style="margin:0;background:#f2f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;color:#191f28"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:20px;padding:32px;box-shadow:0 8px 28px rgba(0,27,55,.06)"><div style="display:inline-block;padding:7px 10px;border-radius:9px;background:#eff6ff;color:#1b64da;font-size:12px;font-weight:700">Booking Daijoubu</div><h1 style="margin:18px 0 10px;font-size:24px;line-height:1.35;letter-spacing:-.03em">予約リクエストを受け付けました</h1><p style="margin:0 0 22px;color:#4e5968;font-size:14px;line-height:1.75">現在、以下の内容で店舗へ予約可能か確認しています。</p><table role="presentation" style="width:100%;border-collapse:collapse;background:#fafbfc;border-radius:14px;overflow:hidden">${htmlRows}</table><div style="margin-top:22px;padding:16px;border-radius:14px;background:#fff8e8;color:#6b4f16;font-size:13px;line-height:1.7"><strong>まだ予約は確定していません。</strong><br>店舗から予約可能との回答を得た後、予約名義と先払い方法をご案内します。</div><h2 style="margin:26px 0 8px;font-size:16px">確認時間について</h2><p style="margin:0;color:#4e5968;font-size:13px;line-height:1.8">平日9:00〜21:00（韓国時間）は、通常もっとも早く確認できます。時間外・週末・店舗の返信状況によっては、回答までお時間をいただく場合があります。</p><h2 style="margin:24px 0 8px;font-size:16px">予約可能な場合</h2><p style="margin:0;color:#4e5968;font-size:13px;line-height:1.8">メールで予約名義（パスポートと同じ英字名を推奨）と、代行手数料・店舗予約金の先払い方法をご案内します。お支払いの確認後に予約を確定します。空席確認までは無料です。</p><p style="margin:26px 0 0;color:#8b95a1;font-size:12px;line-height:1.7">同じ内容を重複して送信せず、このメールと受付番号を保管してください。</p></div></div></body></html>`;
  return { subject, text, html };
}

function buildEnglishEmail(input: BookingReceiptInput) {
  const { rows, link } = detailRows(input);
  const subject = `Booking request received — ${input.requestCode}`;
  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const text = `We’ve received your booking request.\n\nWe are checking with the venue using the details below.\n\n${textRows}\n\nThis is not yet a confirmed booking.\n\nRESPONSE TIMES\nRequests submitted on weekdays between 9:00 AM and 9:00 PM Korea Standard Time are usually checked fastest. Responses may take longer outside these hours, on weekends, or when the venue is slow to reply.\n\nIF THE VENUE IS AVAILABLE\nWe will email you to request the booking name (preferably as shown in your passport) and send the prepayment details for the service fee and any venue deposit. The booking is finalized only after payment. Availability checks are free.\n\nPlease avoid submitting the same request again and keep this email for reference.\n\nBooking Daijoubu`;

  const htmlRows = rows.map(([label, value]) => {
    const rendered = link && value === link
      ? `<a href="${escapeHtml(link)}" style="color:#1b64da;text-decoration:none;word-break:break-all">${escapeHtml(link)}</a>`
      : escapeHtml(value);
    return `<tr><td style="padding:10px 12px;color:#6b7684;font-size:13px;vertical-align:top;width:150px;border-bottom:1px solid #eef1f4">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#191f28;font-size:13px;line-height:1.6;border-bottom:1px solid #eef1f4">${rendered}</td></tr>`;
  }).join("");

  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f2f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#191f28"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:20px;padding:32px;box-shadow:0 8px 28px rgba(0,27,55,.06)"><div style="display:inline-block;padding:7px 10px;border-radius:9px;background:#eff6ff;color:#1b64da;font-size:12px;font-weight:700">Booking Daijoubu</div><h1 style="margin:18px 0 10px;font-size:24px;line-height:1.35;letter-spacing:-.03em">We’ve received your booking request</h1><p style="margin:0 0 22px;color:#4e5968;font-size:14px;line-height:1.75">We are checking with the venue using the details below.</p><table role="presentation" style="width:100%;border-collapse:collapse;background:#fafbfc;border-radius:14px;overflow:hidden">${htmlRows}</table><div style="margin-top:22px;padding:16px;border-radius:14px;background:#fff8e8;color:#6b4f16;font-size:13px;line-height:1.7"><strong>This is not yet a confirmed booking.</strong><br>If the venue is available, we’ll email you to request the booking name and send prepayment details.</div><h2 style="margin:26px 0 8px;font-size:16px">Response times</h2><p style="margin:0;color:#4e5968;font-size:13px;line-height:1.8">Requests submitted on weekdays between 9:00 AM and 9:00 PM Korea Standard Time are usually checked fastest. Responses may take longer outside these hours, on weekends, or when the venue is slow to reply.</p><h2 style="margin:24px 0 8px;font-size:16px">If the venue is available</h2><p style="margin:0;color:#4e5968;font-size:13px;line-height:1.8">We will email you to request the booking name (preferably as shown in your passport) and send the prepayment details for the service fee and any venue deposit. The booking is finalized only after payment. Availability checks are free.</p><p style="margin:26px 0 0;color:#8b95a1;font-size:12px;line-height:1.7">Please avoid submitting the same request again and keep this email and request code for reference.</p></div></div></body></html>`;
  return { subject, text, html };
}

export async function sendBookingReceiptEmail(input: BookingReceiptInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured; booking receipt email skipped");
    return false;
  }

  const message = input.language === "ja" ? buildJapaneseEmail(input) : buildEnglishEmail(input);
  const from = process.env.BOOKING_FROM_EMAIL || "Booking Daijoubu <onboarding@resend.dev>";
  const replyTo = process.env.BOOKING_REPLY_TO;
  const adminEmail = process.env.BOOKING_ADMIN_EMAIL;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.customerEmail],
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(adminEmail ? { bcc: [adminEmail] } : {}),
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    console.error("booking receipt email failed", response.status, await response.text());
    return false;
  }

  return true;
}
