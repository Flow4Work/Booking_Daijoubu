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

export type BookingEmailResult = {
  customerSent: boolean;
  adminSent: boolean;
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

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

function buildRows(input: BookingReceiptInput) {
  const labels = input.language === "ja"
    ? {
        code: "受付番号",
        category: "予約の種類",
        place: "店舗",
        address: "住所",
        link: "店舗URL",
        date: "希望日時",
        guests: "人数",
        notes: "希望・注意事項",
        none: "なし",
      }
    : {
        code: "Request code",
        category: "Booking type",
        place: "Venue",
        address: "Address",
        link: "Venue URL",
        date: "Preferred date and time",
        guests: "Guests",
        notes: "Requests and notes",
        none: "None",
      };

  const link = safeLink(input.placeUrl);
  const rows: Array<[string, string, boolean?]> = [
    [labels.code, input.requestCode],
    [labels.category, CATEGORY_LABELS[input.language][input.category]],
    [labels.place, input.placeName],
    [labels.address, input.placeAddress || labels.none],
  ];
  if (link) rows.push([labels.link, link, true]);
  rows.push(
    [labels.date, formatDateTime(input.preferredDate, input.preferredTime, input.language)],
    [labels.guests, input.language === "ja" ? `${input.partySize}名` : String(input.partySize)],
    [labels.notes, input.requestDetails || labels.none],
  );
  return rows;
}

function renderRowsHtml(rows: Array<[string, string, boolean?]>) {
  return rows.map(([label, value, isLink]) => {
    const rendered = isLink
      ? `<a href="${escapeHtml(value)}" style="color:#1b64da;text-decoration:none;word-break:break-all">${escapeHtml(value)}</a>`
      : escapeHtml(value);
    return `<tr><td style="padding:10px 12px;color:#6b7684;font-size:13px;vertical-align:top;width:125px;border-bottom:1px solid #eef1f4">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#191f28;font-size:13px;line-height:1.6;border-bottom:1px solid #eef1f4">${rendered}</td></tr>`;
  }).join("");
}

function buildCustomerMessage(input: BookingReceiptInput) {
  const rows = buildRows(input);
  const japanese = input.language === "ja";
  const subject = japanese
    ? `【Tokanyaku】予約リクエストを受け付けました（${input.requestCode}）`
    : `Tokanyaku booking request received — ${input.requestCode}`;

  const intro = japanese
    ? "予約リクエストを受け付けました。現在、店舗へ空席と予約条件を確認しています。"
    : "We’ve received your booking request and are checking availability and booking terms with the venue.";
  const pending = japanese
    ? "まだ予約は確定していません。予約可能な場合のみ、代行手数料と店舗予約金、予約名義をご案内します。"
    : "This is not yet a confirmed booking. If the venue is available, we’ll send the service fee, any venue deposit, and booking-name instructions.";
  const responseTime = japanese
    ? "店舗の返信状況により時間がかかる場合があります。確認結果はこのメールアドレスへご案内します。"
    : "Response time depends on the venue. We’ll send the availability result to this email address.";

  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const text = `${intro}\n\n${textRows}\n\n${pending}\n${responseTime}\n\nTokanyaku`;
  const htmlRows = renderRowsHtml(rows);
  const html = `<!doctype html><html lang="${japanese ? "ja" : "en"}"><body style="margin:0;background:#f2f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;color:#191f28"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:20px;padding:30px;box-shadow:0 8px 28px rgba(0,27,55,.06)"><div style="display:inline-block;padding:7px 10px;border-radius:9px;background:#eff6ff;color:#1b64da;font-size:12px;font-weight:700">Tokanyaku</div><h1 style="margin:18px 0 10px;font-size:24px;line-height:1.35">${japanese ? "予約リクエストを受け付けました" : "We’ve received your booking request"}</h1><p style="margin:0 0 22px;color:#4e5968;font-size:14px;line-height:1.75">${escapeHtml(intro)}</p><table role="presentation" style="width:100%;border-collapse:collapse;background:#fafbfc;border-radius:14px;overflow:hidden">${htmlRows}</table><div style="margin-top:22px;padding:16px;border-radius:14px;background:#fff8e8;color:#6b4f16;font-size:13px;line-height:1.7"><strong>${japanese ? "まだ予約は確定していません。" : "This is not yet a confirmed booking."}</strong><br>${escapeHtml(pending)}</div><p style="margin:20px 0 0;color:#6b7684;font-size:12px;line-height:1.7">${escapeHtml(responseTime)}</p></div></div></body></html>`;

  return { subject, text, html };
}

function buildAdminMessage(input: BookingReceiptInput) {
  const rows = [["Customer email", input.customerEmail] as [string, string], ...buildRows(input)];
  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const subject = `[Tokanyaku] New booking request · ${input.requestCode}`;
  const text = `New Tokanyaku booking request\n\n${textRows}`;
  const htmlRows = renderRowsHtml(rows);
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f2f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;color:#191f28"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:20px;padding:30px"><div style="display:inline-block;padding:7px 10px;border-radius:9px;background:#eff6ff;color:#1b64da;font-size:12px;font-weight:700">Tokanyaku Admin</div><h1 style="margin:18px 0 18px;font-size:22px">New booking request</h1><table role="presentation" style="width:100%;border-collapse:collapse;background:#fafbfc;border-radius:14px;overflow:hidden">${htmlRows}</table></div></div></body></html>`;
  return { subject, text, html };
}

async function sendResendEmail(
  apiKey: string,
  payload: Record<string, unknown>,
  logLabel: "admin" | "customer",
) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Tokanyaku ${logLabel} email failed`, response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Tokanyaku ${logLabel} email threw`, error);
    return false;
  }
}

export async function sendBookingReceiptEmail(input: BookingReceiptInput): Promise<BookingEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured; booking emails skipped");
    return { customerSent: false, adminSent: false };
  }

  const from = process.env.BOOKING_FROM_EMAIL || "Tokanyaku <onboarding@resend.dev>";
  const replyTo = process.env.BOOKING_REPLY_TO;
  const adminEmails = Array.from(new Set(
    [process.env.BOOKING_ADMIN_EMAIL, "treecox19@gmail.com"].filter(
      (email): email is string => Boolean(email),
    ),
  ));

  const adminMessage = buildAdminMessage(input);
  const customerMessage = buildCustomerMessage(input);

  // Admin notification is intentionally independent from the customer receipt.
  // A customer-address or sender-domain problem must not suppress the operator alert.
  const adminSent = adminEmails.length > 0
    ? await sendResendEmail(
        apiKey,
        {
          from,
          to: adminEmails,
          reply_to: input.customerEmail,
          subject: adminMessage.subject,
          text: adminMessage.text,
          html: adminMessage.html,
        },
        "admin",
      )
    : false;

  const customerSent = await sendResendEmail(
    apiKey,
    {
      from,
      to: [input.customerEmail],
      subject: customerMessage.subject,
      text: customerMessage.text,
      html: customerMessage.html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    },
    "customer",
  );

  return { customerSent, adminSent };
}
