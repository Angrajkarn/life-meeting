"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, AlertCircle, Mail } from "lucide-react";

interface Props {
  gdprRequired?: boolean;
  placeholder?: string;
  successMessage?: string;
  source?: string;
}

type FormState = "idle" | "loading" | "success" | "error";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function FooterNewsletterForm({
  gdprRequired = true,
  placeholder = "Enter your work email",
  successMessage = "Check your inbox to confirm subscription.",
  source = "footer",
}: Props) {
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (gdprRequired && !gdprConsent) {
      setErrorMsg("You must accept the consent to subscribe.");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), gdprConsent, source }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setErrorMsg("Too many attempts. Please try again later.");
        } else {
          setErrorMsg(data.message ?? "Something went wrong. Please try again.");
        }
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">You're almost in!</p>
          <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            className="pl-9 h-10 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500"
            disabled={state === "loading"}
            required
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={state === "loading"}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shrink-0 text-xs font-bold"
        >
          {state === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </div>

      {/* GDPR Consent */}
      {gdprRequired && (
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <div className="shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <span className="text-[10px] text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
            I agree to receive product updates and marketing communications.
            I can{" "}
            <a
              href="/unsubscribe"
              className="text-indigo-500 hover:text-indigo-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              unsubscribe
            </a>{" "}
            at any time. View our{" "}
            <a
              href="/privacy"
              className="text-indigo-500 hover:text-indigo-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>
      )}

      {/* Error message */}
      {state === "error" && errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </form>
  );
}
