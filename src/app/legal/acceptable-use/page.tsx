import Link from 'next/link'

export default function AcceptableUsePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>Acceptable Use Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={pp}>
            This Acceptable Use Policy ("AUP") forms part of our <Link href="/terms" style={lnk}>Terms of Service</Link> and applies to all hosting packages, domains, VPS instances, GPU compute, and email services provided through GeiG Simple Web Service ("GSWS").
          </p>

          <h2 style={section}>Prohibited Content</h2>
          <p style={pp}>You may not use GSWS to store, host, or distribute:</p>
          <ul style={ul}>
            <li>Malware, ransomware, exploit kits, or other malicious code</li>
            <li>Phishing pages or content designed to impersonate other individuals, brands, or services</li>
            <li>Child sexual abuse material, or any content that sexualises minors</li>
            <li>Content that infringes copyright, trademarks, or other intellectual property rights</li>
            <li>Material that is defamatory, harassing, or incites violence or hatred</li>
          </ul>

          <h2 style={section}>Prohibited Activities</h2>
          <ul style={ul}>
            <li>Sending unsolicited bulk email ("spam"), or operating open mail relays</li>
            <li>Launching or participating in denial-of-service (DoS/DDoS) attacks</li>
            <li>Port scanning, vulnerability scanning, or brute-force attacks against systems you do not own or have written permission to test</li>
            <li>Cryptocurrency mining that breaches our fair-use thresholds for shared hosting resources (GPU compute instances are exempt, subject to their own terms)</li>
            <li>Reselling or sub-letting access to GSWS services without our prior written agreement</li>
            <li>Attempting to circumvent resource limits, rate limits, or security controls on the platform</li>
          </ul>

          <h2 style={section}>Resource Usage</h2>
          <p style={pp}>
            Shared hosting packages are intended for typical website and application workloads. Sustained high CPU, memory, or I/O usage that affects other customers may result in your service being throttled, migrated, or asked to upgrade to a VPS or dedicated resource. VPS and GPU compute instances are subject to the resource limits of the plan you have provisioned.
          </p>

          <h2 style={section}>Enforcement</h2>
          <p style={pp}>
            Where we receive a credible report of abuse, or detect a breach of this AUP ourselves, we may suspend the affected service while we investigate, remove offending content, or terminate the account, depending on severity and whether the issue is resolved. Where possible, we will notify you and give you an opportunity to remedy the issue first, except where immediate action is necessary to protect our infrastructure or other customers.
          </p>

          <h2 style={section}>Reporting Abuse</h2>
          <p style={pp}>
            If you believe content hosted on GSWS violates this policy, email <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a> with details of the affected URL or service and the nature of the issue.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '10px' }
const pp: React.CSSProperties = { marginBottom: '12px' }
const ul: React.CSSProperties = { marginBottom: '12px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }
const lnk: React.CSSProperties = { color: '#1a6ef5', textDecoration: 'none' }
