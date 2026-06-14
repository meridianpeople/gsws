import Link from 'next/link'

const ORDER = [
  { href: '/terms', title: 'Terms of Service' },
  { href: '/privacy', title: 'Privacy Policy' },
  { href: '/legal/acceptable-use', title: 'Acceptable Use Policy' },
  { href: '/legal/refunds', title: 'Refund & Cancellation Policy' },
  { href: '/legal/domains', title: 'Domain Registration Policy' },
  { href: '/legal/gdpr', title: 'GDPR & Data Processing' },
  { href: '/legal/cookies', title: 'Cookie Policy' },
  { href: '/legal/sla', title: 'Service Level Statement' },
  { href: '/legal/complaints', title: 'Complaints Procedure' },
]

export default function LegalNav({ current }: { current: string }) {
  const idx = ORDER.findIndex(d => d.href === current)
  const prev = idx > 0 ? ORDER[idx - 1] : null
  const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null

  return (
    <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <div>
        {prev && (
          <Link href={prev.href} style={navLink}>
            &larr; {prev.title}
          </Link>
        )}
      </div>
      <Link href="/legal" style={{ ...navLink, color: 'var(--text-tertiary)' }}>
        All policies
      </Link>
      <div style={{ textAlign: 'right' }}>
        {next && (
          <Link href={next.href} style={navLink}>
            {next.title} &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}

const navLink: React.CSSProperties = { fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }
