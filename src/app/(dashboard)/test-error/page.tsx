export default function TestErrorPage() {
  throw new Error('Intentional test error for error boundary verification')
  return null
}
