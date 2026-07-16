"use client";

import { FormEvent, useMemo, useState } from "react";

type Language = "ja" | "en";
type Category = "restaurant" | "hair" | "nail" | "beauty";

type FormState = {
  category: Category;
  placeName: string;
  placeAddress: string;
  placeUrl: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate: string;
  alternativeTime: string;
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
  preferredDate: "",
  preferredTime: "19:00",
  alternativeDate: "",
  alternativeTime: "19:00",
  partySize: "2",
  requestDetails: "",
  customerName: "",
  customerEmail: "",
  customerCountry: "JP",
  consent: false,
  website: "",
};

const DISCOVERY: Record<Language, DiscoveryItem[]> = {
  ja: [
    { label: "ソンスのカフェ", query: "성수 카페", icon: "☕", category: "restaurant" },
    { label: "ホンデの人気店", query: "홍대 맛집", icon: "🍜", category: "restaurant" },
    { label: "韓国料理", query: "서울 한식 맛집", icon: "🍲", category: "restaurant" },
    { label: "韓国焼肉", query: "서울 고기집", icon: "🥩", category: "restaurant" },
    { label: "ベーカリー", query: "서울 베이커리", icon: "🥐", category: "restaurant" },
    { label: "ベジタリアン", query: "서울 채식 식당", icon: "🥗", category: "restaurant" },
    { label: "ヘアサロン", query: "서울 미용실", icon: "✂️", category: "hair" },
    { label: "ネイルサロン", query: "서울 네일샵", icon: "💅", category: "nail" },
    { label: "スキンケア", query: "서울 피부관리", icon: "✨", category: "beauty" },
    { label: "メイクアップ", query: "서울 메이크업샵", icon: "💄", category: "beauty" },
    { label: "スパ・マッサージ", query: "서울 마사지", icon: "🌿", category: "beauty" },
    { label: "ルーフトップバー", query: "서울 루프탑 바", icon: "🍸", category: "restaurant" },
  ],
  en: [
    { label: "Seongsu cafés", query: "성수 카페", icon: "☕", category: "restaurant" },
    { label: "Hongdae restaurants", query: "홍대 맛집", icon: "🍜", category: "restaurant" },
    { label: "Korean food", query: "서울 한식 맛집", icon: "🍲", category: "restaurant" },
    { label: "Korean BBQ", query: "서울 고기집", icon: "🥩", category: "restaurant" },
    { label: "Bakeries", query: "서울 베이커리", icon: "🥐", category: "restaurant" },
    { label: "Vegetarian food", query: "서울 채식 식당", icon: "🥗", category: "restaurant" },
    { label: "Hair salons", query: "서울 미용실", icon: "✂️", category: "hair" },
    { label: "Nail salons", query: "서울 네일샵", icon: "💅", category: "nail" },
    { label: "Skin care", query: "서울 피부관리", icon: "✨", category: "beauty" },
    { label: "Makeup studios", query: "서울 메이크업샵", icon: "💄", category: "beauty" },
    { label: "Spa and massage", query: "서울 마사지", icon: "🌿", category: "beauty" },
    { label: "Rooftop bars", query: "서울 루프탑 바", icon: "🍸", category: "restaurant" },
  ],
};

const COPY = {
  ja: {
    navRequest: "予約を依頼する",
    navExplore: "お店を探す",
    quickRequestTitle: "予約リクエストを始める",
    quickRequestText: "店名と希望日時を入力",
    quickExploreTitle: "予約したいお店を探す",
    quickExploreText: "人気カテゴリーからNaver Mapへ",
    eyebrow: "韓国のお店予約",
    title: "予約したいお店が決まったら、あとはお任せください。",
    description: "店名と希望日時を送るだけ。韓国語で店舗へ確認し、予約できる場合にだけお支払いをご案内します。",
    trust: ["韓国の電話番号不要", "日本語で依頼", "空席確認までは無料"],
    formLabel: "予約リクエスト",
    formTitle: "予約したいお店を入力",
    formDescription: "店名は必須です。住所もわかれば、同名店舗の取り違えを防ぎ、より正確に確認できます。",
    category: "予約の種類",
    categories: { restaurant: "飲食店・カフェ", hair: "ヘアサロン", nail: "ネイル", beauty: "その他ビューティー" },
    placeName: "お店の名前",
    placeNamePlaceholder: "例：ソンス○○食堂",
    placeAddress: "住所（わかる場合はおすすめ）",
    placeAddressPlaceholder: "例：ソウル特別市 城東区 ○○路 12",
    placeAddressHelp: "同じ名前のお店があるため、住所がわかれば店舗を間違えにくくなります。",
    placeUrl: "お店のURL（任意）",
    placeUrlPlaceholder: "Naver Map、Google Maps、Instagramなど",
    preferred: "第一希望",
    alternative: "第二希望（任意）",
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
    successDescription: "店舗へ確認後、このメールアドレスに結果と決済案内を送ります。現時点では予約はまだ確定していません。",
    requestCode: "受付番号",
    another: "別の予約を依頼する",
    error: "送信できませんでした。入力内容を確認して、もう一度お試しください。",
    processLabel: "予約の流れ",
    processTitle: "送信後はこちらで対応します",
    timeline: [
      ["1", "リクエスト受付", "入力内容を確認します。"],
      ["2", "店舗へ確認", "韓国語で空席と条件を確認します。"],
      ["3", "支払い後に確定", "予約可能な場合のみ決済をご案内します。"],
    ],
    paymentLabel: "料金",
    paymentTitle: "空席確認までは無料",
    paymentText: "予約可能と確認できた後に、代行手数料と店舗予約金をご案内します。空席がなければ請求はありません。",
    paymentItems: ["代行手数料：目安 ¥700〜", "店舗予約金：店舗が求める実費", "決済：PayPal・対応カード"],
    noShow: "予約確定後の代行手数料は返金されません。店舗予約金は店舗のキャンセル・ノーショー規定に従います。",
    exploreLabel: "お店を探す",
    exploreTitle: "まだお店が決まっていませんか？",
    exploreDescription: "気になるカテゴリーを押すと、Naver Mapの検索結果が新しいタブで開きます。お店の名前と住所をコピーして、上の予約フォームに貼り付けてください。",
    exploreNote: "検索結果や店舗情報はNaver Map上で確認してください。",
    footer: "Booking Daijoubu · Seoul booking concierge",
    footerNotice: "予約の成立や店舗のサービス品質を保証するものではありません。医療予約には対応していません。",
  },
  en: {
    navRequest: "Request a booking",
    navExplore: "Find a place",
    quickRequestTitle: "Start a booking request",
    quickRequestText: "Enter the place and preferred time",
    quickExploreTitle: "Find somewhere to book",
    quickExploreText: "Browse popular searches on Naver Map",
    eyebrow: "Book places in Korea",
    title: "Once you choose the place, we handle the difficult part.",
    description: "Send the place name and preferred time. We contact the venue in Korean and only ask you to pay when booking is available.",
    trust: ["No Korean phone number", "Request in English", "Free until availability is confirmed"],
    formLabel: "Booking request",
    formTitle: "Enter the place you want to book",
    formDescription: "The place name is required. Adding the address helps us avoid similarly named locations and contact the correct venue.",
    category: "Booking type",
    categories: { restaurant: "Restaurant or café", hair: "Hair salon", nail: "Nail salon", beauty: "Other beauty" },
    placeName: "Place name",
    placeNamePlaceholder: "Example: Seongsu restaurant name",
    placeAddress: "Address (recommended when available)",
    placeAddressPlaceholder: "Example: 12 Example-ro, Seongdong-gu, Seoul",
    placeAddressHelp: "An address helps us distinguish venues that share the same or a similar name.",
    placeUrl: "Place URL (optional)",
    placeUrlPlaceholder: "Naver Map, Google Maps, Instagram, etc.",
    preferred: "First choice",
    alternative: "Second choice (optional)",
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
      ["1", "Request received", "We review the information you sent."],
      ["2", "Venue contacted", "We confirm availability and conditions in Korean."],
      ["3", "Pay and confirm", "Payment is requested only when the venue is available."],
    ],
    paymentLabel: "Pricing",
    paymentTitle: "Free until availability is confirmed",
    paymentText: "After the venue confirms availability, we send the service fee and any venue deposit. There is no charge when the venue is unavailable.",
    paymentItems: ["Service fee: from about ¥700", "Venue deposit: actual venue amount", "Payment: PayPal or supported cards"],
    noShow: "The service fee is non-refundable after confirmation. Venue deposits follow the venue's cancellation and no-show policy.",
    exploreLabel: "Find a place",
    exploreTitle: "Still deciding where to go?",
    exploreDescription: "Select a category to open Naver Map search results in a new tab. Copy the place name and address, then paste them into the booking form above.",
    exploreNote: "Search results and venue information are provided on Naver Map.",
    footer: "Booking Daijoubu · Seoul booking concierge",
    footerNotice: "We do not guarantee availability or venue service quality. Medical bookings are not supported.",
  },
} as const;

function naverMapSearch(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

export default function BookingHome() {
  const [language, setLanguage] = useState<Language>("ja");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.consent) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language }),
      });
      const data = (await response.json()) as { requestCode?: string; error?: string };
      if (!response.ok || !data.requestCode) throw new Error(data.error || copy.error);
      setRequestCode(data.requestCode);
      setForm(INITIAL_FORM);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <a className="booking-logo" href="/" aria-label="Booking Daijoubu home">
          <span>大</span>
          <strong>Booking Daijoubu</strong>
        </a>
        <nav className="booking-nav">
          <button className="booking-nav-action booking-nav-primary" type="button" onClick={() => scrollTo("booking-request")}>{copy.navRequest}</button>
          <button className="booking-nav-action" type="button" onClick={() => scrollTo("booking-explore")}>{copy.navExplore}</button>
          <div className="booking-language" aria-label="Language selector">
            <button className={language === "ja" ? "active" : ""} type="button" onClick={() => setLanguage("ja")}>日本語</button>
            <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
          </div>
        </nav>
      </header>

      <div className="booking-platform-shell">
        <section className="booking-quick-actions" aria-label="Quick actions">
          <button className="booking-quick-card primary" type="button" onClick={() => scrollTo("booking-request")}>
            <span className="booking-quick-icon">＋</span>
            <span><strong>{copy.quickRequestTitle}</strong><small>{copy.quickRequestText}</small></span>
            <b aria-hidden="true">→</b>
          </button>
          <button className="booking-quick-card" type="button" onClick={() => scrollTo("booking-explore")}>
            <span className="booking-quick-icon">⌕</span>
            <span><strong>{copy.quickExploreTitle}</strong><small>{copy.quickExploreText}</small></span>
            <b aria-hidden="true">→</b>
          </button>
        </section>

        <section className="booking-platform-intro">
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <div className="booking-intro-row">
            <span>{copy.description}</span>
            <div className="booking-trust-row">{copy.trust.map((item) => <small key={item}>✓ {item}</small>)}</div>
          </div>
        </section>

        <section id="booking-request" className="booking-workspace">
          <div className="booking-form-card booking-platform-card">
            <div className="booking-form-intro">
              <p>{copy.formLabel}</p>
              <h2>{copy.formTitle}</h2>
              <span>{copy.formDescription}</span>
            </div>

            {requestCode ? (
              <div className="booking-success">
                <span>✓</span>
                <h3>{copy.successTitle}</h3>
                <p>{copy.successDescription}</p>
                <div><small>{copy.requestCode}</small><strong>{requestCode}</strong></div>
                <button type="button" onClick={() => setRequestCode("")}>{copy.another}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="booking-field booking-field-wide">
                  <span>{copy.category}</span>
                  <div className="booking-category-grid">
                    {(Object.keys(copy.categories) as Category[]).map((item) => (
                      <button className={form.category === item ? "active" : ""} type="button" key={item} onClick={() => update("category", item)}>{copy.categories[item]}</button>
                    ))}
                  </div>
                </label>

                <label className="booking-field booking-field-wide">
                  <span>{copy.placeName}</span>
                  <input required value={form.placeName} onChange={(event) => update("placeName", event.target.value)} placeholder={copy.placeNamePlaceholder} maxLength={120} />
                </label>

                <label className="booking-field booking-field-wide">
                  <span>{copy.placeAddress}</span>
                  <input value={form.placeAddress} onChange={(event) => update("placeAddress", event.target.value)} placeholder={copy.placeAddressPlaceholder} maxLength={300} />
                  <small className="booking-field-help">{copy.placeAddressHelp}</small>
                </label>

                <label className="booking-field booking-field-wide">
                  <span>{copy.placeUrl}</span>
                  <input type="url" value={form.placeUrl} onChange={(event) => update("placeUrl", event.target.value)} placeholder={copy.placeUrlPlaceholder} maxLength={500} />
                </label>

                <fieldset className="booking-fieldset">
                  <legend>{copy.preferred}</legend>
                  <input aria-label={`${copy.preferred} date`} required type="date" min={minimumDate} value={form.preferredDate} onChange={(event) => update("preferredDate", event.target.value)} />
                  <input aria-label={`${copy.preferred} time`} required type="time" value={form.preferredTime} onChange={(event) => update("preferredTime", event.target.value)} />
                </fieldset>

                <fieldset className="booking-fieldset">
                  <legend>{copy.alternative}</legend>
                  <input aria-label={`${copy.alternative} date`} type="date" min={minimumDate} value={form.alternativeDate} onChange={(event) => update("alternativeDate", event.target.value)} />
                  <input aria-label={`${copy.alternative} time`} type="time" value={form.alternativeTime} onChange={(event) => update("alternativeTime", event.target.value)} />
                </fieldset>

                <label className="booking-field">
                  <span>{copy.partySize}</span>
                  <input required type="number" min="1" max="20" value={form.partySize} onChange={(event) => update("partySize", event.target.value)} />
                </label>

                <label className="booking-field booking-field-wide">
                  <span>{copy.details}</span>
                  <textarea value={form.requestDetails} onChange={(event) => update("requestDetails", event.target.value)} placeholder={copy.detailsPlaceholder} maxLength={1500} />
                </label>

                <label className="booking-field">
                  <span>{copy.name}</span>
                  <input required value={form.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder={copy.namePlaceholder} maxLength={100} />
                </label>

                <label className="booking-field">
                  <span>{copy.email}</span>
                  <input required type="email" value={form.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} placeholder="name@example.com" maxLength={180} />
                </label>

                <label className="booking-field">
                  <span>{copy.country}</span>
                  <select value={form.customerCountry} onChange={(event) => update("customerCountry", event.target.value)}>
                    <option value="JP">日本 / Japan</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="CA">Canada</option>
                    <option value="SG">Singapore</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="booking-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
                <label className="booking-consent booking-field-wide"><input required type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} /><span>{copy.consent}</span></label>
                {error && <p className="booking-error" role="alert">{error}</p>}
                <button className="booking-submit booking-field-wide" disabled={submitting || !form.consent} type="submit">{submitting ? copy.submitting : copy.submit}</button>
              </form>
            )}
          </div>

          <aside className="booking-side-rail">
            <section className="booking-platform-card booking-process-card">
              <p className="booking-card-label">{copy.processLabel}</p>
              <h2>{copy.processTitle}</h2>
              <ol>
                {copy.timeline.map(([number, title, description]) => (
                  <li key={number}><span>{number}</span><div><strong>{title}</strong><small>{description}</small></div></li>
                ))}
              </ol>
            </section>

            <section className="booking-platform-card booking-payment-card">
              <p className="booking-card-label">{copy.paymentLabel}</p>
              <h2>{copy.paymentTitle}</h2>
              <p>{copy.paymentText}</p>
              <ul>{copy.paymentItems.map((item) => <li key={item}>✓ {item}</li>)}</ul>
              <small className="booking-noshow-note">{copy.noShow}</small>
            </section>
          </aside>
        </section>
      </div>

      <section id="booking-explore" className="booking-discovery">
        <div className="booking-discovery-heading">
          <p>{copy.exploreLabel}</p>
          <h2>{copy.exploreTitle}</h2>
          <span>{copy.exploreDescription}</span>
        </div>

        <div className="booking-marquee" aria-label={copy.exploreLabel}>
          {discoveryRows.map((row, rowIndex) => (
            <div className={`booking-marquee-lane ${rowIndex === 1 ? "reverse" : ""}`} key={rowIndex}>
              <div className="booking-marquee-track">
                {[...row, ...row].map((item, index) => (
                  <a
                    key={`${item.query}-${index}`}
                    href={naverMapSearch(item.query)}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-hidden={index >= row.length}
                    tabIndex={index >= row.length ? -1 : 0}
                    onClick={() => update("category", item.category)}
                  >
                    <span>{item.icon}</span>
                    <strong>{item.label}</strong>
                    <b aria-hidden="true">↗</b>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <small className="booking-explore-note">{copy.exploreNote}</small>
      </section>

      <footer className="booking-footer"><strong>{copy.footer}</strong><p>{copy.footerNotice}</p></footer>
    </main>
  );
}
