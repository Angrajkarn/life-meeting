import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function NewsletterConfirmedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">You're subscribed!</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Your email is now confirmed. You'll receive the latest Life Meeting product updates,
            security advisories, and enterprise insights.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
        <p className="text-xs text-slate-400">
          Changed your mind?{" "}
          <Link href="/unsubscribe" className="text-indigo-500 hover:underline">
            Unsubscribe
          </Link>
        </p>
      </div>
    </main>
  );
}
