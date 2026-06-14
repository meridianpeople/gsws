import Link from 'next/link'

export default function ComplaintsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>Complaints Procedure</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={pp}>
            We aim to resolve issues quickly and fairly. If something hasn't gone as expected, here's how to raise it with us.
          </p>

          <h2 style={section}>Step 1 — Contact Support</h2>
          <p style={pp}>
            Email <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a> with your account email, a description of the issue, and any relevant order, transaction, or service references. Most issues are resolved at this stage within a few business days.
          </p>

          <h2 style={section}>Step 2 — Escalation</h2>
          <p style={pp}>
            If you're not satisfied with the response, reply to the same thread and ask for the matter to be escalated. A member of the team will review the case in full and respond with next steps, normally within 5 business days.
          </p>

          <h2 style={section}>Step 3 — Formal Complaint</h2>
          <p style={pp}>
            If the issue remains unresolved after escalation, you may submit a formal written complaint by post to GeiG, Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom, marked for the attention of the Complaints Team. Please include a summary of the issue and the steps already taken to resolve it.
          </p>

          <h2 style={section}>Domain Disputes</h2>
          <p style={pp}>
            Complaints relating specifically to domain name disputes (such as trademark conflicts) should be raised through the relevant registry's dispute resolution process — see our <Link href="/legal/domains" style={lnk}>Domain Registration Policy</Link> and the <Link href="/legal" style={lnk}>Legal & Policies</Link> index for links to the UDRP and equivalent processes.
          </p>

          <h2 style={section}>Data Protection Complaints</h2>
          <p style={pp}>
            If your complaint relates to how we handle your personal data and remains unresolved after Step 2 above, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '10px' }
const pp: React.CSSProperties = { marginBottom: '12px' }
const lnk: React.CSSProperties = { color: '#1a6ef5', textDecoration: 'none' }
