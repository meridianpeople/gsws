export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '20px' }}>
            These Terms of Service ("Terms") govern your access to and use of GeiG Simple Web Service ("GSWS", "the Service", "we", "us", "our"), operated by GeiG, Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom. By creating an account or using GSWS, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
          </p>

          <h2 style={section}>1. The Service</h2>
          <p style={para}>
            GSWS provides web hosting, domain registration and management, email hosting, WordPress management, virtual private servers (VPS), and GPU compute resources, accessed through our online control panel. Some services are provided directly by us, while others are delivered through third-party infrastructure providers as described in Section 6.
          </p>

          <h2 style={section}>2. Accounts</h2>
          <p style={para}>
            You must provide accurate, current information when creating an account and keep it up to date. You are responsible for all activity that occurs under your account, including actions taken by team members you invite. Notify us promptly if you believe your account has been compromised.
          </p>

          <h2 style={section}>3. Billing and Credit Balance</h2>
          <p style={para}>
            GSWS operates on a prepay credit balance model. Charges for hosting packages, domain registrations and renewals, VPS instances, GPU compute, and add-on services are deducted from your account balance at the time of order or renewal. You are responsible for maintaining sufficient credit to cover recurring charges.
          </p>
          <p style={para}>
            GPU compute resources are billed on a usage basis and are non-refundable once provisioned. Hosting packages, domains, and VPS services may be cancelled in accordance with their applicable notice periods. If your balance is insufficient at the time a renewal is due, the affected service may be suspended or, for on-demand compute resources, terminated without further notice.
          </p>
          <p style={para}>
            We may change pricing for any service at any time. Changes will not affect services already paid for, but will apply to future renewals and new orders.
          </p>

          <h2 style={section}>4. Domain Registration</h2>
          <p style={para}>
            Domain registrations are processed through our registrar partners and are subject to the policies of the relevant domain registry and ICANN, including the Uniform Domain-Name Dispute-Resolution Policy (UDRP). Some top-level domains (TLDs) carry additional registry-specific terms, which apply alongside these Terms. You are responsible for renewing domains before expiry; we provide renewal reminders but are not liable for domains that lapse due to insufficient account balance.
          </p>

          <h2 style={section}>5. Acceptable Use</h2>
          <p style={para}>
            You may not use GSWS to: violate any applicable law or regulation; distribute malware, viruses, or other harmful code; send unsolicited bulk email (spam); host content that infringes the intellectual property or other rights of any third party; engage in phishing, fraud, or denial-of-service attacks; or attempt to gain unauthorised access to any system or network. We may suspend or terminate accounts that breach this policy, with or without notice, depending on severity.
          </p>

          <h2 style={section}>6. Third-Party Infrastructure Providers</h2>
          <p style={para}>
            GSWS relies on third-party providers to deliver parts of the Service, including hosting and domain infrastructure (20i), virtual private servers (Contabo), GPU compute (Vast.ai), and payment processing (Stripe). Your use of these underlying services is also subject to the relevant provider's own terms and acceptable use policies. We are not liable for outages, errors, or policy changes originating from these third parties, though we will make reasonable efforts to assist and communicate any impact to you.
          </p>

          <h2 style={section}>7. Service Availability</h2>
          <p style={para}>
            We aim to provide reliable access to GSWS and the services hosted through it, but we do not guarantee uninterrupted or error-free operation. Scheduled maintenance, third-party outages, or factors outside our control may affect availability. We are not liable for losses arising from downtime, except where required by law.
          </p>

          <h2 style={section}>8. Intellectual Property</h2>
          <p style={para}>
            The GSWS platform, including its design, code, and branding, is the property of GeiG and may not be copied, reproduced, or used to build a competing service without our written permission. You retain all rights to content you upload or host through the Service.
          </p>

          <h2 style={section}>9. Limitation of Liability</h2>
          <p style={para}>
            To the maximum extent permitted by law, GeiG shall not be liable for any indirect, incidental, or consequential damages, including loss of data, revenue, or business, arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the amount you paid to us for the affected service in the three months preceding the claim.
          </p>

          <h2 style={section}>10. Termination</h2>
          <p style={para}>
            You may close your account at any time by contacting support. We may suspend or terminate your account for breach of these Terms, non-payment, or where required by law or our infrastructure providers. Upon termination, any remaining credit balance may be refunded at our discretion, less any non-refundable charges already incurred (such as provisioned GPU usage or registered domains).
          </p>

          <h2 style={section}>11. Changes to These Terms</h2>
          <p style={para}>
            We may update these Terms from time to time. Material changes will be communicated via the GSWS dashboard or email. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
          </p>

          <h2 style={section}>12. Governing Law</h2>
          <p style={para}>
            These Terms are governed by the laws of England and Wales, and any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>

          <h2 style={section}>13. Contact</h2>
          <p style={para}>
            Questions about these Terms can be sent to <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>, or by post to GeiG, Tilbury Business Centre, Tilbury Fort, RM18 7ND, United Kingdom.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '28px', marginBottom: '10px' }
const para: React.CSSProperties = { marginBottom: '14px' }
