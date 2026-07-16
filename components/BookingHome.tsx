"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Language = "ja" | "en";
type Category = "restaurant" | "hair" | "nail" | "beauty";
type ValidationKey = "placeName" | "preferredDate" | "preferredTime" | "partySize" | "customerName" | "customerEmail" | "consent";

type FormState = {
  category: Category;
  placeName: string;
  placeAddress: string;
  placeUrl: string;
  preferredYear: string;
  preferredMonth: string;
  preferredDay: string;
  preferredTime: string;
  partySize: string;
  requestDetails: string;
  customerName: string;
  customerEmail: string;
  customerCountry: string;
  consent: boolean;
  website: string;
};

type DiscoveryItem = {
  label: string;
  query: string;
  icon: string;
  category: Category;
};

const INITIAL_FORM: FormState = {
  category: "restaurant",
  placeName: "",
  placeAddress: "",
  placeUrl: "",
  preferredYear: "2026",
  preferredMonth: "",
  preferredDay: "",
  preferredTime: "19:00",
  partySize: "2",
  requestDetails: "",
  customerName: "",
  customerEmail: "",
  customerCountry: "JP",
  consent: false,
  website: "",
};

const CONCERNS = {
  ja: [
    ["📱", "韓国の電話番号がない"],
    ["🗣️", "韓国語が話せない"],
    ["🔐", "韓国の本人認証ができない"],
    ["💳", "海外カードが使えない"],
    ["☎️", "お店に電話できない"],
    ["💰", "予約金の支払い方がわからない"],
    ["🙌", "Booking Daijoubuに連絡すれば大丈夫"],
  ],
  en: [
    ["📱", "I don’t have a Korean phone number"],
    ["🗣️", "I don’t speak Korean"],
    ["🔐", "I can’t complete Korean verification"],
    ["💳", "My overseas card doesn’t work"],
    ["☎️", "I can’t call the venue"],
    ["💰", "I don’t know how to pay the deposit"],
    ["🙌", "Contact Booking Daijoubu — we’ll handle it"],
  ],
} as const;

const DISCOVERY: Record<Language, DiscoveryItem[]> = {
  ja: [
    { label: "ソンスのカフェ", query: "ソンス カフェ", icon: "☕", category: "restaurant" },
    { label: "ホンデの人気店", query: "ホンデ 人気 レストラン", icon: "🍜", category: "restaurant" },
    { label: "韓国料理", query: "ソウル 韓国料理", icon: "🍲", category: "restaurant" },
    { label: "韓国焼肉", query: "ソウル 韓国焼肉", icon: "🥩", category: "restaurant" },
    { label: "ベーカリー", query: "ソウル ベーカリー", icon: "🥐", category: "restaurant" },
    { label: "ベジタリアン", query: "ソウル ベジタリアン レストラン", icon: "🥗", category: "restaurant" },
    { label: "ヘアサロン", query: "ソウル ヘアサロン", icon: "✂️", category: "hair" },
    { label: "ネイルサロン", query: "ソウル ネイルサロン", icon: "💅", category: "nail" },
    { label: "スキンケア", query: "ソウル スキンケア", icon: "✨", category: "beauty" },
    { label: "メイクアップ", query: "ソウル メイクアップサロン", icon: "💄", category: "beauty" },
    { label: "スパ・マッサージ", query: "ソウル スパ マッサージ", icon: "🌿", category: "beauty" },
    { label: "ルーフトップバー", query: "ソウル ルーフトップバー", icon: "🍸", category: "restaurant" },
  ],
  en: [
    { label: "Seongsu cafés", query: "Seongsu cafe", icon: "☕", category: "restaurant" },
    { label: "Hongdae restaurants", query: "Hongdae popular restaurants", icon: "🍜", category: "restaurant" },
    { label: "Korean food", query: "Seoul Korean food", icon: "🍲", category: "restaurant" },
    { label: "Korean BBQ", query: "Seoul Korean BBQ", icon: "🥩", category: "restaurant" },
    { label: "Bakeries", query: "Seoul bakery", icon: "🥐", category: "restaurant" },
    { label: "Vegetarian food", query: "Seoul vegetarian restaurant", icon: "🥗", category: "restaurant" },
    { label: "Hair salons", query: "Seoul hair salon", icon: "✂️", category: "hair" },
    { label: "Nail salons", query: "Seoul nail salon", icon: "💅", category: "nail" },
    { label: "Skin care", query: "Seoul skin care", icon: "✨", category: "beauty" },
    { label: "Makeup studios", query: "Seoul makeup studio", icon: "💄", category: "beauty" },
    { label: "Spa and massage", query: "Seoul spa massage", icon: "🌿", category: "beauty" },
    { label: "Rooftop bars", query: "Seoul rooftop bar", icon: "🍸", category: "restaurant" },
  ],
};

const COPY = {
  ja: {
    navRequest: "予約を依頼する",
    navExplore: "お店を探す",
    title: "韓国のお店を代わりに予約します。",
    description: "店名と日時を送るだけ。空席確認後、支払いで予約確定。",
    formLabel: "予約リクエスト",
    formTitle: "予約したいお店を入力",
    formDescription: "店名と希望日時を入力してください。住所がわかれば、同名店舗の取り違えを防げます。",
    confirmationNote: "店舗への空席確認は無料です。予約可能と確認できた場合のみ、代行手数料と店舗予約金を先払いして予約を確定します。",
    required: "必須",
    optional: "任意",
    requiredError: "入力してください。",
    dateError: "正しい日付を選択してください。",
    emailError: "正しいメールアドレスを入力してください。",
    consentError: "同意が必要です。",
    category: "予約の種類",
    categories: { restaurant: "飲食店・カフェ", hair: "ヘアサロン", nail: "ネイル", beauty: "その他のお問い合わせ" },
    placeName: "お店の名前",
    placeNamePlaceholder: "例：ソンス○○食堂",
    placeAddress: "住所",
    placeAddressPlaceholder: "例：ソウル特別市 城東区 ○○路 12",
    placeAddressHelp: "同じ名前のお店があるため、住所の入力をおすすめします。",
    placeUrl: "お店のURL",
    placeUrlPlaceholder: "Naver Map、Google Maps、Instagramなど",
    preferred: "希望日時",
    year: "年",
    month: "月",
    day: "日",
    time: "時間",
    partySize: "人数",
    details: "希望内容・注意事項",
    detailsPlaceholder: "アレルギー、希望メニュー、ヘアスタイル、予算など",
    name: "予約者名",
    namePlaceholder: "パスポートと同じ英字名を推奨",
    email: "メールアドレス",
    country: "居住国",
    consent: "予約条件、キャンセル・ノーショー規定、個人情報の利用に同意します。",
    submit: "無料で空席確認を依頼する",
    submitting: "送信中…",
    successTitle: "予約リクエストを受け付けました",
    successDescription: "店舗へ確認後、結果と決済案内をメールで送ります。現時点では予約はまだ確定していません。",
    requestCode: "受付番号",
    another: "別の予約を依頼する",
    error: "送信できませんでした。入力内容を確認して、もう一度お試しください。",
    processLabel: "予約の流れ",
    processTitle: "送信後はこちらで対応します",
    timeline: [
      ["1", "無料で空席確認", "韓国語で店舗へ空席と条件を確認します。"],
      ["2", "先払いをご案内", "予約可能な場合だけ手数料と予約金をご案内します。"],
      ["3", "支払い後に確定", "入金を確認して店舗予約を最終確定します。"],
    ],
    paymentLabel: "料金",
    paymentTitle: "確認までは無料",
    paymentText: "空席がなければ請求はありません。予約できる場合だけ、内容と金額を確認して先払いします。",
    paymentItems: ["代行手数料：目安 ¥700〜", "店舗予約金：店舗が求める実費", "決済：PayPal・対応カード"],
    noShow: "予約確定後の代行手数料は返金されません。店舗予約金は店舗のキャンセル・ノーショー規定に従います。",
    exploreLabel: "お店を探す",
    exploreTitle: "まだお店が決まっていませんか？",
    exploreDescription: "カテゴリーを押すと、日本語の検索語でNaver Mapが開きます。お店の名前と住所をコピーして、予約フォームに入力してください。",
    exploreNote: "Naver Mapの画面言語は、Naverまたはブラウザの設定に従います。",
    footer: "Booking Daijoubu · Seoul booking concierge",
    footerNotice: "予約の成立や店舗のサービス品質を保証するものではありません。医療予約には対応していません。",
  },
  en: {
    navRequest: "Request a booking",
    navExplore: "Find a place",
    title: "We book Korean places for you.",
    description: "Send the place and time. Pay only after we confirm availability.",
    formLabel: "Booking request",
    formTitle: "Enter the place you want to book",
    formDescription: "Enter the place and preferred time. Adding an address helps us identify the correct venue.",
    confirmationNote: "Checking with the venue is free. Only when booking is available do you prepay the service fee and any venue deposit to finalize it.",
    required: "Required",
    optional: "Optional",
    requiredError: "This field is required.",
    dateError: "Select a valid date.",
    emailError: "Enter a valid email address.",
    consentError: "You must agree before submitting.",
    category: "Booking type",
    categories: { restaurant: "Restaurant or café", hair: "Hair salon", nail: "Nail salon", beauty: "Other inquiry" },
    placeName: "Place name",
    placeNamePlaceholder: "Example: Seongsu restaurant name",
    placeAddress: "Address",
    placeAddressPlaceholder: "Example: 12 Example-ro, Seongdong-gu, Seoul",
    placeAddressHelp: "We recommend adding the address when places have similar names.",
    placeUrl: "Place URL",
    placeUrlPlaceholder: "Naver Map, Google Maps, Instagram, etc.",
    preferred: "Preferred date and time",
    year: "Year",
    month: "Month",
    day: "Day",
    time: "Time",
    partySize: "Guests",
    details: "Requests and notes",
    detailsPlaceholder: "Allergies, menu, hairstyle, budget, and other details",
    name: "Booking name",
    namePlaceholder: "Use the same English name as your passport",
    email: "Email",
    country: "Country of residence",
    consent: "I agree to the booking, cancellation, no-show, and privacy terms.",
    submit: "Request a free availability check",
    submitting: "Sending…",
    successTitle: "Your booking request has been received",
    successDescription: "We will email the result and payment instructions after checking with the venue. Your booking is not confirmed yet.",
    requestCode: "Request code",
    another: "Request another booking",
    error: "We could not send your request. Check the form and try again.",
    processLabel: "What happens next",
    processTitle: "We take it from here",
    timeline: [
      ["1", "Free availability check", "We contact the venue in Korean and confirm the conditions."],
      ["2", "Prepayment request", "Only when available do we send the service fee and deposit."],
      ["3", "Booking finalized", "We finalize the venue booking after payment is received."],
    ],
    paymentLabel: "Pricing",
    paymentTitle: "Free until confirmed available",
    paymentText: "You pay nothing if the venue is unavailable. When it is available, review the details and prepay to finalize the booking.",
    paymentItems: ["Service fee: from about ¥700", "Venue deposit: actual venue amount", "Payment: PayPal or supported cards"],
    noShow: "The service fee is non-refundable after confirmation. Venue deposits follow the venue’s cancellation and no-show policy.",
    exploreLabel: "Find a place",
    exploreTitle: "Still deciding where to go?",
    exploreDescription: "Select a category to open Naver Map with an English search. Copy the place name and address, then enter them in the booking form.",
    exploreNote: "The Naver Map interface language follows your Naver or browser settings.",
    footer: "Booking Daijoubu · Seoul booking concierge",
    footerNotice: "We do not guarantee availability or venue service quality. Medical bookings are not supported.",
  },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YEARS = [2026, 2027, 2028];
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function naverMapSearch(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

function buildDate(form: FormState) {
  if (!form.preferredYear || !form.preferredMonth || !form.preferredDay) return "";
  return `${form.preferredYear}-${form.preferredMonth.padStart(2, "0")}-${form.preferredDay.padStart(2, "0")}`;
}

function localizedTime(value: string, language: Language) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  if (language === "ja") return `${hourText}:${minute}`;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

export default function BookingHome() {
  const [language, setLanguage] = useState<Language>("ja");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const copy = COPY[language];
  const discovery = DISCOVERY[language];
  const discoveryRows = [discovery.slice(0, 6), discovery.slice(6)];

  const minimumDate = useMemo(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(tomorrow);
  }, []);

  const selectedYear = Number(form.preferredYear || 2026);
  const selectedMonth = Number(form.preferredMonth || 1);
  const maximumDay = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = useMemo(() => Array.from({ length: maximumDay }, (_, index) => index + 1), [maximumDay]);
  const preferredDate = buildDate(form);

  const validation = useMemo<Record<ValidationKey, string>>(() => {
    const preferredAt = preferredDate ? new Date(`${preferredDate}T${form.preferredTime || "00:00"}:00+09:00`) : null;
    const dateInvalid = !preferredDate || !preferredAt || Number.isNaN(preferredAt.getTime()) || preferredDate < minimumDate;
    const partySize = Number(form.partySize);

    return {
      placeName: form.placeName.trim() ? "" : copy.requiredError,
      preferredDate: dateInvalid ? copy.dateError : "",
      preferredTime: /^\d{2}:\d{2}$/.test(form.preferredTime) ? "" : copy.requiredError,
      partySize: Number.isInteger(partySize) && partySize >= 1 && partySize <= 20 ? "" : copy.requiredError,
      customerName: form.customerName.trim() ? "" : copy.requiredError,
      customerEmail: EMAIL_PATTERN.test(form.customerEmail.trim()) ? "" : copy.emailError,
      consent: form.consent ? "" : copy.consentError,
    };
  }, [copy, form, minimumDate, preferredDate]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (Number(form.preferredDay) > maximumDay) {
      setForm((current) => ({ ...current, preferredDay: "" }));
    }
  }, [form.preferredDay, maximumDay]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function hasError(key: ValidationKey) {
    return showErrors && Boolean(validation[key]);
  }

  function scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    setError("");

    if (Object.values(validation).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-error="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, preferredDate, language }),
      });
      const data = (await response.json()) as { requestCode?: string; error?: string };
      if (!response.ok || !data.requestCode) throw new Error(data.error || copy.error);
      setRequestCode(data.requestCode);
      setForm(INITIAL_FORM);
      setShowErrors(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.error);
    } finally {
      setSubmitting(false);
    }
  }

  const yearSelect = (
    <select key="year" aria-label={copy.year} value={form.preferredYear} onChange={(event) => update("preferredYear", event.target.value)}>
      {YEARS.map((year) => <option key={year} value={year}>{language === "ja" ? `${year}年` : year}</option>)}
    </select>
  );

  const monthSelect = (
    <select key="month" aria-label={copy.month} value={form.preferredMonth} onChange={(event) => update("preferredMonth", event.target.value)}>
      <option value="">{copy.month}</option>
      {MONTHS.map((month) => (
        <option key={month} value={month}>
          {language === "ja" ? `${month}月` : new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2026, month - 1, 1))}
        </option>
      ))}
    </select>
  );

  const daySelect = (
    <select key="day" aria-label={copy.day} value={form.preferredDay} onChange={(event) => update("preferredDay", event.target.value)}>
      <option value="">{copy.day}</option>
      {days.map((day) => <option key={day} value={day}>{language === "ja" ? `${day}日` : day}</option>)}
    </select>
  );

  return (
    <main className="booking-page">
      <header className="booking-header">
        <a className="booking-logo" href="/" aria-label="Booking Daijoubu home"><span>大</span><strong>Booking Daijoubu</strong></a>
        <nav className="booking-nav">
          <button className="booking-nav-action booking-nav-primary" type="button" onClick={() => scrollTo("booking-request")}>{copy.navRequest}</button>
          <button className="booking-nav-action" type="button" onClick={() => scrollTo("booking-explore")}>{copy.navExplore}</button>
          <div className="booking-language" aria-label="Language selector">
            <button className={language === "ja" ? "active" : ""} type="button" onClick={() => setLanguage("ja")}>日本語</button>
            <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
          </div>
        </nav>
      </header>

      <section className="booking-concern-strip" aria-label="Booking concerns">
        <div className="booking-concern-track">
          {[...CONCERNS[language], ...CONCERNS[language]].map(([icon, text], index) => (
            <span key={`${text}-${index}`} aria-hidden={index >= CONCERNS[language].length}><b>{icon}</b>{text}</span>
          ))}
        </div>
      </section>

      <div className="booking-platform-shell">
        <section className="booking-platform-intro">
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </section>

        <section id="booking-request" className="booking-workspace">
          <div className="booking-form-card booking-platform-card">
            <div className="booking-form-intro"><p>{copy.formLabel}</p><h2>{copy.formTitle}</h2><span>{copy.formDescription}</span></div>
            <div className="booking-confirmation-note"><span>✓</span><p>{copy.confirmationNote}</p></div>

            {requestCode ? (
              <div className="booking-success"><span>✓</span><h3>{copy.successTitle}</h3><p>{copy.successDescription}</p><div><small>{copy.requestCode}</small><strong>{requestCode}</strong></div><button type="button" onClick={() => setRequestCode("")}>{copy.another}</button></div>
            ) : (
              <form noValidate onSubmit={handleSubmit}>
                <label className="booking-field booking-field-wide"><span>{copy.category}<b className="booking-required">{copy.required}</b></span><div className="booking-category-grid">{(Object.keys(copy.categories) as Category[]).map((item) => <button className={form.category === item ? "active" : ""} type="button" key={item} onClick={() => update("category", item)}>{copy.categories[item]}</button>)}</div></label>

                <label className={`booking-field booking-field-wide ${hasError("placeName") ? "has-error" : ""}`} data-error={hasError("placeName") || undefined}>
                  <span>{copy.placeName}<b className="booking-required">{copy.required}</b></span>
                  <input aria-invalid={hasError("placeName")} value={form.placeName} onChange={(event) => update("placeName", event.target.value)} placeholder={copy.placeNamePlaceholder} maxLength={120} />
                  {hasError("placeName") && <small className="booking-validation-error">{validation.placeName}</small>}
                </label>

                <label className="booking-field booking-field-wide booking-optional-field">
                  <span>{copy.placeAddress}<em className="booking-optional">{copy.optional}</em></span>
                  <input value={form.placeAddress} onChange={(event) => update("placeAddress", event.target.value)} placeholder={copy.placeAddressPlaceholder} maxLength={300} />
                  <small className="booking-field-help">{copy.placeAddressHelp}</small>
                </label>

                <label className="booking-field booking-field-wide booking-optional-field">
                  <span>{copy.placeUrl}<em className="booking-optional">{copy.optional}</em></span>
                  <input type="url" value={form.placeUrl} onChange={(event) => update("placeUrl", event.target.value)} placeholder={copy.placeUrlPlaceholder} maxLength={500} />
                </label>

                <fieldset className={`booking-fieldset booking-field-wide ${hasError("preferredDate") || hasError("preferredTime") ? "has-error" : ""}`} data-error={hasError("preferredDate") || hasError("preferredTime") || undefined}>
                  <legend>{copy.preferred}<b className="booking-required">{copy.required}</b></legend>
                  <div className={`booking-date-grid ${language}`}>{language === "ja" ? [yearSelect, monthSelect, daySelect] : [monthSelect, daySelect, yearSelect]}</div>
                  <select aria-label={copy.time} aria-invalid={hasError("preferredTime")} value={form.preferredTime} onChange={(event) => update("preferredTime", event.target.value)}>
                    {TIME_OPTIONS.map((time) => <option key={time} value={time}>{localizedTime(time, language)}</option>)}
                  </select>
                  {(hasError("preferredDate") || hasError("preferredTime")) && <small className="booking-validation-error">{validation.preferredDate || validation.preferredTime}</small>}
                </fieldset>

                <label className={`booking-field ${hasError("partySize") ? "has-error" : ""}`} data-error={hasError("partySize") || undefined}>
                  <span>{copy.partySize}<b className="booking-required">{copy.required}</b></span>
                  <input aria-invalid={hasError("partySize")} type="number" min="1" max="20" value={form.partySize} onChange={(event) => update("partySize", event.target.value)} />
                  {hasError("partySize") && <small className="booking-validation-error">{validation.partySize}</small>}
                </label>

                <label className="booking-field booking-field-wide booking-optional-field">
                  <span>{copy.details}<em className="booking-optional">{copy.optional}</em></span>
                  <textarea value={form.requestDetails} onChange={(event) => update("requestDetails", event.target.value)} placeholder={copy.detailsPlaceholder} maxLength={1500} />
                </label>

                <label className={`booking-field ${hasError("customerName") ? "has-error" : ""}`} data-error={hasError("customerName") || undefined}>
                  <span>{copy.name}<b className="booking-required">{copy.required}</b></span>
                  <input aria-invalid={hasError("customerName")} value={form.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder={copy.namePlaceholder} maxLength={100} />
                  {hasError("customerName") && <small className="booking-validation-error">{validation.customerName}</small>}
                </label>

                <label className={`booking-field ${hasError("customerEmail") ? "has-error" : ""}`} data-error={hasError("customerEmail") || undefined}>
                  <span>{copy.email}<b className="booking-required">{copy.required}</b></span>
                  <input aria-invalid={hasError("customerEmail")} type="email" value={form.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} placeholder="name@example.com" maxLength={180} />
                  {hasError("customerEmail") && <small className="booking-validation-error">{validation.customerEmail}</small>}
                </label>

                <label className="booking-field"><span>{copy.country}<b className="booking-required">{copy.required}</b></span><select value={form.customerCountry} onChange={(event) => update("customerCountry", event.target.value)}><option value="JP">日本 / Japan</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="AU">Australia</option><option value="CA">Canada</option><option value="SG">Singapore</option><option value="OTHER">Other</option></select></label>
                <label className="booking-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>

                <label className={`booking-consent booking-field-wide ${hasError("consent") ? "has-error" : ""}`} data-error={hasError("consent") || undefined}><input aria-invalid={hasError("consent")} type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} /><span>{copy.consent}</span></label>
                {hasError("consent") && <small className="booking-validation-error booking-field-wide">{validation.consent}</small>}
                {error && <p className="booking-error" role="alert">{error}</p>}
                <button className="booking-submit booking-field-wide" disabled={submitting} type="submit">{submitting ? copy.submitting : copy.submit}</button>
              </form>
            )}
          </div>

          <aside className="booking-side-rail">
            <section className="booking-platform-card booking-process-card"><p className="booking-card-label">{copy.processLabel}</p><h2>{copy.processTitle}</h2><ol>{copy.timeline.map(([number, title, description]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><small>{description}</small></div></li>)}</ol></section>
            <section className="booking-platform-card booking-payment-card"><p className="booking-card-label">{copy.paymentLabel}</p><h2>{copy.paymentTitle}</h2><p>{copy.paymentText}</p><ul>{copy.paymentItems.map((item) => <li key={item}>✓ {item}</li>)}</ul><small className="booking-noshow-note">{copy.noShow}</small></section>
          </aside>
        </section>

        <section id="booking-explore" className="booking-discovery booking-platform-card">
          <div className="booking-discovery-heading"><p>{copy.exploreLabel}</p><h2>{copy.exploreTitle}</h2><span>{copy.exploreDescription}</span></div>
          <div className="booking-marquee" aria-label={copy.exploreLabel}>{discoveryRows.map((row, rowIndex) => <div className={`booking-marquee-lane ${rowIndex === 1 ? "reverse" : ""}`} key={rowIndex}><div className="booking-marquee-track">{[...row, ...row].map((item, index) => <a key={`${item.query}-${index}`} href={naverMapSearch(item.query)} target="_blank" rel="noreferrer noopener" aria-hidden={index >= row.length} tabIndex={index >= row.length ? -1 : 0} onClick={() => update("category", item.category)}><span>{item.icon}</span><strong>{item.label}</strong><b aria-hidden="true">↗</b></a>)}</div></div>)}</div>
          <small className="booking-explore-note">{copy.exploreNote}</small>
        </section>
      </div>

      <footer className="booking-footer"><strong>{copy.footer}</strong><p>{copy.footerNotice}</p></footer>
    </main>
  );
}
