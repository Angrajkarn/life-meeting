// ─── Footer i18n String Map ────────────────────────────────────────────────
// Production: replace with next-intl or i18next. This is a zero-dependency
// static map suitable for a Next.js 16 Server Component.

export type SupportedLocale = "en" | "hi" | "de" | "fr";

export interface FooterI18nStrings {
  stay_updated: string;
  newsletter_desc: string;
  subscribe: string;
  gdpr_consent: string;
  email_placeholder: string;
  copyright: (year: number, company: string) => string;
  all_rights: string;
  region_select: string;
  status_operational: string;
  status_degraded: string;
  status_outage: string;
  cookie_banner_text: string;
  accept_all: string;
  reject_all: string;
  manage_prefs: string;
  close: string;
  verify_email_sent: string;
  subscribe_error: string;
  invalid_email: string;
  gdpr_required: string;
  rate_limited: string;
}

const strings: Record<SupportedLocale, FooterI18nStrings> = {
  en: {
    stay_updated: "Stay Updated",
    newsletter_desc:
      "Get the latest product updates, security advisories, and enterprise insights.",
    subscribe: "Subscribe",
    gdpr_consent:
      "I agree to receive marketing communications. I can unsubscribe at any time.",
    email_placeholder: "Enter your work email",
    copyright: (year, company) => `© ${year} ${company} Inc. All rights reserved.`,
    all_rights: "All rights reserved.",
    region_select: "Select Region",
    status_operational: "All systems operational",
    status_degraded: "Degraded performance",
    status_outage: "System outage",
    cookie_banner_text:
      "We use cookies to enhance your experience, analyse traffic, and for security. See our Cookie Policy.",
    accept_all: "Accept All",
    reject_all: "Reject All",
    manage_prefs: "Manage Preferences",
    close: "Close",
    verify_email_sent: "Check your inbox to confirm subscription.",
    subscribe_error: "Something went wrong. Please try again.",
    invalid_email: "Please enter a valid email address.",
    gdpr_required: "You must accept the consent to subscribe.",
    rate_limited: "Too many attempts. Please try again later.",
  },
  hi: {
    stay_updated: "अपडेट रहें",
    newsletter_desc:
      "नवीनतम उत्पाद अपडेट, सुरक्षा सूचनाएं और एंटरप्राइज़ जानकारी प्राप्त करें।",
    subscribe: "सदस्यता लें",
    gdpr_consent:
      "मैं मार्केटिंग संचार प्राप्त करने के लिए सहमत हूं। मैं किसी भी समय सदस्यता रद्द कर सकता हूं।",
    email_placeholder: "अपना कार्य ईमेल दर्ज करें",
    copyright: (year, company) => `© ${year} ${company} Inc. सर्वाधिकार सुरक्षित।`,
    all_rights: "सर्वाधिकार सुरक्षित।",
    region_select: "क्षेत्र चुनें",
    status_operational: "सभी सिस्टम चालू हैं",
    status_degraded: "प्रदर्शन में गिरावट",
    status_outage: "सिस्टम बाधित",
    cookie_banner_text:
      "हम आपके अनुभव को बेहतर बनाने के लिए कुकीज़ का उपयोग करते हैं। हमारी कुकी नीति देखें।",
    accept_all: "सभी स्वीकार करें",
    reject_all: "सभी अस्वीकार करें",
    manage_prefs: "प्राथमिकताएं प्रबंधित करें",
    close: "बंद करें",
    verify_email_sent: "सदस्यता की पुष्टि के लिए अपना इनबॉक्स जांचें।",
    subscribe_error: "कुछ गलत हुआ। कृपया पुनः प्रयास करें।",
    invalid_email: "कृपया एक वैध ईमेल पता दर्ज करें।",
    gdpr_required: "सदस्यता लेने के लिए आपको सहमति देनी होगी।",
    rate_limited: "बहुत अधिक प्रयास। कृपया बाद में पुनः प्रयास करें।",
  },
  de: {
    stay_updated: "Auf dem Laufenden bleiben",
    newsletter_desc:
      "Erhalten Sie die neuesten Produktupdates, Sicherheitshinweise und Enterprise-Einblicke.",
    subscribe: "Abonnieren",
    gdpr_consent:
      "Ich stimme dem Erhalt von Marketingkommunikation zu. Ich kann mich jederzeit abmelden.",
    email_placeholder: "Geschäftliche E-Mail eingeben",
    copyright: (year, company) => `© ${year} ${company} Inc. Alle Rechte vorbehalten.`,
    all_rights: "Alle Rechte vorbehalten.",
    region_select: "Region auswählen",
    status_operational: "Alle Systeme betriebsbereit",
    status_degraded: "Eingeschränkte Leistung",
    status_outage: "Systemausfall",
    cookie_banner_text:
      "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und den Datenverkehr zu analysieren. Sehen Sie unsere Cookie-Richtlinie.",
    accept_all: "Alle akzeptieren",
    reject_all: "Alle ablehnen",
    manage_prefs: "Einstellungen verwalten",
    close: "Schließen",
    verify_email_sent: "Bitte überprüfen Sie Ihren Posteingang zur Bestätigung.",
    subscribe_error: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    invalid_email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    gdpr_required: "Sie müssen der Einwilligung zustimmen, um sich anzumelden.",
    rate_limited: "Zu viele Versuche. Bitte versuchen Sie es später erneut.",
  },
  fr: {
    stay_updated: "Restez informé",
    newsletter_desc:
      "Recevez les dernières mises à jour produit, avis de sécurité et informations entreprise.",
    subscribe: "S'abonner",
    gdpr_consent:
      "J'accepte de recevoir des communications marketing. Je peux me désabonner à tout moment.",
    email_placeholder: "Entrez votre email professionnel",
    copyright: (year, company) => `© ${year} ${company} Inc. Tous droits réservés.`,
    all_rights: "Tous droits réservés.",
    region_select: "Sélectionner la région",
    status_operational: "Tous les systèmes opérationnels",
    status_degraded: "Performance dégradée",
    status_outage: "Panne système",
    cookie_banner_text:
      "Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic. Voir notre politique de cookies.",
    accept_all: "Tout accepter",
    reject_all: "Tout refuser",
    manage_prefs: "Gérer les préférences",
    close: "Fermer",
    verify_email_sent: "Vérifiez votre boîte mail pour confirmer l'abonnement.",
    subscribe_error: "Une erreur s'est produite. Veuillez réessayer.",
    invalid_email: "Veuillez entrer une adresse email valide.",
    gdpr_required: "Vous devez accepter le consentement pour vous abonner.",
    rate_limited: "Trop de tentatives. Veuillez réessayer plus tard.",
  },
};

export function getFooterStrings(locale: string = "en"): FooterI18nStrings {
  return strings[(locale as SupportedLocale) in strings ? (locale as SupportedLocale) : "en"];
}
