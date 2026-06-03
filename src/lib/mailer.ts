import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 465,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

const FROM = process.env.MAIL_FROM || 'GeiG SWS <hello@sws.geig.co.uk>'
const BASE_URL = process.env.GSWS_URL || 'https://sws.geig.co.uk'

export async function sendTeamInvite({ to, inviterName, role, inviteToken }: {
  to: string
  inviterName: string
  role: string
  inviteToken: string
}) {
  const inviteUrl = `${BASE_URL}/invite/${inviteToken}`
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${inviterName} invited you to join GeiG SWS`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#0a0a0a;padding:24px 32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:#fff;border-radius:6px;text-align:center;vertical-align:middle;">
              <span style="font-size:16px;font-weight:900;color:#000;line-height:32px;">G</span>
            </td>
            <td style="padding-left:10px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#fff;">GeiG</p>
              <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1.5px;">Simple Web Service</p>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0a0a0a;letter-spacing:-0.5px;">You've been invited</p>
          <p style="margin:0 0 24px;font-size:15px;color:#5a5a5a;line-height:1.5;">
            <strong style="color:#0a0a0a;">${inviterName}</strong> has invited you to join their GeiG SWS account as a <strong style="color:#1a6ef5;">${roleLabel}</strong>.
          </p>

          <!-- Role card -->
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#f7f7f7;border-radius:8px;margin:0 0 24px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9a9a9a;text-transform:uppercase;letter-spacing:0.5px;">Your role</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#0a0a0a;">${roleLabel}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#5a5a5a;">
                ${role === 'admin' ? 'Full access to all packages, billing and team management.' : role === 'billing' ? 'View statements, transaction history and top up credit.' : 'Read-only access to hosting packages and domains.'}
              </p>
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#1a6ef5;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                Accept invitation →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:12px;color:#9a9a9a;text-align:center;">
            This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.
          </p>
          <p style="margin:12px 0 0;font-size:11px;color:#c0c0c0;text-align:center;word-break:break-all;">
            Or copy this link: ${inviteUrl}
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f7f7f7;padding:16px 32px;border-top:1px solid #ebebeb;">
          <p style="margin:0;font-size:11px;color:#9a9a9a;text-align:center;">
            GeiG Simple Web Service · <a href="${BASE_URL}" style="color:#1a6ef5;text-decoration:none;">sws.geig.co.uk</a>
            · <a href="mailto:support@geig.co.uk" style="color:#1a6ef5;text-decoration:none;">support@geig.co.uk</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `${inviterName} has invited you to join GeiG SWS as ${roleLabel}.\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
  })
}

export async function sendLowCreditAlert({ to, name, balance, threshold }: {
  to: string
  name: string
  balance: number
  threshold: number
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Low credit balance — £${balance.toFixed(2)} remaining`,
    html: `
<body style="font-family:-apple-system,sans-serif;background:#f5f5f5;padding:40px 20px;">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;margin:0 auto;overflow:hidden;">
    <tr><td style="background:#0a0a0a;padding:20px 32px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#fff;">GeiG SWS</p>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="font-size:20px;font-weight:700;color:#a32d2d;margin:0 0 12px;">⚠️ Low credit balance</p>
      <p style="color:#5a5a5a;font-size:14px;line-height:1.6;margin:0 0 20px;">Hi ${name}, your account credit balance is <strong>£${balance.toFixed(2)}</strong>, which is below the £${threshold.toFixed(2)} threshold. Top up now to avoid service interruption.</p>
      <a href="${BASE_URL}/account/topup" style="display:inline-block;padding:12px 28px;background:#1a6ef5;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">Top up credit →</a>
    </td></tr>
  </table>
</body>`,
    text: `Hi ${name}, your credit balance is £${balance.toFixed(2)}. Top up at ${BASE_URL}/account/topup`,
  })
}

export async function sendRenewalReminder({ to, name, resourceName, planName, expiresAt, cost, daysLeft }: {
  to: string
  name: string
  resourceName: string
  planName: string
  expiresAt: string
  cost: number
  daysLeft: number
}) {
  const urgent = daysLeft <= 7
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${urgent ? '⚠️ Urgent: ' : ''}${resourceName} renews in ${daysLeft} days`,
    html: `
<body style="font-family:-apple-system,sans-serif;background:#f5f5f5;padding:40px 20px;">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;margin:0 auto;overflow:hidden;">
    <tr><td style="background:#0a0a0a;padding:20px 32px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#fff;">GeiG SWS</p>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="font-size:20px;font-weight:700;color:${urgent ? '#a32d2d' : '#854f0b'};margin:0 0 12px;">${urgent ? '⚠️' : '🔄'} Renewal reminder</p>
      <p style="color:#5a5a5a;font-size:14px;line-height:1.6;margin:0 0 12px;">Hi ${name}, your <strong>${planName}</strong> for <strong>${resourceName}</strong> renews in <strong>${daysLeft} days</strong> on ${new Date(expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
      <table cellpadding="0" cellspacing="0" style="background:#f7f7f7;border-radius:8px;width:100%;margin:0 0 20px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:#5a5a5a;">Renewal cost: <strong style="color:#0a0a0a;">£${cost.toFixed(2)} inc VAT</strong></p>
          <p style="margin:4px 0 0;font-size:12px;color:#9a9a9a;">Charged automatically from your credit balance if auto-renew is enabled.</p>
        </td></tr>
      </table>
      <a href="${BASE_URL}/renewals" style="display:inline-block;padding:12px 28px;background:#1a6ef5;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">Manage renewals →</a>
    </td></tr>
  </table>
</body>`,
    text: `Hi ${name}, ${resourceName} (${planName}) renews in ${daysLeft} days on ${expiresAt}. Cost: £${cost.toFixed(2)}. Manage at ${BASE_URL}/renewals`,
  })
}

export default transporter
