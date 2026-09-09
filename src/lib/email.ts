/**
 * Resend Email Service for Cinemar Scripter
 * Sends transactional & welcome emails from info@scripter.cinemar.in
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_EMAIL_FROM || 'Cinemar Scripter <info@scripter.cinemar.in>';

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * Send email using Resend HTTP API
 */
export async function sendEmail({ to, subject, html, from = FROM_EMAIL }: SendEmailOptions) {
    if (!RESEND_API_KEY) {
        console.warn('[Resend] Missing API key. Email sending skipped.');
        return { success: false, error: 'Missing Resend API key' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from,
                to: Array.isArray(to) ? to : [to],
                subject,
                html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Resend] Error sending email:', data);
            return { success: false, error: data?.message || 'Failed to send email' };
        }

        console.log('[Resend] Email sent successfully:', data);
        return { success: true, data };
    } catch (err: any) {
        console.error('[Resend] Network error sending email:', err);
        return { success: false, error: err?.message || 'Network error' };
    }
}

/**
 * Generate a clean, responsive, full-width email template
 */
export function getWelcomeEmailHtml(userEmail: string): string {
    const userName = userEmail.split('@')[0];
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://scripter.cinemar.in';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cinemar Scripter</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; border: none !important; border-radius: 0 !important; }
      .email-content { padding: 24px 20px 32px !important; }
      .email-header { padding: 28px 20px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#070b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#070b14;width:100%;">
    <tr>
      <td align="center" style="padding:0;">
        <table class="email-container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(180deg,#0e1726 0%,#090d16 100%);border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin:0 auto;">
          <!-- Header with Logo -->
          <tr>
            <td class="email-header" align="center" style="padding:36px 36px 24px;border-bottom:1px solid #1e293b;">
              <img src="https://files.catbox.moe/fbtgx0.png" alt="Cinemar Scripter" height="48" style="height:48px;max-height:48px;width:auto;display:inline-block;border:0;outline:none;" />
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td class="email-content" style="padding:36px 36px 40px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 16px;line-height:1.3;letter-spacing:-0.2px;">
                Welcome to Cinemar Scripter, ${userName}
              </h1>
              <p style="font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 24px;">
                Your studio is ready. Cinemar Scripter gives you a distraction-free environment to write, revise, and format professional screenplays.
              </p>

              <!-- Highlights -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0 28px;">
                <tr>
                  <td style="padding:12px 0;border-top:1px solid #1e293b;">
                    <strong style="color:#f1f5f9;font-size:14px;display:block;margin-bottom:4px;">Industry-Standard Screenplay Formatting</strong>
                    <span style="color:#94a3b8;font-size:13px;line-height:1.5;">Automatic scene headings, character names, dialogue, and parentheticals.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-top:1px solid #1e293b;">
                    <strong style="color:#f1f5f9;font-size:14px;display:block;margin-bottom:4px;">Drafts & Version Management</strong>
                    <span style="color:#94a3b8;font-size:13px;line-height:1.5;">Branch, revise, and preserve multiple script versions without losing ideas.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;">
                    <strong style="color:#f1f5f9;font-size:14px;display:block;margin-bottom:4px;">Production-Ready PDF Export</strong>
                    <span style="color:#94a3b8;font-size:13px;line-height:1.5;">Export perfectly formatted standard script PDFs with a single click.</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:12px 0 20px;">
                    <a href="${appUrl}" target="_blank" style="display:inline-block;padding:14px 38px;background-color:#d946ef;color:#ffffff !important;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Open Studio & Start Writing
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.6;color:#64748b;margin:16px 0 0;text-align:center;">
                Have questions or need assistance? Reply to this email anytime.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 36px;border-top:1px solid #1e293b;font-size:12px;color:#475569;">
              &copy; ${new Date().getFullYear()} Cinemar Scripter &bull; <a href="mailto:info@scripter.cinemar.in" style="color:#64748b;text-decoration:none;">info@scripter.cinemar.in</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
}

/**
 * Send welcome email to a newly registered user
 */
export async function sendWelcomeEmail(email: string) {
    const html = getWelcomeEmailHtml(email);
    return await sendEmail({
        to: email,
        subject: 'Welcome to Cinemar Scripter',
        html
    });
}
