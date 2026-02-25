import React from "react";
import Link from "next/link";
import { FooterSection } from "@/lib/footer-config";
import { ExternalLink } from "lucide-react";

interface Props {
  sections: FooterSection[];
}

export function FooterLinksSection({ sections }: Props) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
            {section.title}
          </h4>
          <ul className="space-y-2.5">
            {section.links.map((link) => (
              <li key={link.href}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-600 leading-none">
                        {link.badge}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-600 leading-none">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
