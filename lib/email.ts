import nodemailer from "nodemailer";

// ─── Transport Setup ──────────────────────────────────────────────────────────
// In production: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
// In development: auto-uses Ethereal (fake SMTP) — check console for preview URL

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    // ── Production SMTP (SendGrid / Postmark / Gmail / custom) ──
    // Gmail App Passwords include spaces for readability — strip them before sending
    const smtpPass = (process.env.SMTP_PASS ?? "").replace(/\s/g, "");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass,
      },
      // Gmail-specific: force TLS upgrade on port 587
      tls: { rejectUnauthorized: false },
    });
    console.log("[Email] Using production SMTP:", process.env.SMTP_HOST, "user:", process.env.SMTP_USER);
  } else {
    // ── Development: Ethereal (catch-all test inbox) ──
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("[Email] Using Ethereal test account:", testAccount.user);
  }

  return transporter;
}

// ─── HTML Template ────────────────────────────────────────────────────────────
function buildVerificationEmail(params: {
  email: string;
  verifyUrl: string;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const { email, verifyUrl, unsubscribeUrl } = params;
  const year = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Confirm your Life Meeting subscription</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 16px 40px;
    }
    /* Header bar */
    .header-bar {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 20px 20px 0 0;
      padding: 36px 40px 32px;
      text-align: center;
    }
    .logo-wrap {
      margin-bottom: 24px;
    }
    /* Logo circle — inline SVG approach, works in all email clients */
    .logo-circle {
      width: 72px; height: 72px;
      background: rgba(255,255,255,0.22);
      border: 2px solid rgba(255,255,255,0.35);
      border-radius: 22px;
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      margin: 0 auto 20px;
    }
    .logo-initials {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.04em;
      line-height: 72px;
    }
    .logo-brand {
      margin-top: 12px;
      margin-bottom: 0;
    }
    .logo-brand-text {
      color: rgba(255,255,255,0.9);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .header-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .header-sub {
      color: rgba(255,255,255,0.75);
      font-size: 15px;
      font-weight: 400;
      line-height: 1.5;
    }
    /* Card */
    .card {
      background: #ffffff;
      padding: 40px;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }
    /* Email address block */
    .email-badge {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 20px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .email-icon { font-size: 18px; }
    .email-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      display: block;
    }
    .email-value {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      display: block;
    }
    /* Body text */
    .body-text {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 32px;
    }
    /* CTA button */
    .cta-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
      padding: 16px 40px;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(79,70,229,0.35);
      transition: all 0.2s;
    }
    .cta-sub {
      margin-top: 12px;
      font-size: 12px;
      color: #94a3b8;
    }
    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #f1f5f9;
      margin: 32px 0;
    }
    /* What you'll receive */
    .benefits-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 16px;
    }
    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f8fafc;
    }
    .benefit-item:last-child { border-bottom: none; }
    .benefit-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    .benefit-label {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .benefit-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }
    /* URL fallback */
    .url-fallback {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 16px;
    }
    .url-fallback p {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .url-fallback a {
      font-size: 11px;
      color: #4f46e5;
      word-break: break-all;
    }
    /* Footer */
    .footer {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 20px 20px;
      padding: 24px 40px;
      text-align: center;
    }
    .footer-badges {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .badge {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-text a {
      color: #4f46e5;
      text-decoration: none;
    }
    .footer-unsub {
      margin-top: 12px;
      font-size: 11px;
      color: #cbd5e1;
    }
    .footer-unsub a { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header-bar">
      <!-- Logo: inline table trick for email client compat -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:8px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="72" height="72"
                  style="width:72px;height:72px;border-radius:22px;background:rgba(255,255,255,0.22);border:2px solid rgba(255,255,255,0.35);text-align:center;vertical-align:middle;">
                  <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.04em;line-height:1;">LM</span>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:10px;">
                  <span style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">LIFE MEETING</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div class="header-title" style="margin-top:16px;">Confirm your subscription</div>
      <div class="header-sub">One click to start receiving product updates&nbsp;&amp;&nbsp;insights</div>
    </div>

    <!-- Main card -->
    <div class="card">

      <!-- Email address -->
      <div class="email-badge">
        <span class="email-icon">👤</span>
        <div>
          <span class="email-label">Subscribed email</span>
          <span class="email-value">${email}</span>
        </div>
      </div>

      <p class="body-text">
        Hi there! 👋<br/><br/>
        Thanks for signing up for the <strong>Life Meeting newsletter</strong>. 
        To complete your subscription and start receiving updates, please confirm 
        your email address by clicking the button below.
      </p>

      <!-- CTA -->
      <div class="cta-wrapper">
        <a href="${verifyUrl}" class="cta-btn">✅ &nbsp;Confirm My Subscription</a>
        <p class="cta-sub">This link expires in <strong>24 hours</strong></p>
      </div>

      <hr class="divider" />

      <!-- Benefits -->
      <p class="benefits-title">What you'll receive</p>

      ${[
        { bg: "#eef2ff", icon: "🚀", label: "Product Updates", desc: "New features, releases, and platform announcements" },
        { bg: "#f0fdf4", icon: "🔒", label: "Security Advisories", desc: "Important security notices and compliance updates" },
        { bg: "#faf5ff", icon: "📊", label: "Enterprise Insights", desc: "Best practices, case studies, and industry research" },
        { bg: "#fff7ed", icon: "🎓", label: "Webinars & Events", desc: "Invitations to exclusive live sessions and demos" },
      ].map(b => `
        <div class="benefit-item">
          <div class="benefit-icon" style="background:${b.bg}">${b.icon}</div>
          <div>
            <div class="benefit-label">${b.label}</div>
            <div class="benefit-desc">${b.desc}</div>
          </div>
        </div>
      `).join("")}

      <!-- URL fallback -->
      <div class="url-fallback">
        <p>Button not working? Copy and paste this link into your browser:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-badges">
        <span class="badge">🔒 SOC2 Type II</span>
        <span class="badge">🇪🇺 GDPR Compliant</span>
        <span class="badge">🛡️ ISO 27001</span>
      </div>
      <p class="footer-text">
        © ${year} Life Meeting Inc. · Bengaluru, India<br/>
        <a href="https://lifemeeting.com/privacy">Privacy Policy</a> &nbsp;·&nbsp;
        <a href="https://lifemeeting.com/terms">Terms of Service</a>
      </p>
      <p class="footer-unsub">
        Didn't subscribe? You can safely ignore this email — you won't receive any further messages.<br/>
        <a href="${unsubscribeUrl}">Unsubscribe</a> at any time.
      </p>
    </div>

  </div>
</body>
</html>
`;

  const text = `
Life Meeting — Confirm Your Subscription
=========================================

Hi there!

Thanks for signing up for the Life Meeting newsletter.

Please confirm your email address (${email}) by visiting:
${verifyUrl}

This link expires in 24 hours.

What you'll receive:
- Product updates and new feature announcements
- Security advisories and compliance notices
- Enterprise insights and case studies
- Webinar and event invitations

---
© ${year} Life Meeting Inc.
Privacy: https://lifemeeting.com/privacy
Unsubscribe: ${unsubscribeUrl}
`;

  return { html, text };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendVerificationEmail(params: {
  email: string;
  verifyUrl: string;
  unsubscribeUrl: string;
}): Promise<void> {
  const transport = await getTransporter();
  const { html, text } = buildVerificationEmail(params);

  const info = await transport.sendMail({
    // Use SMTP_USER directly — SMTP_FROM already contains the full RFC 5322 address
    from: `"Life Meeting" <${process.env.SMTP_USER ?? "noreply@lifemeeting.com"}>`,
    to: params.email,
    subject: "✅ Confirm your Life Meeting subscription",
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `newsletter-verify-${Date.now()}`,
      "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  // In dev, log the Ethereal preview URL so you can see the email in the browser
  if (process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║  📧 EMAIL SENT — open preview in your browser:      ║");
    console.log(`║  ${previewUrl}`);
    console.log("╚══════════════════════════════════════════════════════╝\n");
  }
}
