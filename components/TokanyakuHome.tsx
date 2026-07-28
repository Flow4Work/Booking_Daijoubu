"use client";

import { FormEvent, useMemo, useState } from "react";

type Language = "ja" | "en";
type Category = "restaurant" | "hair" | "nail" | "beauty";

type FormState = {
  category: Category;
  placeName: string;
  placeUrl: string;
  placeAddress: string;
  preferredDate: string;
  preferredTime: string;
  partySize: string;
  requestDetails: string;
  customerEmail: string;
  consent: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  category: "restaurant",
  placeName: "",
  placeUrl: "",
  placeAddress: "",
  preferredDate: "",
  preferredTime: "19:00",
  partySize: "2",
  requestDetails: "",
  customerEmail: "",
  consent: false,
  website: "",
};

const COPY = {
  ja: {
    request: "予約を依頼する",
    explore: "お店を探す",
    title: "韓国のお店予約を、もっと簡単に。",
    description: "InstagramやNaver Mapで見つけたお店もOK。お店・日時・人数を送れば、まず無料で空席を確認します。",
    formLabel: "予約リクエスト",
    formTitle: "まず3つだけ教えてください",
    formDescription: "お店、希望日時、人数。連絡先や細かい希望は次の画面で入力できます。",
    category: "予約の種類",
    categories: {
      restaurant: "飲食店・カフェ",
      hair: "ヘアサロン",
      nail: "ネイル",
      beauty: "その他",
    },
    place: "お店",
    placeName: "お店の名前",
    placeNamePlaceholder: "例：ソンス○○食堂",
    placeUrl: "お店のURL",
    placeUrlPlaceholder: "Instagram / Naver Map / Google Maps のURL",
    placeHelp: "名前かURLのどちらか一方だけでも大丈夫です。Instagramで見つけた投稿URLもそのまま送れます。",
    preferred: "希望日時",
    partySize: "人数",
    next: "次へ：連絡先を入力",
    back: "戻る",
    detailsTitle: "あと少しで完了です",
    detailsDescription: "空席確認の結果を受け取るメールアドレスを入力してください。",
    address: "住所（任意）",
    addressPlaceholder: "同名店舗がある場合におすすめ",
    notes: "希望・注意事項（任意）",
    notesPlaceholder: "アレルギー、希望メニュー、ヘアスタイル、予算など",
    email: "メールアドレス",
    consent: "予約条件、キャンセル・ノーショー規定、個人情報の利用に同意します。",
    submit: "無料で空席確認を依頼する",
    submitting: "送信中…",
    free: "空席確認までは無料",
    freeText: "予約できる場合だけ、代行手数料と店舗予約金をご案内します。",
    process: ["無料で空席確認", "金額と条件をご案内", "支払い後に予約確定"],
    fee: "代行手数料：目安 ¥700〜",
    deposit: "店舗予約金：店舗が求める実費",
    successTitle: "リクエストを受け付けました",
    successText: "店舗へ空席と予約条件を確認します。確認結果はメールでご案内します。",
    requestCode: "受付番号",
    another: "別の予約を依頼する",
    requiredError: "お店、日時、人数を確認してください。",
    emailError: "メールアドレスを確認してください。",
    consentError: "同意が必要です。",
    submitError: "送信できませんでした。もう一度お試しください。",
    exploreTitle: "まだお店が決まっていませんか？",
    exploreText: "気になるカテゴリーから探して、そのまま予約リクエストへ。",
    footer: "Tokanyaku · Seoul booking concierge",
  },
  en: {
    request: "Request booking",
    explore: "Find a place",
    title: "Book places in Korea, without the hassle.",
    description: "Found it on Instagram or Naver Map? Send the place, time, and group size. We check availability for free first.",
    formLabel: "Booking request",
    formTitle: "Start with just 3 things",
    formDescription: "Place, preferred time, and group size. Contact details and special requests come next.",
    category: "Booking type",
    categories: {
      restaurant: "Restaurant / café",
      hair: "Hair salon",
      nail: "Nail salon",
      beauty: "Other",
    },
    place: "Place",
    placeName: "Place name",
    placeNamePlaceholder: "Example: Seongsu restaurant name",
    placeUrl: "Place URL",
    placeUrlPlaceholder: "Instagram / Naver Map / Google Maps URL",
    placeHelp: "A name or a URL is enough to start. You can paste the Instagram post where you found the place.",
    preferred: "Preferred date and time",
    partySize: "Guests",
    next: "Next: contact details",
    back: "Back",
    detailsTitle: "Almost done",
    detailsDescription: "Enter the email where you want to receive the availability result.",
    address: "Address (optional)",
    addressPlaceholder: "Useful when places have similar names",
    notes: "Requests and notes (optional)",
    notesPlaceholder: "Allergies, menu requests, hairstyle, budget, or other details",
    email: "Email",
    consent: "I agree to the booking, cancellation, no-show, and privacy terms.",
    submit: "Check availability for free",
    submitting: "Sending…",
    free: "Free until availability is confirmed",
    freeText: "You only receive the service fee and venue deposit details if the venue can accept the booking.",
    process: ["Free availability check", "Review price and terms", "Booking confirmed after payment"],
    fee: "Service fee: from approximately JPY 700",
    deposit: "Venue deposit: actual amount required by the venue",
    successTitle: "Request received",
    successText: "We’ll check availability and booking terms with the venue and email you the result.",
    requestCode: "Request code",
    another: "Request another booking",
    requiredError: "Check the place, date, time, and group size.",
    emailError: "Check your email address.",
    consentError: "Agreement is required.",
    submitError: "We could not send your request. Please try again.",
    exploreTitle: "Still deciding where to go?",
    exploreText: "Browse a category, find a place, then send a booking request.",
    footer: "Tokanyaku · Seoul booking concierge",
  },
} as const;

const CONCERNS = {
  ja: [
    ["📱", "韓国の電話番号がない"],
    ["🗣️", "韓国語で予約できない"],
    ["🔐", "韓国の本人認証ができない"],
    ["💳", "海外カードが使えない"],
    ["☎️", "お店に電話できない"],
    ["💰", "予約金の支払い方がわからない"],
    ["🙌", "Tokanyakuに任せれば大丈夫"],
  ],
  en: [
    ["📱", "No Korean phone number"],
    ["🗣️", "Can’t book in Korean"],
    ["🔐", "No Korean identity verification"],
    ["💳", "International card rejected"],
    ["☎️", "Can’t call the venue"],
    ["💰", "Not sure how to pay the deposit"],
    ["🙌", "Let Tokanyaku handle it"],
  ],
} as const;

const DISCOVERY = {
  ja: [
    ["☕", "ソンスのカフェ", "ソンス カフェ"],
    ["🍜", "ホンデの人気店", "ホンデ 人気 レストラン"],
    ["🍲", "韓国料理", "ソウル 韓国料理"],
    ["🥩", "韓国焼肉", "ソウル 韓国焼肉"],
    ["🥐", "ベーカリー", "ソウル ベーカリー"],
    ["🥗", "ベジタリアン", "ソウル ベジタリアン レストラン"],
    ["✂️", "ヘアサロン", "ソウル ヘアサロン"],
    ["💅", "ネイルサロン", "ソウル ネイルサロン"],
    ["✨", "スキンケア", "ソウル スキンケア"],
    ["💄", "メイクアップ", "ソウル メイクアップサロン"],
    ["🌿", "スパ・マッサージ", "ソウル スパ マッサージ"],
    ["🍸", "ルーフトップバー", "ソウル ルーフトップバー"],
  ],
  en: [
    ["☕", "Seongsu cafés", "Seongsu cafe"],
    ["🍜", "Hongdae restaurants", "Hongdae popular restaurants"],
    ["🍲", "Korean food", "Seoul Korean food"],
    ["🥩", "Korean BBQ", "Seoul Korean BBQ"],
    ["🥐", "Bakeries", "Seoul bakery"],
    ["🥗", "Vegetarian food", "Seoul vegetarian restaurant"],
    ["✂️", "Hair salons", "Seoul hair salon"],
    ["💅", "Nail salons", "Seoul nail salon"],
    ["✨", "Skin care", "Seoul skin care"],
    ["💄", "Makeup studios", "Seoul makeup studio"],
    ["🌿", "Spa & massage", "Seoul spa massage"],
    ["🍸", "Rooftop bars", "Seoul rooftop bar"],
  ],
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function naverMapSearch(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

export default function TokanyakuHome() {
  const [language, setLanguage] = useState<Language>("ja");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const copy = COPY[language];
  const discovery = DISCOVERY[language];
  const discoveryTop = discovery.slice(0, 6);
  const discoveryBottom = discovery.slice(6);

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

  function primaryValid() {
    const partySize = Number(form.partySize);
    return Boolean(
      (form.placeName.trim() || form.placeUrl.trim()) &&
        form.preferredDate &&
        form.preferredTime &&
        form.preferredDate >= minimumDate &&
        Number.isInteger(partySize) &&
        partySize >= 1 &&
        partySize <= 20,
    );
  }

  function continueToContact() {
    setError("");
    if (!primaryValid()) {
      setError(copy.requiredError);
      return;
    }
    setStep(2);
    requestAnimationFrame(() => {
      document.getElementById("booking-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!primaryValid()) {
      setStep(1);
      setError(copy.requiredError);
      return;
    }
    if (!EMAIL_PATTERN.test(form.customerEmail.trim())) {
      setError(copy.emailError);
      return;
    }
    if (!form.consent) {
      setError(copy.consentError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language }),
      });
      const data = (await response.json()) as { requestCode?: string; error?: string };
      if (!response.ok || !data.requestCode) throw new Error(data.error || copy.submitError);
      setRequestCode(data.requestCode);
      setForm(INITIAL_FORM);
      setStep(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="tokanyaku-page">
      <style>{`
        .tokanyaku-concern-strip{width:100%;overflow:hidden;border-bottom:1px solid #edf0f2;background:#fff;mask-image:linear-gradient(to right,transparent,#000 5%,#000 95%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 5%,#000 95%,transparent)}
        .tokanyaku-concern-track{display:flex;align-items:center;gap:8px;width:max-content;padding:7px 0;animation:tokConcernScroll 20s linear infinite;will-change:transform}
        .tokanyaku-concern-track:hover{animation-play-state:paused}
        .tokanyaku-concern-chip{display:inline-flex;align-items:center;gap:6px;min-height:31px;padding:0 12px;border:1px solid #e5e8eb;border-radius:999px;background:#fff;color:#4e5968;font-size:10.5px;font-weight:680;white-space:nowrap;box-shadow:0 3px 10px rgba(0,27,55,.025)}
        .tokanyaku-concern-chip b{font-size:13px}
        .tokanyaku-concern-chip.tokanyaku-solution{border-color:#cfe1ff;background:#f2f7ff;color:#1b64da;font-weight:760}
        @keyframes tokConcernScroll{to{transform:translateX(-50%)}}

        .tokanyaku-explore-marquee{display:grid;gap:8px;min-width:0;overflow:hidden}
        .tokanyaku-marquee-lane{overflow:hidden;mask-image:linear-gradient(to right,transparent,#000 5%,#000 95%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 5%,#000 95%,transparent)}
        .tokanyaku-marquee-track{display:flex;gap:8px;width:max-content;padding:2px 4px;animation:tokExploreScroll 23s linear infinite;will-change:transform}
        .tokanyaku-marquee-lane.reverse .tokanyaku-marquee-track{animation-direction:reverse;animation-duration:26s}
        .tokanyaku-marquee-track:hover,.tokanyaku-marquee-track:focus-within{animation-play-state:paused}
        .tokanyaku-marquee-track a{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 12px;border:1px solid #e5e8eb;border-radius:12px;background:#fff;white-space:nowrap;box-shadow:0 4px 12px rgba(0,27,55,.035);transition:border-color .12s ease,transform .12s ease,box-shadow .12s ease}
        .tokanyaku-marquee-track a:hover{transform:translateY(-1px);border-color:#a9cbff;box-shadow:0 7px 17px rgba(49,130,246,.08)}
        .tokanyaku-marquee-track a>span{font-size:15px}
        .tokanyaku-marquee-track a strong{font-size:10.5px;font-weight:740}
        .tokanyaku-marquee-track a b{color:#8b95a1;font-size:10px}
        @keyframes tokExploreScroll{to{transform:translateX(-50%)}}

        @media(max-width:720px){
          .tokanyaku-concern-strip{mask-image:none;-webkit-mask-image:none}
          .tokanyaku-concern-track{gap:6px;padding:6px 0;animation-duration:17s}
          .tokanyaku-concern-chip{min-height:29px;padding:0 10px;font-size:10px}
          .tokanyaku-concern-chip b{font-size:12px}
          .tokanyaku-marquee-lane{mask-image:none;-webkit-mask-image:none}
          .tokanyaku-marquee-track{animation-duration:19s}
          .tokanyaku-marquee-lane.reverse .tokanyaku-marquee-track{animation-duration:22s}
          .tokanyaku-marquee-track a{min-height:40px;padding:0 11px}
          .tokanyaku-marquee-track a strong{font-size:10px}
        }
        @media(prefers-reduced-motion:reduce){
          .tokanyaku-concern-strip,.tokanyaku-marquee-lane{overflow-x:auto;mask-image:none;-webkit-mask-image:none}
          .tokanyaku-concern-track,.tokanyaku-marquee-track{animation:none}
          .tokanyaku-concern-chip[aria-hidden="true"],.tokanyaku-marquee-track a[aria-hidden="true"]{display:none}
        }
      `}</style>

      <header className="tokanyaku-header">
        <a className="tokanyaku-logo" href="/" aria-label="Tokanyaku home">
          <span>渡</span>
          <strong>Tokanyaku</strong>
        </a>
        <nav>
          <button className="tokanyaku-primary-nav" type="button" onClick={() => document.getElementById("booking-request")?.scrollIntoView({ behavior: "smooth" })}>
            {copy.request}
          </button>
          <button className="tokanyaku-explore-nav" type="button" onClick={() => document.getElementById("booking-explore")?.scrollIntoView({ behavior: "smooth" })}>
            {copy.explore}
          </button>
          <div className="tokanyaku-language" aria-label="Language selector">
            <button className={language === "ja" ? "active" : ""} type="button" onClick={() => setLanguage("ja")}>日本語</button>
            <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
          </div>
        </nav>
      </header>

      <section className="tokanyaku-concern-strip" aria-label="Booking concerns">
        <div className="tokanyaku-concern-track">
          {[...CONCERNS[language], ...CONCERNS[language]].map(([icon, label], index) => (
            <span
              className={`tokanyaku-concern-chip ${index % CONCERNS[language].length === CONCERNS[language].length - 1 ? "tokanyaku-solution" : ""}`}
              key={`${label}-${index}`}
              aria-hidden={index >= CONCERNS[language].length}
            >
              <b>{icon}</b>{label}
            </span>
          ))}
        </div>
      </section>

      <section className="tokanyaku-hero">
        <div>
          <span className="tokanyaku-eyebrow">KOREA BOOKING CONCIERGE</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
      </section>

      <section id="booking-request" className="tokanyaku-shell tokanyaku-booking-layout">
        <section className="tokanyaku-card tokanyaku-form-card">
          {requestCode ? (
            <div className="tokanyaku-success">
              <span>✓</span>
              <h2>{copy.successTitle}</h2>
              <p>{copy.successText}</p>
              <div><small>{copy.requestCode}</small><strong>{requestCode}</strong></div>
              <button type="button" onClick={() => setRequestCode("")}>{copy.another}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="tokanyaku-form-heading">
                <span>{copy.formLabel}</span>
                <h2>{step === 1 ? copy.formTitle : copy.detailsTitle}</h2>
                <p>{step === 1 ? copy.formDescription : copy.detailsDescription}</p>
              </div>

              <div className="tokanyaku-steps" aria-label="Booking progress">
                <span className="active">1</span><i /><span className={step === 2 ? "active" : ""}>2</span>
              </div>

              {step === 1 ? (
                <div className="tokanyaku-step-grid">
                  <fieldset className="tokanyaku-field tokanyaku-full">
                    <legend>{copy.category}</legend>
                    <div className="tokanyaku-category-grid">
                      {(Object.keys(copy.categories) as Category[]).map((category) => (
                        <button key={category} className={form.category === category ? "active" : ""} type="button" onClick={() => update("category", category)}>
                          {copy.categories[category]}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="tokanyaku-place-group tokanyaku-full">
                    <span className="tokanyaku-group-label">{copy.place}</span>
                    <label className="tokanyaku-field">
                      <span>{copy.placeUrl}</span>
                      <input type="url" inputMode="url" value={form.placeUrl} onChange={(event) => update("placeUrl", event.target.value)} placeholder={copy.placeUrlPlaceholder} maxLength={500} />
                    </label>
                    <label className="tokanyaku-field">
                      <span>{copy.placeName}</span>
                      <input value={form.placeName} onChange={(event) => update("placeName", event.target.value)} placeholder={copy.placeNamePlaceholder} maxLength={120} />
                    </label>
                    <small>{copy.placeHelp}</small>
                  </div>

                  <label className="tokanyaku-field">
                    <span>{copy.preferred}</span>
                    <div className="tokanyaku-date-time">
                      <input type="date" min={minimumDate} value={form.preferredDate} onChange={(event) => update("preferredDate", event.target.value)} />
                      <input type="time" value={form.preferredTime} onChange={(event) => update("preferredTime", event.target.value)} />
                    </div>
                  </label>

                  <label className="tokanyaku-field">
                    <span>{copy.partySize}</span>
                    <input type="number" min="1" max="20" inputMode="numeric" value={form.partySize} onChange={(event) => update("partySize", event.target.value)} />
                  </label>

                  {error && <p className="tokanyaku-error tokanyaku-full">{error}</p>}
                  <button className="tokanyaku-submit tokanyaku-full" type="button" onClick={continueToContact}>{copy.next}</button>
                </div>
              ) : (
                <div className="tokanyaku-step-grid">
                  <label className="tokanyaku-field tokanyaku-full">
                    <span>{copy.address}</span>
                    <input value={form.placeAddress} onChange={(event) => update("placeAddress", event.target.value)} placeholder={copy.addressPlaceholder} maxLength={300} />
                  </label>
                  <label className="tokanyaku-field tokanyaku-full">
                    <span>{copy.notes}</span>
                    <textarea value={form.requestDetails} onChange={(event) => update("requestDetails", event.target.value)} placeholder={copy.notesPlaceholder} maxLength={1500} />
                  </label>
                  <label className="tokanyaku-field tokanyaku-full">
                    <span>{copy.email}</span>
                    <input type="email" autoComplete="email" value={form.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} placeholder="name@example.com" maxLength={180} />
                  </label>
                  <label className="tokanyaku-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
                  <label className="tokanyaku-consent tokanyaku-full">
                    <input type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} />
                    <span>{copy.consent}</span>
                  </label>
                  {error && <p className="tokanyaku-error tokanyaku-full">{error}</p>}
                  <div className="tokanyaku-actions tokanyaku-full">
                    <button className="tokanyaku-back" type="button" onClick={() => { setError(""); setStep(1); }}>{copy.back}</button>
                    <button className="tokanyaku-submit" disabled={submitting} type="submit">{submitting ? copy.submitting : copy.submit}</button>
                  </div>
                </div>
              )}
            </form>
          )}
        </section>

        <aside className="tokanyaku-side">
          <section className="tokanyaku-card tokanyaku-trust-card">
            <span>{copy.free}</span>
            <p>{copy.freeText}</p>
            <ol>{copy.process.map((item, index) => <li key={item}><b>{index + 1}</b><strong>{item}</strong></li>)}</ol>
          </section>
          <section className="tokanyaku-card tokanyaku-price-card">
            <span>PRICE</span>
            <strong>{copy.fee}</strong>
            <strong>{copy.deposit}</strong>
          </section>
        </aside>
      </section>

      <section id="booking-explore" className="tokanyaku-shell tokanyaku-card tokanyaku-explore">
        <div>
          <span>EXPLORE</span>
          <h2>{copy.exploreTitle}</h2>
          <p>{copy.exploreText}</p>
        </div>
        <div className="tokanyaku-explore-marquee">
          {[discoveryTop, discoveryBottom].map((lane, laneIndex) => (
            <div className={`tokanyaku-marquee-lane ${laneIndex === 1 ? "reverse" : ""}`} key={laneIndex}>
              <div className="tokanyaku-marquee-track">
                {[...lane, ...lane].map(([icon, label, query], index) => (
                  <a
                    key={`${query}-${index}`}
                    href={naverMapSearch(query)}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-hidden={index >= lane.length}
                    tabIndex={index >= lane.length ? -1 : 0}
                  >
                    <span>{icon}</span><strong>{label}</strong><b>↗</b>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="tokanyaku-footer">{copy.footer}</footer>
    </main>
  );
}
