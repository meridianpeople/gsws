export default async function PackageWordpressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="gsws-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', gap: '12px', border: '1px dashed #d4d4d4' }}>
      <span style={{ fontSize: '32px' }}>🚧</span>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Wordpress</p>
      <p style={{ fontSize: '13px', color: '#9a9a9a' }}>This section is being built for package {id}.</p>
    </div>
  )
}
