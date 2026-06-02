import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Topbar />
      <Sidebar />
      <main style={{
        paddingTop: '52px',
        marginLeft: '232px',
        minHeight: '100vh',
        background: '#f5f5f5',
      }}>
        <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
