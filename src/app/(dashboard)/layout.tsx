import Topbar from '@/components/layout/Topbar'
import LoadingSpinner from '@/components/layout/LoadingSpinner'
import Sidebar from '@/components/layout/Sidebar'
import MainContent from './MainContent'
import IdleTimeout from '@/components/layout/IdleTimeout'
import { MobileNavProvider } from '@/components/layout/MobileNavContext'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
        <Topbar />
        <Sidebar />
        <LoadingSpinner />
        <IdleTimeout />
        <MainContent>{children}</MainContent>
      </div>
    </MobileNavProvider>
  )
}
