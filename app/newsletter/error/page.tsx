import Link from "next/link";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "The confirmation link appears to be incomplete. Please try subscribing again.",
  invalid_token: "The confirmation link is invalid. Please try subscribing again.",
  expired_token: "The confirmation link has expired (valid for 24 hours). Please subscribe again.",
  server_error: "Something went wrong on our end. Please try again later.",
};

export default function NewsletterErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason ?? "server_error";
  const message = ERROR_MESSAGES[reason] ?? ERROR_MESSAGES.server_error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Confirmation Failed</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">{message}</p>
        </div>
        <Link
          href="/"
          className="inline-flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
