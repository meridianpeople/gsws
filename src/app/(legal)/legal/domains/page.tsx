import Link from 'next/link'

export default function DomainsLegalPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>Domain Registration Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={pp}>
            When you register or transfer a domain through GSWS, you are entering into a registration agreement with the relevant domain registry (and our registrar partner), in addition to our own <Link href="/terms" style={lnk}>Terms of Service</Link>. This page explains how that works and links to the policies that apply.
          </p>

          <h2 style={section}>Registrar Relationship</h2>
          <p style={pp}>
            GSWS is a reseller of domain registration services. Domains are registered through our upstream registrar partner, who in turn is accredited with the relevant registry (for example, Nominet for .uk domains, or ICANN-accredited registrars for gTLDs such as .com and .org). You are the registrant of record for any domain registered through your account, and the registrant agreement of the relevant registry applies to your registration.
          </p>

          <h2 style={section}>WHOIS & Registrant Data</h2>
          <p style={pp}>
            Registry rules require certain registrant information to be provided for each domain (name, address, contact details). For gTLDs, this information is generally redacted from public WHOIS by default; for .uk domains, Nominet's privacy rules apply. WHOIS privacy add-ons, where offered, register the domain under our trusted entity's details in place of yours, subject to the terms shown at the time of purchase.
          </p>

          <h2 style={section}>Dispute Resolution (UDRP)</h2>
          <p style={pp}>
            Disputes over domain ownership (for example, where a third party claims a domain infringes their trademark) are handled under ICANN's Uniform Domain-Name Dispute-Resolution Policy (UDRP) for gTLDs, or the equivalent dispute resolution service for the relevant ccTLD (such as Nominet's DRS for .uk). We will cooperate with any valid order issued under these processes, including locking or transferring a domain where required.
          </p>

          <h2 style={section}>Renewals & Expiry</h2>
          <p style={pp}>
            Domains must be renewed before their expiry date to remain registered. We send renewal reminders ahead of expiry, but it is your responsibility to ensure your account has sufficient credit. If a domain expires without renewal, it may enter a redemption or grace period defined by the registry, during which restoration may be possible at an additional cost; after this period, the domain is released and may become available for registration by others.
          </p>

          <h2 style={section}>Transfers</h2>
          <p style={pp}>
            To transfer a domain away from GSWS, you will need an authorisation code (EPP/IPS tag change for .uk) from your account, and the domain must not be within a registry-imposed transfer lock period (typically 60 days after registration or a previous transfer). To transfer a domain to GSWS, follow the instructions in your dashboard for the relevant TLD.
          </p>

          <h2 style={section}>External Registry & ICANN Policies</h2>
          <p style={pp}>
            The following policy documents, maintained by ICANN and the relevant registries, apply to domain registrations alongside this page — see the <Link href="/legal" style={lnk}>Legal & Policies</Link> index for direct links to the UDRP, ICANN registrant materials, and TLD-specific registrant agreements.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '10px' }
const pp: React.CSSProperties = { marginBottom: '12px' }
const lnk: React.CSSProperties = { color: '#1a6ef5', textDecoration: 'none' }
