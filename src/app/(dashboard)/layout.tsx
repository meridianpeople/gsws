import Topbar from '@/components/layout/Topbar'
import LoadingSpinner from '@/components/layout/LoadingSpinner'
import Sidebar from '@/components/layout/Sidebar'
import MainContent from './MainContent'
import IdleTimeout from '@/components/layout/IdleTimeout'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Topbar />
      <Sidebar />
      <LoadingSpinner />
      <IdleTimeout />
      <MainContent>{children}</MainContent>
    </div>
  )
}
