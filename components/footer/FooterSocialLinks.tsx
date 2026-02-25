"use client";

import React from "react";
import { Twitter, Github, Linkedin, Instagram, Youtube } from "lucide-react";
import { FooterSocialLinks as SocialConfig } from "@/lib/footer-config";

interface Props {
  social: SocialConfig;
}

const ICON_MAP = {
  twitter: { Icon: Twitter, label: "Twitter / X" },
  github: { Icon: Github, label: "GitHub" },
  linkedin: { Icon: Linkedin, label: "LinkedIn" },
  instagram: { Icon: Instagram, label: "Instagram" },
  youtube: { Icon: Youtube, label: "YouTube" },
};

type SocialKey = keyof SocialConfig;

async function trackOutbound(url: string, label: string) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "social_link_clicked",
        properties: { url, label, component: "footer" },
      }),
    });
  } catch {
    // Non-critical: fail silently
  }
}

export function FooterSocialLinks({ social }: Props) {
  return (
    <div className="flex items-center gap-2">
      {(Object.keys(ICON_MAP) as SocialKey[]).map((key) => {
        const href = social[key];
        if (!href) return null;
        const { Icon, label } = ICON_MAP[key];
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow us on ${label}`}
            title={label}
            onClick={() => trackOutbound(href, label)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 transition-all duration-200 hover:scale-110"
          >
            <Icon className="w-3.5 h-3.5" />
          </a>
        );
      })}
    </div>
  );
}
