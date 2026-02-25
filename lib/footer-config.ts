// ─── Enterprise Footer Config ──────────────────────────────────────────────
// CMS-driven config. In production this would be fetched from a headless CMS
// (Contentful / Sanity) or a DB. Tenant overrides are merged on top.

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  badge?: string; // e.g. "New"
}

export interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface FooterRegionConfig {
  region: "global" | "eu" | "in" | "us";
  label: string;
  flag: string;
}

export interface FooterConfig {
  brand: {
    name: string;
    tagline: string;
    logoText: string;
  };
  sections: FooterSection[];
  social: FooterSocialLinks;
  newsletter: {
    enabled: boolean;
    gdprRequired: boolean;
    placeholder: string;
    successMessage: string;
  };
  legalLinks: FooterLink[];
  statusPageUrl: string;
  trustCenterUrl: string;
  regions: FooterRegionConfig[];
  currentYear: number;
}

// ─── Base Global Config ────────────────────────────────────────────────────
const BASE_CONFIG: FooterConfig = {
  brand: {
    name: "Life Meeting",
    tagline:
      "The world's most advanced video conferencing platform. Crystal clear, secure, and powered by AI.",
    logoText: "Life Meeting",
  },
  sections: [
    {
      id: "product",
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Enterprise", href: "/enterprise" },
        { label: "Security", href: "/security" },
        { label: "Changelog", href: "/changelog" },
        { label: "API Docs", href: "/developers", badge: "New" },
        { label: "Status", href: "https://status.lifemeeting.com", external: true },
      ],
    },
    {
      id: "company",
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Press", href: "/press" },
        { label: "Contact", href: "/contact" },
        { label: "Investors", href: "/investors" },
      ],
    },
    {
      id: "resources",
      title: "Resources",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Community", href: "/community" },
        { label: "Webinars", href: "/webinars" },
        { label: "Trust Center", href: "/trust" },
        { label: "Accessibility", href: "/accessibility" },
        { label: "Subprocessors", href: "/subprocessors" },
      ],
    },
    {
      id: "legal",
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookie-policy" },
        { label: "DPA", href: "/dpa" },
        { label: "Acceptable Use", href: "/acceptable-use" },
        { label: "Security Policy", href: "/security" },
      ],
    },
  ],
  social: {
    twitter: "https://twitter.com/lifemeeting",
    github: "https://github.com/lifemeeting",
    linkedin: "https://linkedin.com/company/lifemeeting",
    instagram: "https://instagram.com/lifemeeting",
    youtube: "https://youtube.com/lifemeeting",
  },
  newsletter: {
    enabled: true,
    gdprRequired: true,
    placeholder: "Enter your work email",
    successMessage:
      "Please check your inbox to confirm your subscription.",
  },
  legalLinks: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookie-policy" },
    { label: "DPA", href: "/dpa" },
    { label: "Acceptable Use", href: "/acceptable-use" },
  ],
  statusPageUrl: "https://status.lifemeeting.com",
  trustCenterUrl: "https://trust.lifemeeting.com",
  regions: [
    { region: "global", label: "Global", flag: "🌍" },
    { region: "us", label: "United States", flag: "🇺🇸" },
    { region: "eu", label: "European Union", flag: "🇪🇺" },
    { region: "in", label: "India", flag: "🇮🇳" },
  ],
  currentYear: new Date().getFullYear(),
};

// ─── Region Overrides ────────────────────────────────────────────────────────
const REGION_OVERRIDES: Partial<Record<string, Partial<FooterConfig>>> = {
  eu: {
    newsletter: {
      enabled: true,
      gdprRequired: true,
      placeholder: "Enter your work email",
      successMessage: "Please confirm via the email we sent you. (EU GDPR)",
    },
  },
};

// ─── Tenant White-Label Overrides ────────────────────────────────────────────
const TENANT_OVERRIDES: Record<string, Partial<FooterConfig>> = {
  // example: "acme-corp" tenant provides their own branding
  // "acme-corp": { brand: { name: "Acme Meetings", ... } }
};

// ─── Public API ───────────────────────────────────────────────────────────────
export function getFooterConfig(
  region: string = "global",
  tenantId?: string
): FooterConfig {
  const regionOverride = REGION_OVERRIDES[region] ?? {};
  const tenantOverride = tenantId ? (TENANT_OVERRIDES[tenantId] ?? {}) : {};

  return {
    ...BASE_CONFIG,
    ...regionOverride,
    ...tenantOverride,
    newsletter: {
      ...BASE_CONFIG.newsletter,
      ...(regionOverride.newsletter ?? {}),
      ...(tenantOverride.newsletter ?? {}),
    },
    brand: {
      ...BASE_CONFIG.brand,
      ...(tenantOverride.brand ?? {}),
    },
  };
}
