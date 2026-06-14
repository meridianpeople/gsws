import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={{ background: 'var(--g-sidebar-bg)', borderBottom: '1px solid var(--g-sidebar-border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="https://geig.co.uk" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="https://geig.co.uk/_next/image?url=%2Fgeig-logo.png&w=256&q=75" alt="GeiG" width={100} height={32} style={{ display: 'block' }} />
          </a>
          <Link href="/login" style={{ fontSize: '12px', color: '#A0A6AD', textDecoration: 'none' }}>
            &larr; Back to GSWS
          </Link>
        </div>
      </header>
      {children}
    </>
  )
}
