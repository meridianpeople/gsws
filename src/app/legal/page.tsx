import Link from 'next/link'

const docs = [
  { href: '/terms', title: 'Terms of Service', desc: 'The agreement governing your use of GSWS.' },
  { href: '/privacy', title: 'Privacy Policy', desc: 'How we collect, use, and protect your personal information.' },
  { href: '/legal/acceptable-use', title: 'Acceptable Use Policy', desc: 'What is and isn\u2019t permitted on GSWS hosting and compute services.' },
  { href: '/legal/refunds', title: 'Refund & Cancellation Policy', desc: 'How credit, billing, and cancellations work across services.' },
  { href: '/legal/domains', title: 'Domain Registration Policy', desc: 'Registry, ICANN, and TLD-specific terms for domain registrations.' },
  { href: '/legal/gdpr', title: 'GDPR & Data Processing', desc: 'Information about our role as a data controller/processor and sub-processors.' },
  { href: '/legal/cookies', title: 'Cookie Policy', desc: 'The cookies GSWS uses and why.' },
  { href: '/legal/sla', title: 'Service Level Statement', desc: 'Our approach to uptime, monitoring, and support response.' },
  { href: '/legal/complaints', title: 'Complaints Procedure', desc: 'How to raise and escalate a complaint.' },
]

export default function LegalIndexPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Legal & Policies</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
          Below you'll find the documents that govern your use of GeiG Simple Web Service (GSWS), including how we handle data, billing, domains, and acceptable use. Please take a moment to review them.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map(d => (
            <Link key={d.href} href={d.href} style={{ display: 'block', padding: '14px 16px', background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border-hover)', borderRadius: '8px', textDecoration: 'none', transition: 'border-color 0.15s' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{d.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.desc}</p>
            </Link>
          ))}
        </div>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>Domain Registration & Registry Policies</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>
          Domains registered through GSWS are also subject to the policies of the relevant registry and ICANN. These external documents apply alongside our own Terms of Service:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          {[
            { href: 'https://www.icann.org/resources/pages/policy-2012-02-25-en', title: 'Uniform Domain Name Dispute Resolution Policy (UDRP)' },
            { href: 'https://www.icann.org/resources/pages/benefits-2013-09-16-en', title: 'ICANN Registrant Educational Materials' },
            { href: 'https://www.icann.org/resources/pages/responsibilities-2014-03-14-en', title: 'ICANN Registrants\u2019 Benefits and Responsibilities' },
            { href: 'https://www.nominet.uk/registrant-agreement/', title: '.UK Registrant Agreement (Nominet)' },
            { href: 'https://www.cira.ca/registrant-agreement', title: '.CA Registrant Agreement (CIRA)' },
            { href: 'https://eurid.eu/en/register-a-eu-domain/eu-domain-names-terms-and-conditions/', title: '.EU Domain Terms and Conditions (EURid)' },
          ].map(d => (
            <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>
              {d.title} &#x2197;
            </a>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '24px', lineHeight: 1.6 }}>
          For questions about any of these documents, contact <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>, or write to GeiG, Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom.
        </p>
      </div>
    </div>
  )
}
