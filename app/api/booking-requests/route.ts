import { NextResponse } from "next/server";
import { sendBookingReceiptEmail } from "@/lib/tokanyaku-booking-email";
import { getSupabaseServerClient, hasSupabasePrivilegedKey } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = new Set(["restaurant", "hair", "nail", "beauty"]);
const ALLOWED_LANGUAGES = new Set(["ja", "en"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

type Step = 1 | 2;

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function date(value: unknown) {
  const cleaned = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function webUrl(value: unknown) {
  const cleaned = text(value, 500);
  if (!cleaned) return null;

  const candidate = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function errorMessage(language: string, ja: string, en: string) {
  return language === "ja" ? ja : en;
}

function validationError(language: string, step: Step, field: string, ja: string, en: string) {
  return NextResponse.json(
    { error: errorMessage(language, ja, en), step, field },
    { status: 400 },
  );
}

function requestCode() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `TKY-${day}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    // Honeypot: bots get a harmless success response without storing anything.
    if (text(body.website, 200)) {
      return NextResponse.json({ requestCode: requestCode(), emailSent: true, adminEmailSent: true }, { status: 201 });
    }

    const language = text(body.language, 2);
    const category = text(body.category, 20);
    const rawPlaceName = text(body.placeName, 120);
    const rawPlaceUrl = text(body.placeUrl, 500);
    const placeUrl = webUrl(rawPlaceUrl);
    const placeAddress = text(body.placeAddress, 300);
    const preferredDate = date(body.preferredDate);
    const preferredTime = text(body.preferredTime, 5);
    const partySize = Number(body.partySize);
    const requestDetails = text(body.requestDetails, 1500);
    const customerEmail = text(body.customerEmail, 180).toLowerCase();
    const consent = body.consent === true;

    if (!ALLOWED_LANGUAGES.has(language) || !ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: errorMessage(language, "入力内容を確認してください。", "Please check your request."), step: 1 },
        { status: 400 },
      );
    }

    if (!rawPlaceUrl) {
      return validationError(language, 1, "placeUrl", "お店のURLを入力してください。", "Please enter the venue URL.");
    }
    if (!placeUrl) {
      return validationError(language, 1, "placeUrl", "お店のURLを確認してください。", "Please enter a valid venue URL.");
    }
    if (!preferredDate) {
      return validationError(language, 1, "preferredDate", "希望日を選択してください。", "Please select a preferred date.");
    }
    if (!TIME_PATTERN.test(preferredTime)) {
      return validationError(language, 1, "preferredTime", "希望時間を選択してください。", "Please select a preferred time.");
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return validationError(language, 1, "partySize", "人数は1〜20名で入力してください。", "Party size must be between 1 and 20.");
    }

    const preferredAt = new Date(`${preferredDate}T${preferredTime}:00+09:00`);
    if (Number.isNaN(preferredAt.getTime()) || preferredAt.getTime() <= Date.now()) {
      return validationError(
        language,
        1,
        "preferredDate",
        "希望日時は現在より後の日時を選んでください。",
        "Please choose a future date and time.",
      );
    }

    if (!EMAIL_PATTERN.test(customerEmail)) {
      return validationError(language, 2, "customerEmail", "メールアドレスを確認してください。", "Please enter a valid email address.");
    }
    if (!consent) {
      return validationError(language, 2, "consent", "予約条件への同意が必要です。", "Please agree to the booking terms.");
    }

    const placeName = rawPlaceName || (language === "ja" ? "URLから店舗確認" : "Identify venue from URL");
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error("booking database client unavailable");
      return NextResponse.json(
        { error: errorMessage(language, "予約受付の接続に失敗しました。もう一度お試しください。", "Could not connect to booking storage. Please try again.") },
        { status: 503 },
      );
    }

    const code = requestCode();
    const customerCountry = language === "ja" ? "JP" : "OTHER";
    const { error: insertError } = await supabase.from("booking_requests").insert({
      request_code: code,
      language,
      category,
      place_name: placeName,
      place_address: placeAddress || null,
      place_url: placeUrl,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      alternative_date: null,
      alternative_time: null,
      party_size: partySize,
      request_details: requestDetails || null,
      customer_name: null,
      customer_email: customerEmail,
      customer_country: customerCountry,
      status: "new",
      payment_method: "paypal",
      payment_status: "not_requested",
    });

    if (insertError) {
      console.error("booking request insert failed", insertError);
      return NextResponse.json(
        { error: errorMessage(language, "予約リクエストを保存できませんでした。もう一度お試しください。", "Could not save your booking request. Please try again.") },
        { status: 503 },
      );
    }

    let emailSent = false;
    let adminEmailSent = false;
    try {
      const emailResult = await sendBookingReceiptEmail({
        requestCode: code,
        language: language as "ja" | "en",
        category: category as "restaurant" | "hair" | "nail" | "beauty",
        placeName,
        placeAddress: placeAddress || null,
        placeUrl,
        preferredDate,
        preferredTime,
        partySize,
        requestDetails: requestDetails || null,
        customerEmail,
      });
      emailSent = emailResult.customerSent;
      adminEmailSent = emailResult.adminSent;
    } catch (emailError) {
      console.error("booking email dispatch threw", emailError);
    }

    if (emailSent && hasSupabasePrivilegedKey()) {
      const { error: updateError } = await supabase
        .from("booking_requests")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("request_code", code);
      if (updateError) console.error("email sent timestamp update failed", updateError);
    }

    return NextResponse.json({ requestCode: code, emailSent, adminEmailSent }, { status: 201 });
  } catch (error) {
    console.error("booking request API failed", error);
    return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });
  }
}
