"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsentState {
  version: string;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
}

const CONSENT_KEY = "lm_cookie_consent";
const CONSENT_VERSION = "1.0.0";

export function loadConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveConsent(consent: Omit<ConsentState, "version" | "timestamp">) {
  const full: ConsentState = {
    ...consent,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
  return full;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    analytics: true,
    marketing: false,
    functional: true,
  });

  useEffect(() => {
    const existing = loadConsent();
    if (!existing || existing.version !== CONSENT_VERSION) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    saveConsent({ analytics: true, marketing: true, functional: true });
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent({ analytics: false, marketing: false, functional: true }); // functional always on
    setVisible(false);
  };

  const savePreferences = () => {
    saveConsent(prefs);
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
        {!showPrefs ? (
          // Main Banner
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🍪</span>
                <h3 className="font-bold text-slate-900 text-sm">Cookie Preferences</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyse traffic,
                personalise content, and support marketing. See our{" "}
                <a href="/cookie-policy" className="text-indigo-600 hover:underline font-medium">
                  Cookie Policy
                </a>
                . Under GDPR, you have the right to manage your preferences.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 hover:text-slate-900 gap-1.5"
                onClick={() => setShowPrefs(true)}
              >
                <Settings className="w-3.5 h-3.5" />
                Manage
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-200"
                onClick={rejectAll}
              >
                Reject All
              </Button>
              <Button
                size="sm"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={acceptAll}
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          // Preferences Panel
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900">Manage Cookie Preferences</h3>
              <button
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setShowPrefs(false)}
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {[
                {
                  key: "functional",
                  label: "Strictly Necessary",
                  desc: "Required for the platform to function. Cannot be disabled.",
                  locked: true,
                  value: true,
                },
                {
                  key: "analytics",
                  label: "Analytics & Performance",
                  desc: "Helps us understand how visitors interact with the platform.",
                  locked: false,
                  value: prefs.analytics,
                },
                {
                  key: "marketing",
                  label: "Marketing & Targeting",
                  desc: "Used to deliver relevant advertisements and track campaign performance.",
                  locked: false,
                  value: prefs.marketing,
                },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {item.locked ? (
                      <span className="text-xs text-slate-400 font-medium">Always On</span>
                    ) : (
                      <button
                        role="switch"
                        aria-checked={item.value}
                        onClick={() =>
                          setPrefs((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))
                        }
                        className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none flex items-center px-0.5 ${
                          item.value ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                        style={{ height: "22px" }}
                      >
                        <span
                          className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            item.value ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={rejectAll}>
                Reject All
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={savePreferences}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
