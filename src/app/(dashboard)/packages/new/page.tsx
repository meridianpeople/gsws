import { Suspense } from 'react'
import NewPackageForm from './NewPackageForm'

export default function NewPackagePage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading…</div>}>
      <NewPackageForm />
    </Suspense>
  )
}
