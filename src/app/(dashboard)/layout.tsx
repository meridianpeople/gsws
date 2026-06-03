import Topbar from '@/components/layout/Topbar'
import LoadingSpinner from '@/components/layout/LoadingSpinner'
import Sidebar from '@/components/layout/Sidebar'
import MainContent from './MainContent'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Topbar />
      <Sidebar />
      <LoadingSpinner />
      <MainContent>{children}</MainContent>
    </div>
  )
}
