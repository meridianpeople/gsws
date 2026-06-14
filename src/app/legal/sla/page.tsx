import Link from 'next/link'

export default function SlaPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>Service Level Statement</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={pp}>
            This page describes how GSWS approaches reliability and support. It is a statement of our operational practices rather than a contractual service level agreement with financial credits, unless otherwise agreed in writing for a specific plan.
          </p>

          <h2 style={section}>Monitoring & Recovery</h2>
          <p style={pp}>
            GSWS infrastructure runs across multiple application instances behind a load balancer. We run automated health checks against the platform on a continuous basis; if an instance becomes unresponsive, it is automatically restarted without affecting other active sessions. Scheduled maintenance and deployments are performed using a zero-downtime release process.
          </p>

          <h2 style={section}>Backups</h2>
          <p style={pp}>
            Platform data is backed up on a regular automated schedule. For hosting packages and websites you manage through GSWS, backup availability depends on the plan and any backup add-ons you have configured — check your package's Backups tab for details.
          </p>

          <h2 style={section}>Support</h2>
          <p style={pp}>
            Support requests can be raised by emailing <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a> or via the support section of your dashboard. We aim to acknowledge support requests within 1 business day. Response times for urgent issues affecting service availability are prioritised over general queries.
          </p>

          <h2 style={section}>Planned Maintenance</h2>
          <p style={pp}>
            Where maintenance requires downtime to a specific service (rather than the platform as a whole), we will aim to notify affected customers in advance via the dashboard or email, except for emergency security fixes which may be applied immediately.
          </p>

          <h2 style={section}>Third-Party Infrastructure</h2>
          <p style={pp}>
            Some services depend on third-party providers (20i, Contabo, Vast.ai). Outages originating with these providers are outside our direct control, but we monitor for them and will communicate known issues affecting your services where possible.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '10px' }
const pp: React.CSSProperties = { marginBottom: '12px' }
const lnk: React.CSSProperties = { color: '#1a6ef5', textDecoration: 'none' }
