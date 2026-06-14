import type { Metadata } from 'next'
import ApiReferenceClient from './ApiReferenceClient'

export const metadata: Metadata = {
  title: 'API Reference | GeiG Simple Web Service (GSWS)',
  description: 'Full REST API reference for GeiG Simple Web Service — 180+ endpoints covering hosting packages, domains, DNS, email, SSL, CDN, databases, VPS, GPU compute, billing and more. Authenticate with an API key (X-Client-ID / X-Client-Secret) and download a ready-to-use Postman collection.',
}

export default function ApiReferencePage() {
  return <ApiReferenceClient />
}
