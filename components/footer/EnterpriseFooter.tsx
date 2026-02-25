// EnterpriseFooter — Next.js Server Component (SSR)
// Renders the full footer at request-time for SEO. Client sub-components are
// imported with "use client" inside their own files.

import React from "react";
import Link from "next/link";
import { getFooterConfig } from "@/lib/footer-config";
import { FooterLinksSection } from "./FooterLinksSection";
import { FooterNewsletterForm } from "./FooterNewsletterForm";
import { FooterSocialLinks } from "./FooterSocialLinks";
import { FooterStatusBadge } from "./FooterStatusBadge";
import { FooterStructuredData } from "./FooterStructuredData";
import { CookieConsent } from "./CookieConsent";
import { Logo } from "@/components/logo";
import { Shield, Lock, Award } from "lucide-react";

interface Props {
  region?: string;
  locale?: string;
  tenantId?: string;
}

export function EnterpriseFooter({
  region = "global",
  locale = "en",
  tenantId,
}: Props) {
  const config = getFooterConfig(region, tenantId);
  const year = new Date().getFullYear();

  // Split sections into two groups: 4 link columns + newsletter gets its own column
  const linkSections = config.sections.slice(0, 4);

  return (
    <>
      {/* ── JSON-LD Structured Data (SSR injected into <head>) ── */}
      <FooterStructuredData config={config} />

      {/* ── Cookie Consent (client, portal-rendered) ── */}
      <CookieConsent />

      <footer
        className="relative bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/80"
        aria-label="Site footer"
        itemScope
        itemType="https://schema.org/WPFooter"
      >
        {/* ── Gradient accent bar ── */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />

        <div className="container mx-auto px-6 py-16 max-w-7xl">

          {/* ─── Top Grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-12">

            {/* Brand Column (spans 2 cols on xl) */}
            <div className="xl:col-span-2 space-y-6">
              <Link href="/" className="flex items-center gap-2 group w-fit">
                <Logo showText={true} textClassName="text-slate-900 font-black" />
              </Link>

              <p className="text-sm text-slate-500 leading-relaxed max-w-[220px]">
                {config.brand.tagline}
              </p>

              {/* Social Links */}
              <FooterSocialLinks social={config.social} />

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: Shield, label: "SOC 2 Type II" },
                  { icon: Lock, label: "GDPR Compliant" },
                  { icon: Award, label: "ISO 27001" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600"
                  >
                    <Icon className="w-3 h-3 text-indigo-500" />
                    {label}
                  </div>
                ))}
              </div>

              {/* System Status */}
              <FooterStatusBadge />
            </div>

            {/* Dynamic Link Sections (4 columns) */}
            <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
              <FooterLinksSection sections={linkSections} />
            </div>

            {/* Newsletter Column */}
            <div className="xl:col-span-2 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">
                  Stay Updated
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Get product updates, security advisories, and enterprise insights.
                  No spam, ever.
                </p>
              </div>

              <FooterNewsletterForm
                gdprRequired={config.newsletter.gdprRequired}
                placeholder={config.newsletter.placeholder}
                successMessage={config.newsletter.successMessage}
                source="landing_footer"
              />

              {/* Language / Region selector */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Region:</span>
                {config.regions.map((r) => (
                  <a
                    key={r.region}
                    href={`?region=${r.region}`}
                    title={r.label}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      r.region === region
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {r.flag} {r.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Divider ────────────────────────────────────────────── */}
          <div className="mt-14 pt-8 border-t border-slate-200/80">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">

              {/* Copyright + Certifications */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-xs text-slate-500">
                  © {year} {config.brand.name} Inc. All rights reserved.
                </p>
                <div className="hidden sm:block w-px h-3 bg-slate-300" />
                <p className="text-xs text-slate-400">
                  Trusted by 50M+ users in 190+ countries
                </p>
              </div>

              {/* Legal Links */}
              <nav aria-label="Legal navigation">
                <ul className="flex items-center flex-wrap gap-x-5 gap-y-2">
                  {config.legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a
                      href={config.trustCenterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Trust Center ↗
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
