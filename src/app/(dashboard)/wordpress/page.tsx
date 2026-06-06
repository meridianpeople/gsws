import { redirect } from 'next/navigation'
export default function WordPressPage() {
  redirect('/packages?filter=wordpress')
}
