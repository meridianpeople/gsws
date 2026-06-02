// ── Account ──────────────────────────────────────────────
export interface AccountBalance {
  balance: number
  currency: string
}

// ── Packages ─────────────────────────────────────────────
export interface Package {
  id: string
  name: string
  type: 'linux' | 'wordpress' | 'drupal' | 'windows'
  status: 'active' | 'suspended' | 'cancelled'
  primaryDomain: string
  platform: string
  location: string
  ipAddress: string
  ipv6Address?: string
  incomingMailServer: string
  outgoingMailServer: string
  phpVersion?: string
  diskUsed?: number
  diskLimit?: number
  bandwidthUsed?: number
  bandwidthLimit?: number
  emailCount?: number
  subdomainCount?: number
  ftpCount?: number
  createdAt?: string
}

// ── Domains ──────────────────────────────────────────────
export interface Domain {
  id: string
  name: string
  expires: string
  autoRenew: boolean
  privacyEnabled: boolean
  nameservers: string[]
  status: 'active' | 'expired' | 'pending' | 'transferring'
  locked: boolean
}

export interface DnsRecord {
  id?: string
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV' | 'NS'
  name: string
  content: string
  ttl: number
  priority?: number
}

// ── Email ────────────────────────────────────────────────
export interface Mailbox {
  id: string
  address: string
  domain: string
  quotaMb: number
  usedMb: number
  status: 'active' | 'suspended'
  hasForwarder: boolean
  hasAutoresponder: boolean
}

// ── SSL ──────────────────────────────────────────────────
export interface SslCertificate {
  id: string
  domain: string
  issuer: string
  expires: string
  status: 'valid' | 'expired' | 'renewing' | 'pending'
  forceHttps: boolean
}

// ── Databases ────────────────────────────────────────────
export interface Database {
  id: string
  name: string
  type: 'mysql' | 'mssql'
  packageId: string
  domain: string
  sizeMb: number
  username: string
}

// ── VPS ──────────────────────────────────────────────────
export interface Vps {
  id: string
  name: string
  status: 'running' | 'stopped' | 'rebooting' | 'rebuilding'
  ipAddress: string
  ipv6Address?: string
  os: string
  cpuCores: number
  ramMb: number
  diskGb: number
  bandwidthGb: number
  location: string
}

// ── Backups ──────────────────────────────────────────────
export interface BackupSnapshot {
  id: string
  packageId: string
  domain: string
  type: 'web' | 'database' | 'mailbox'
  takenAt: string
  sizeMb?: number
}

// ── Users ────────────────────────────────────────────────
export interface StackUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  canTopup: boolean
  creditBalance: number
  packages: string[]
}

// ── CDN ──────────────────────────────────────────────────
export interface CdnStats {
  cachedRequests: number
  bandwidthSavedGb: number
  cacheHitRate: number
  edgeLocations: number
}

// ── API responses ────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}
