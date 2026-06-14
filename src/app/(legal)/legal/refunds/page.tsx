import Link from 'next/link'

export default function RefundsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>Refund & Cancellation Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <h2 style={section}>Account Credit</h2>
          <p style={pp}>
            GSWS operates on a prepay credit balance. Topping up your balance does not itself constitute a purchase of any specific service — credit is consumed as you order or renew hosting, domains, VPS, GPU compute, or add-ons. Unused credit may be refunded at our discretion, subject to deduction of any non-refundable charges already incurred.
          </p>

          <h2 style={section}>Hosting Packages</h2>
          <p style={pp}>
            Hosting packages are billed monthly. You may cancel at any time from your account; cancellation takes effect at the end of the current billing period, with no partial-month refund. If you cancel within 14 days of first purchasing a new hosting package and have not used the service beyond initial setup, contact support to request a refund of that package's charge.
          </p>

          <h2 style={section}>Domain Registrations</h2>
          <p style={pp}>
            Domain registration and renewal fees are non-refundable once the registration has been submitted to the registry, in line with standard ICANN and registry practice. If a registration fails due to a technical error on our part, the charge will be reversed in full.
          </p>

          <h2 style={section}>VPS</h2>
          <p style={pp}>
            VPS instances are billed monthly in advance. You may cancel at any time; the instance will remain active until the end of the paid period, after which it is deprovisioned. No partial-month refunds are provided for early cancellation.
          </p>

          <h2 style={section}>GPU Compute</h2>
          <p style={pp}>
            GPU compute is billed on a usage basis at the rates shown at the time of provisioning. Charges accrue from the point an instance is provisioned and are <strong>non-refundable</strong>, including for instances stopped shortly after creation. You can avoid ongoing charges by terminating an instance you no longer need from your dashboard.
          </p>

          <h2 style={section}>Auto-Renewal & Insufficient Balance</h2>
          <p style={pp}>
            Renewals are processed automatically from your credit balance where auto-renew is enabled. We send reminders ahead of upcoming renewals. If your balance is insufficient at the time a renewal is due, the affected service may be suspended; continued non-payment may result in the service (and associated data) being permanently removed after the notice period shown in your dashboard.
          </p>

          <h2 style={section}>How to Request a Refund</h2>
          <p style={pp}>
            To request a refund or query a charge, email <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a> with your account email and the relevant order or transaction reference. We aim to respond to refund requests within 5 working days.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '10px' }
const pp: React.CSSProperties = { marginBottom: '12px' }
const lnk: React.CSSProperties = { color: '#1a6ef5', textDecoration: 'none' }
