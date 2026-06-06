import { redirect } from 'next/navigation'
export default function LinuxPage() {
  redirect('/packages?filter=linux')
}
