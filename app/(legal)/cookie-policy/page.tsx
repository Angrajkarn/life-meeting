import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Life Meeting",
  description:
    "Learn how Life Meeting uses cookies and similar technologies to provide, protect, and improve our services.",
};

export default function CookiePolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Legal</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Cookie Policy</h1>
        <p className="text-slate-500 mt-2 text-sm">Last updated: February 2026</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-900">1. What Are Cookies?</h2>
          <p className="text-slate-600 leading-relaxed">
            Cookies are small text files placed on your device by websites you visit. They are widely used
            to make websites work more efficiently and provide information to website owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">2. How We Use Cookies</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Category</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Purpose</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Retention</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Strictly Necessary", "Platform authentication, security, load balancing", "Session / 30 days", "Yes"],
                  ["Analytics", "Usage analytics, performance monitoring (Plausible, PostHog)", "13 months", "No"],
                  ["Marketing", "Ad targeting, campaign attribution", "90 days", "No"],
                  ["Functional", "User preferences, language settings, theme", "12 months", "No"],
                ].map(([cat, purpose, retention, required]) => (
                  <tr key={cat} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{cat}</td>
                    <td className="p-4 text-slate-600">{purpose}</td>
                    <td className="p-4 text-slate-600">{retention}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        required === "Yes"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {required}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">3. Managing Your Cookie Preferences</h2>
          <p className="text-slate-600 leading-relaxed">
            You can manage your cookie preferences at any time using our cookie consent manager, which
            appears when you first visit our platform. You can also update preferences via the "Manage
            Preferences" link in our footer.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Additionally, you can control cookies through your browser settings. Please note that
            disabling strictly necessary cookies may impact the functionality of Life Meeting.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">4. Third-Party Cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            We use select third-party tools that may set their own cookies. For a complete list of
            sub-processors and their privacy policies, see our{" "}
            <a href="/subprocessors" className="text-indigo-600 hover:underline">Subprocessor List</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">5. Contact</h2>
          <p className="text-slate-600 leading-relaxed">
            For questions about our cookie practices, contact our Data Protection Officer at{" "}
            <a href="mailto:dpo@lifemeeting.com" className="text-indigo-600 hover:underline">
              dpo@lifemeeting.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
