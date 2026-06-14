export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '20px' }}>
            This Privacy Policy explains how GeiG ("we", "us", "our"), of Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom, collects, uses, and protects personal information when you use GeiG Simple Web Service ("GSWS").
          </p>

          <h2 style={section}>1. Information We Collect</h2>
          <p style={para}>
            <strong>Account information:</strong> name, email address, and password (or OAuth identifier if you sign in with Google or GitHub).
          </p>
          <p style={para}>
            <strong>Billing information:</strong> billing address and payment details. Card payments are processed by Stripe; we do not store full card numbers ourselves.
          </p>
          <p style={para}>
            <strong>Service data:</strong> information related to the domains, hosting packages, VPS instances, and GPU compute resources you provision, including configuration, DNS records, and SSH keys you choose to add.
          </p>
          <p style={para}>
            <strong>Usage and security data:</strong> IP addresses, login times, browser/user-agent information, and audit logs of actions taken in your account, which we retain for security, fraud prevention, and troubleshooting.
          </p>

          <h2 style={section}>2. How We Use Your Information</h2>
          <p style={para}>
            We use your information to provide and operate the Service, process payments and renewals, communicate important account and service notices, respond to support requests, detect and prevent fraud or abuse, and meet our legal and regulatory obligations.
          </p>

          <h2 style={section}>3. Third-Party Processors</h2>
          <p style={para}>
            To deliver GSWS, we share relevant data with infrastructure and service providers acting as data processors on our behalf, including: 20i (hosting and domain management), Contabo (virtual private servers), Vast.ai (GPU compute), Stripe (payment processing), and Google / GitHub (where you choose to sign in via these providers). Each of these providers has its own privacy practices governing how they handle data processed on our behalf.
          </p>

          <h2 style={section}>4. Cookies</h2>
          <p style={para}>
            GSWS uses essential cookies to keep you signed in and maintain your session security. We do not use third-party advertising or tracking cookies on the GSWS platform.
          </p>

          <h2 style={section}>5. Data Retention</h2>
          <p style={para}>
            We retain account and billing information for as long as your account is active, and for a reasonable period afterwards to meet accounting, tax, and legal obligations. Audit logs and security records are retained for a limited period to support fraud detection and investigations.
          </p>

          <h2 style={section}>6. Your Rights</h2>
          <p style={para}>
            Under UK data protection law (UK GDPR), you have the right to access, correct, or request deletion of your personal information, to object to or restrict certain processing, and to receive your data in a portable format. To exercise any of these rights, contact us using the details below.
          </p>

          <h2 style={section}>7. Security</h2>
          <p style={para}>
            We use technical and organisational measures, including encryption in transit, access controls, and audit logging, to help protect your information. No system can be guaranteed completely secure, and you should also take steps to protect your account, such as using a strong, unique password.
          </p>

          <h2 style={section}>8. Changes to This Policy</h2>
          <p style={para}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. Material changes will be communicated via the GSWS dashboard or email.
          </p>

          <h2 style={section}>9. Contact</h2>
          <p style={para}>
            For privacy-related questions or requests, contact us at <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>, or by post to GeiG, Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '28px', marginBottom: '10px' }
const para: React.CSSProperties = { marginBottom: '14px' }
