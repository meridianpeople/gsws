import { NextRequest, NextResponse } from 'next/server'
import { ROUTES, type ApiRoute } from '@/lib/api-routes'

function pathToPostman(p: string) {
  const segments = p.split('/').filter(Boolean)
  const pathParts: string[] = []
  const pathVars: { key: string; value: string }[] = []
  for (const seg of segments) {
    const m = seg.match(/^\[(.+)\]$/)
    if (m) {
      pathParts.push(':' + m[1])
      pathVars.push({ key: m[1], value: '' })
    } else {
      pathParts.push(seg)
    }
  }
  return { pathParts, pathVars }
}

function parseQuery(params?: string) {
  if (!params || !params.startsWith('?')) return []
  return params.slice(1).split('&').map(pair => {
    const [key, val] = pair.split('=')
    return { key, value: (val || '').split('|')[0], disabled: true }
  }).filter(q => q.key)
}

function buildItem(r: ApiRoute) {
  const { pathParts, pathVars } = pathToPostman(r.path)
  const header: any[] = [
    { key: 'Content-Type', value: 'application/json', type: 'text' },
  ]

  if (r.group === 'Cron') {
    header.push({ key: 'x-cron-secret', value: '{{cronSecret}}', type: 'text' })
  } else if (r.auth) {
    header.push({ key: 'X-Client-ID', value: '{{clientId}}', type: 'text' })
    header.push({ key: 'X-Client-Secret', value: '{{clientSecret}}', type: 'text' })
  }

  const url: any = {
    raw: '{{baseUrl}}' + r.path.split('?')[0],
    host: ['{{baseUrl}}'],
    path: pathParts,
  }
  if (pathVars.length) url.variable = pathVars

  const query = r.group !== 'Cron' ? parseQuery(r.params) : []
  if (query.length) url.query = query

  const request: any = {
    method: r.method,
    header,
    url,
    description: r.desc + (r.response ? `\n\nExample response:\n${r.response}` : ''),
  }

  if (r.body) {
    request.body = {
      mode: 'raw',
      raw: r.body,
      options: { raw: { language: 'json' } },
    }
  }

  return {
    name: `${r.method} ${r.path}`,
    request,
  }
}

export async function GET(req: NextRequest) {
  // Public endpoint — no auth required to download the API reference collection
  const groups = [...new Set(ROUTES.map(r => r.group))]

  const collection = {
    info: {
      name: 'GeiG Simple Web Service (GSWS) API',
      description: 'Auto-generated from the GSWS API Reference. Set the clientId/clientSecret collection variables to your API credentials from Account > API Credentials.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'https://sws.geig.co.uk', type: 'string' },
      { key: 'clientId', value: '', type: 'string' },
      { key: 'clientSecret', value: '', type: 'string' },
      { key: 'cronSecret', value: '', type: 'string' },
    ],
    item: groups.map(group => ({
      name: group,
      item: ROUTES.filter(r => r.group === group).map(buildItem),
    })),
  }

  return new NextResponse(JSON.stringify(collection, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="gsws-api-collection.json"',
    },
  })
}
