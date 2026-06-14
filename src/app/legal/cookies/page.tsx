import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '40px' }}>
        <Link href="/legal" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>&larr; Legal & Policies</Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 6px' }}>Cookie Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>Last updated: June 2026</p>

        <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p style={pp}>
            GSWS uses a small number of cookies, all of which are necessary for the platform to function. We do not use advertising, tracking, or third-party analytics cookies.
          </p>

          <h2 style={section}>Cookies We Use</h2>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <th style={th}>Cookie</th>
                <th style={th}>Purpose</th>
                <th style={th}>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--table-row-border)' }}>
                <td style={td}><code>gsws_ba.session_token</code></td>
                <td style={td}>Keeps you signed in and identifies your session securely.</td>
                <td style={td}>Up to 30 days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--table-row-border)' }}>
                <td style={td}><code>gsws-theme</code></td>
                <td style={td}>Remembers your light/dark theme preference.</td>
                <td style={td}>Persistent (local storage)</td>
              </tr>
            </tbody>
          </table>

          <h2 style={section}>Managing Cookies</h2>
          <p style={pp}>
            Because these cookies are essential for sign-in and core functionality, GSWS does not display a cookie consent banner — disabling them via your browser will prevent you from staying signed in. If you have any questions about how we use cookies, contact <a href="mailto:support@geig.co.uk" style={lnk}>support@geig.co.uk</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

const section: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '24px', marginBottom: '10px' }
const pp: React.CSSProperties = { marginBottom: '12px' }
const lnk: React.CSSProperties = { color: '#1a6ef5', textDecoration: 'none' }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const td: React.CSSProperties = { padding: '10px 12px', color: 'var(--text-secondary)', verticalAlign: 'top' }
