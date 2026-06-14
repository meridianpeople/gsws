import Link from 'next/link'

export default function GdprPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>GDPR & Data Processing</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={pp}>
            This page summarises how UK GDPR applies to your use of GSWS. It supplements our <Link href="/privacy" style={lnk}>Privacy Policy</Link>, which describes what personal data we collect and why.
          </p>

          <h2 style={section}>Our Role</h2>
          <p style={pp}>
            For account and billing data (your name, email, billing address, and payment details), GeiG acts as the <strong>data controller</strong>. For content you host through GSWS — for example, customer data within a website or application you run on your hosting package or VPS — you are the data controller, and GeiG acts as a <strong>data processor</strong> on your behalf.
          </p>

          <h2 style={section}>Sub-Processors</h2>
          <p style={pp}>
            We use the following sub-processors to deliver the Service. Each is bound by its own data protection terms with us:
          </p>
          <ul style={ul}>
            <li><strong>20i</strong> — shared hosting, domain registration, and email infrastructure</li>
            <li><strong>Contabo</strong> — virtual private server (VPS) infrastructure</li>
            <li><strong>Vast.ai</strong> — GPU compute infrastructure</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Google / GitHub</strong> — OAuth sign-in, where you choose to use these providers</li>
          </ul>
          <p style={pp}>
            If we add or change a sub-processor in a way that materially affects how your data is handled, we will update this page and, where required, notify you.
          </p>

          <h2 style={section}>International Transfers</h2>
          <p style={pp}>
            Our infrastructure providers may process data in locations outside the UK. Where this occurs, we rely on appropriate safeguards such as the UK's International Data Transfer Addendum or adequacy decisions, as provided by the relevant sub-processor's own data protection terms.
          </p>

          <h2 style={section}>Data Processing Agreement</h2>
          <p style={pp}>
            If you require a signed Data Processing Agreement (DPA) for your own compliance purposes (for example, because you process personal data of EU/UK residents through services hosted on GSWS), contact <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a> and we will provide one.
          </p>

          <h2 style={section}>Exercising Your Rights</h2>
          <p style={pp}>
            To access, correct, export, or delete the personal data we hold about you as our customer, see the <Link href="/privacy" style={lnk}>Privacy Policy</Link> for details, or contact us directly using the details below.
          </p>

          <h2 style={section}>Contact</h2>
          <p style={pp}>
            Email <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a>, or write to GeiG, Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom. If you remain unsatisfied with our response, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.
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
