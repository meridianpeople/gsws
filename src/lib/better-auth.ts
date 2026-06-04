import { betterAuth } from 'better-auth'
import { twoFactor } from 'better-auth/plugins'
import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'
import path from 'path'

const sqlite = new Database(path.join(process.cwd(), 'data', 'gsws.db'))
const kyselyDb = new Kysely({ dialect: new SqliteDialect({ database: sqlite }) })

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'https://sws.geig.co.uk',

  database: kyselyAdapter(kyselyDb, { type: 'sqlite' }),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  advanced: {
    cookiePrefix: 'gsws_ba',
    useSecureCookies: true,
    crossSubDomainCookies: { enabled: false },
    defaultCookieAttributes: { sameSite: 'lax', secure: true, httpOnly: true },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    password: {
      hash: async (password: string) => {
        const bcrypt = await import('bcryptjs')
        return bcrypt.hash(password, 12)
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        const bcrypt = await import('bcryptjs')
        return bcrypt.compare(password, hash)
      },
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [
    twoFactor({
      issuer: 'GeiG SWS',
      totpOptions: { digits: 6, period: 30 },
    }),
  ],

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: 'memory',
    customRules: {
      '/api/auth/sign-in/email': { window: 300, max: 5 },
    },
  },

  trustedOrigins: [
    process.env.GSWS_URL        || 'https://sws.geig.co.uk',
    process.env.BETTER_AUTH_URL || 'https://sws.geig.co.uk',
    'http://localhost:3000',
  ],

  user: {
    additionalFields: {
      gswsUserId:   { type: 'number',  required: false, fieldName: 'gsws_user_id'   },
      authProvider: { type: 'string',  required: false, fieldName: 'auth_provider', defaultValue: 'gsws_native' },
      wpUserId:     { type: 'number',  required: false, fieldName: 'wp_user_id'     },
      isActive:     { type: 'boolean', required: false, fieldName: 'is_active',     defaultValue: true },
    },
  },
})

export type Auth = typeof auth
