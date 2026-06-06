import { redirect } from 'next/navigation'
export default function WindowsPage() {
  redirect('/packages?filter=windows')
}
