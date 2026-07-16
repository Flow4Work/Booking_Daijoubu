import { NextResponse } from "next/server";
import { sendBookingReceiptEmail } from "@/lib/booking-email";
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

function requestCode() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `BD-${day}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (text(body.website, 200)) {
      return NextResponse.json({ requestCode: requestCode(), emailSent: true }, { status: 201 });
    }

    const language = text(body.language, 2);
    const category = text(body.category, 20);
    const placeName = text(body.placeName, 120);
    const placeAddress = text(body.placeAddress, 300);
    const placeUrl = text(body.placeUrl, 500);
    const preferredDate = date(body.preferredDate);
    const preferredTime = text(body.preferredTime, 5);
    const partySize = Number(body.partySize);
    const requestDetails = text(body.requestDetails, 1500);
    const customerEmail = text(body.customerEmail, 180).toLowerCase();
    const consent = body.consent === true;

    if (!ALLOWED_LANGUAGES.has(language) || !ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Unsupported request." }, { status: 400 });
    }
    if (!placeName || !preferredDate || !/^\d{2}:\d{2}$/.test(preferredTime)) {
      return NextResponse.json({ error: "Please enter the place, date, and time." }, { status: 400 });
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return NextResponse.json({ error: "Party size must be between 1 and 20." }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(customerEmail) || !consent) {
      return NextResponse.json({ error: "Please check your email and agreement." }, { status: 400 });
    }

    const preferredAt = new Date(`${preferredDate}T${preferredTime}:00+09:00`);
    if (Number.isNaN(preferredAt.getTime()) || preferredAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "The preferred date and time must be in the future." }, { status: 400 });
    }

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
