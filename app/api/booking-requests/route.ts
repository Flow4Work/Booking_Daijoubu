import { NextResponse } from "next/server";
import { sendBookingReceiptEmail } from "@/lib/tokanyaku-booking-email";
import { getSupabaseServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = new Set(["restaurant", "hair", "nail", "beauty"]);
const ALLOWED_LANGUAGES = new Set(["ja", "en"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function date(value: unknown) {
  const cleaned = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function webUrl(value: unknown) {
  const cleaned = text(value, 500);
  if (!cleaned) return "";

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

function requestCode() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `TKY-${day}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (text(body.website, 200)) {
      return NextResponse.json({ requestCode: requestCode(), emailSent: true }, { status: 201 });
    }

    const language = text(body.language, 2);
    const category = text(body.category, 20);
    const rawPlaceName = text(body.placeName, 120);
    const rawPlaceUrl = text(body.placeUrl, 500);
    const parsedPlaceUrl = webUrl(rawPlaceUrl);
    const placeAddress = text(body.placeAddress, 300);
    const preferredDate = date(body.preferredDate);
    const preferredTime = text(body.preferredTime, 5);
    const partySize = Number(body.partySize);
    const requestDetails = text(body.requestDetails, 1500);
    const customerEmail = text(body.customerEmail, 180).toLowerCase();
    const consent = body.consent === true;

    if (!ALLOWED_LANGUAGES.has(language) || !ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Unsupported request." }, { status: 400 });
    }

    // Step 2: validate contact information independently.
    if (!EMAIL_PATTERN.test(customerEmail)) {
      return NextResponse.json(
        { error: errorMessage(language, "メールアドレスを確認してください。", "Please enter a valid email address.") },
        { status: 400 },
      );
    }
    if (!consent) {
      return NextResponse.json(
        { error: errorMessage(language, "予約条件への同意が必要です。", "Please agree to the booking terms.") },
        { status: 400 },
      );
    }

    // The URL is optional when a place name is provided. A mistyped optional URL
    // must not block a valid booking request. When URL is the only place identifier,
    // it still has to be a valid web URL.
    if (!rawPlaceName && rawPlaceUrl && parsedPlaceUrl === null) {
      return NextResponse.json(
        { error: errorMessage(language, "お店のURLを確認してください。", "Please enter a valid venue URL.") },
        { status: 400 },
      );
    }
    const placeUrl = parsedPlaceUrl === null ? "" : parsedPlaceUrl;

    if ((!rawPlaceName && !placeUrl) || !preferredDate || !/^\d{2}:\d{2}$/.test(preferredTime)) {
      return NextResponse.json(
        { error: errorMessage(language, "お店、希望日時を確認してください。", "Please check the place, date, and time.") },
        { status: 400 },
      );
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return NextResponse.json(
        { error: errorMessage(language, "人数は1〜20名で入力してください。", "Party size must be between 1 and 20.") },
        { status: 400 },
      );
    }

    const preferredAt = new Date(`${preferredDate}T${preferredTime}:00+09:00`);
    if (Number.isNaN(preferredAt.getTime()) || preferredAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: errorMessage(language, "希望日時は現在より後の日時を選んでください。", "The preferred date and time must be in the future.") },
        { status: 400 },
      );
    }

    const placeName = rawPlaceName || (language === "ja" ? "URLから店舗確認" : "Identify venue from URL");
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Booking requests are temporarily unavailable." }, { status: 503 });
    }

    const code = requestCode();
    const customerCountry = language === "ja" ? "JP" : "OTHER";
    const { error: insertError } = await supabase.from("booking_requests").insert({
      request_code: code,
      language,
      category,
      place_name: placeName,
      place_address: placeAddress || null,
      place_url: placeUrl || null,
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
      return NextResponse.json({ error: "Could not save the booking request." }, { status: 500 });
    }

    let emailSent = false;
    try {
      emailSent = await sendBookingReceiptEmail({
        requestCode: code,
        language: language as "ja" | "en",
        category: category as "restaurant" | "hair" | "nail" | "beauty",
        placeName,
        placeAddress: placeAddress || null,
        placeUrl: placeUrl || null,
        preferredDate,
        preferredTime,
        partySize,
        requestDetails: requestDetails || null,
        customerEmail,
      });
    } catch (emailError) {
      console.error("booking receipt email threw", emailError);
    }

    if (emailSent) {
      const { error: updateError } = await supabase
        .from("booking_requests")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("request_code", code);
      if (updateError) console.error("email sent timestamp update failed", updateError);
    }

    return NextResponse.json({ requestCode: code, emailSent }, { status: 201 });
  } catch (error) {
    console.error("booking request API failed", error);
    return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });
  }
}
