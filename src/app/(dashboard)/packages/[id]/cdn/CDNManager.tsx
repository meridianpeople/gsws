'use client'
import { useState } from 'react'

const RISK_COLORS: Record<string, { bg: string; color: string }> = {
  low:    { bg: '#eaf3de', color: '#3b6d11' },
  medium: { bg: '#faeeda', color: '#854f0b' },
  high:   { bg: '#fcebeb', color: '#a32d2d' },
}

const COUNTRIES: Record<string, string> = {
  AF:'Afghanistan',AX:'Åland Islands',AL:'Albania',DZ:'Algeria',AS:'American Samoa',
  AD:'Andorra',AO:'Angola',AI:'Anguilla',AQ:'Antarctica',AG:'Antigua and Barbuda',
  AR:'Argentina',AM:'Armenia',AW:'Aruba',AU:'Australia',AT:'Austria',
  AZ:'Azerbaijan',BS:'Bahamas',BH:'Bahrain',BD:'Bangladesh',BB:'Barbados',
  BY:'Belarus',BE:'Belgium',BZ:'Belize',BJ:'Benin',BM:'Bermuda',
  BT:'Bhutan',BO:'Bolivia',BQ:'Bonaire',BA:'Bosnia and Herzegovina',BW:'Botswana',
  BV:'Bouvet Island',BR:'Brazil',IO:'British Indian Ocean Territory',BN:'Brunei',
  BG:'Bulgaria',BF:'Burkina Faso',BI:'Burundi',CV:'Cabo Verde',KH:'Cambodia',
  CM:'Cameroon',CA:'Canada',KY:'Cayman Islands',CF:'Central African Republic',
  TD:'Chad',CL:'Chile',CN:'China',CX:'Christmas Island',CC:'Cocos Islands',
  CO:'Colombia',KM:'Comoros',CG:'Congo',CD:'Congo (DRC)',CK:'Cook Islands',
  CR:'Costa Rica',CI:'Cote dIvoire',HR:'Croatia',CU:'Cuba',CW:'Curaçao',
  CY:'Cyprus',CZ:'Czech Republic',DK:'Denmark',DJ:'Djibouti',DM:'Dominica',
  DO:'Dominican Republic',EC:'Ecuador',EG:'Egypt',SV:'El Salvador',GQ:'Equatorial Guinea',
  ER:'Eritrea',EE:'Estonia',SZ:'Eswatini',ET:'Ethiopia',FK:'Falkland Islands',
  FO:'Faroe Islands',FJ:'Fiji',FI:'Finland',FR:'France',GF:'French Guiana',
  PF:'French Polynesia',GA:'Gabon',GM:'Gambia',GE:'Georgia',DE:'Germany',
  GH:'Ghana',GI:'Gibraltar',GR:'Greece',GL:'Greenland',GD:'Grenada',
  GP:'Guadeloupe',GU:'Guam',GT:'Guatemala',GG:'Guernsey',GN:'Guinea',
  GW:'Guinea-Bissau',GY:'Guyana',HT:'Haiti',HM:'Heard Island',VA:'Holy See',
  HN:'Honduras',HK:'Hong Kong',HU:'Hungary',IS:'Iceland',IN:'India',
  ID:'Indonesia',IR:'Iran',IQ:'Iraq',IE:'Ireland',IM:'Isle of Man',
  IL:'Israel',IT:'Italy',JM:'Jamaica',JP:'Japan',JE:'Jersey',
  JO:'Jordan',KZ:'Kazakhstan',KE:'Kenya',KI:'Kiribati',KP:'North Korea',
  KR:'South Korea',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',LV:'Latvia',
  LB:'Lebanon',LS:'Lesotho',LR:'Liberia',LY:'Libya',LI:'Liechtenstein',
  LT:'Lithuania',LU:'Luxembourg',MO:'Macao',MG:'Madagascar',MW:'Malawi',
  MY:'Malaysia',MV:'Maldives',ML:'Mali',MT:'Malta',MH:'Marshall Islands',
  MQ:'Martinique',MR:'Mauritania',MU:'Mauritius',YT:'Mayotte',MX:'Mexico',
  FM:'Micronesia',MD:'Moldova',MC:'Monaco',MN:'Mongolia',ME:'Montenegro',
  MS:'Montserrat',MA:'Morocco',MZ:'Mozambique',MM:'Myanmar',NA:'Namibia',
  NR:'Nauru',NP:'Nepal',NL:'Netherlands',NC:'New Caledonia',NZ:'New Zealand',
  NI:'Nicaragua',NE:'Niger',NG:'Nigeria',NU:'Niue',NF:'Norfolk Island',
  MK:'North Macedonia',MP:'Northern Mariana Islands',NO:'Norway',OM:'Oman',
  PK:'Pakistan',PW:'Palau',PS:'Palestine',PA:'Panama',PG:'Papua New Guinea',
  PY:'Paraguay',PE:'Peru',PH:'Philippines',PN:'Pitcairn',PL:'Poland',
  PT:'Portugal',PR:'Puerto Rico',QA:'Qatar',RE:'Réunion',RO:'Romania',
  RU:'Russia',RW:'Rwanda',BL:'Saint Barthélemy',SH:'Saint Helena',
  KN:'Saint Kitts and Nevis',LC:'Saint Lucia',MF:'Saint Martin',
  PM:'Saint Pierre and Miquelon',VC:'Saint Vincent',WS:'Samoa',SM:'San Marino',
  ST:'Sao Tome and Principe',SA:'Saudi Arabia',SN:'Senegal',RS:'Serbia',
  SC:'Seychelles',SL:'Sierra Leone',SG:'Singapore',SX:'Sint Maarten',
  SK:'Slovakia',SI:'Slovenia',SB:'Solomon Islands',SO:'Somalia',
  ZA:'South Africa',GS:'South Georgia',SS:'South Sudan',ES:'Spain',
  LK:'Sri Lanka',SD:'Sudan',SR:'Suriname',SJ:'Svalbard',SE:'Sweden',
  CH:'Switzerland',SY:'Syria',TW:'Taiwan',TJ:'Tajikistan',TZ:'Tanzania',
  TH:'Thailand',TL:'Timor-Leste',TG:'Togo',TK:'Tokelau',TO:'Tonga',
  TT:'Trinidad and Tobago',TN:'Tunisia',TR:'Turkey',TM:'Turkmenistan',
  TC:'Turks and Caicos Islands',TV:'Tuvalu',UG:'Uganda',UA:'Ukraine',
  AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',
  UM:'US Minor Outlying Islands',UY:'Uruguay',UZ:'Uzbekistan',VU:'Vanuatu',
  VE:'Venezuela',VN:'Vietnam',VG:'British Virgin Islands',VI:'US Virgin Islands',
  WF:'Wallis and Futuna',EH:'Western Sahara',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe',
}

const CACHE_DURATIONS = [
  { value: 'A3600', label: '1 hour' },
  { value: 'A21600', label: '6 hours' },
  { value: 'A43200', label: '12 hours' },
  { value: 'A86400', label: '1 day' },
  { value: 'A604800', label: '1 week' },
  { value: 'A2592000', label: '30 days' },
]

export default function CDNManager({ packageId, domainName, cdnOptions, cdnStats, cdnHeaders, initialBlockedCountries, initialBlockedIps, stackCache }: {
  packageId: string
  domainName: string
  cdnOptions: any[]
  cdnStats: any
  cdnHeaders: any[]
  initialBlockedCountries: any
  initialBlockedIps: string[]
  stackCache: any
}) {
  const [tab, setTab] = useState<'caching' | 'optimisation' | 'security' | 'blocking' | 'stats'>('caching')
  const [options, setOptions] = useState<any[]>(cdnOptions)
  const [saving, setSaving] = useState<any>(null)
  const [purging, setPurging] = useState(false)
  const [purgeUrl, setPurgeUrl] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Blocking state
  const [blockedCountries, setBlockedCountries] = useState<string[]>(initialBlockedCountries?.countries || [])
  const [blockType, setBlockType] = useState<'allow' | 'block'>(initialBlockedCountries?.type === 'allow' ? 'allow' : 'block')
  const [blockedIps, setBlockedIps] = useState<string[]>(initialBlockedIps)
  const [newCountry, setNewCountry] = useState('')
  const [newIp, setNewIp] = useState('')
  const [savingBlock, setSavingBlock] = useState(false)

  // Cache state
  const [cache, setCache] = useState(stackCache)
  const [savingCache, setSavingCache] = useState(false)

  function switchTab(t: typeof tab) {
    setTab(t)
    history.replaceState(null, '', window.location.pathname + '#cdn-' + t)
  }

  const totalHits24h = Object.values(cdnStats?.Last24Hours?.Hits || {}).reduce((a: any, b: any) => a + b, 0) as number
  const totalBW24h = Object.values(cdnStats?.Last24Hours?.Bandwidth || {}).reduce((a: any, b: any) => a + b, 0) as number
  const enabledCount = options.filter(o => o.Enabled === 'true').length

  async function post(path: string, body: any) {
    const res = await fetch(`/api/packages/${packageId}/cdn/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    return data
  }

  async function handleToggleFeature(feature: any) {
    setSaving(feature.CdnFeatureId)
    const newEnabled = feature.Enabled === 'true' ? 'false' : 'true'
    try {
      await post('feature', { featureId: feature.CdnFeatureId, feature: feature.Feature, enabled: newEnabled === 'true' })
      setOptions(opts => opts.map(o => o.CdnFeatureId === feature.CdnFeatureId ? { ...o, Enabled: newEnabled } : o))
      setSuccess(`${feature.Feature} ${newEnabled === 'true' ? 'enabled' : 'disabled'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message); setTimeout(() => setError(''), 4000) }
    setSaving(null)
  }

  async function handlePurgeAll() {
    if (!confirm('Purge entire CDN cache? This may temporarily slow your site.')) return
    setPurging(true)
    try {
      await post('purge', {})
      setSuccess('CDN cache purged successfully')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) { setError(err.message) }
    setPurging(false)
  }

  async function handlePurgeUrl() {
    if (!purgeUrl) return
    setPurging(true)
    try {
      await post('purge', { url: purgeUrl })
      setSuccess(`Cache purged for ${purgeUrl}`)
      setPurgeUrl('')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) { setError(err.message) }
    setPurging(false)
  }

  async function handleSaveCache() {
    setSavingCache(true)
    try {
      await post('cache', cache)
      setSuccess('Cache settings saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setSavingCache(false)
  }

  async function handleSaveCountries() {
    setSavingBlock(true)
    try {
      await post('block/countries', { access: blockType, countries: blockedCountries })
      setSuccess('Country blocking updated')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setSavingBlock(false)
  }

  async function handleSaveIps() {
    setSavingBlock(true)
    try {
      await post('block/ips', { ip_addresses: blockedIps })
      setSuccess('IP blocking updated')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setSavingBlock(false)
  }

  const last24Hits = cdnStats?.Last24Hours?.Hits || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'CDN hits (24h)', value: totalHits24h.toLocaleString(), icon: '📊' },
          { label: 'Bandwidth (24h)', value: `${(totalBW24h / 1024 / 1024).toFixed(1)} MB`, icon: '📡' },
          { label: 'Features on', value: `${enabledCount}/${options.length}`, icon: '⚡' },
          { label: 'Blocked countries', value: String(blockedCountries.length), icon: '🚫' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <p style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--card-border)', overflowX: 'auto' }}>
        {[
          { key: 'caching', label: '💾 Edge caching' },
          { key: 'optimisation', label: `⚡ Web optimisation (${enabledCount} on)` },
          { key: 'security', label: '🛡️ Security headers' },
          { key: 'blocking', label: '🚫 Block visitors' },
          { key: 'stats', label: '📊 Statistics' },
        ].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key as any)}
            style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#1a6ef5' : '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.key ? '#1a6ef5' : 'transparent'}`, marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* EDGE CACHING TAB */}
      {tab === 'caching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Purge cache */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>🗑️ Purge cache</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Clear cached files and force edge servers to fetch fresh copies from your site.</p>
            <div style={{ padding: '10px 14px', background: '#faeeda', borderRadius: '6px', fontSize: '12px', color: '#854f0b', marginBottom: '14px' }}>
              ⚠️ Purging cache may temporarily slow your website while it rebuilds.
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Purge specific URL (optional)</label>
                <input value={purgeUrl} onChange={e => setPurgeUrl(e.target.value)}
                  placeholder={`https://${domainName}/path/to/file.css`}
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handlePurgeUrl} disabled={purging || !purgeUrl}
                style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, opacity: !purgeUrl ? 0.5 : 1 }}>
                Purge URL
              </button>
            </div>
            <button onClick={handlePurgeAll} disabled={purging}
              style={{ height: '36px', padding: '0 20px', background: '#a32d2d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: purging ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: purging ? 0.7 : 1 }}>
              {purging ? 'Purging…' : 'Purge everything'}
            </button>
          </div>

          {/* Custom cache settings */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>⚙️ Custom cache settings</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Control how long different file types are cached at the edge.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { key: 'images', label: '🖼️ Image cache', desc: 'PNG, JPG, GIF, WebP etc.' },
                { key: 'css', label: '🎨 CSS cache', desc: 'Stylesheets and fonts' },
                { key: 'javascript', label: '⚡ JavaScript cache', desc: 'JS files and scripts' },
              ].map(item => (
                <div key={item.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>{item.label}</label>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.desc}</p>
                  <select value={cache[item.key] || 'A86400'} onChange={e => setCache((c: any) => ({ ...c, [item.key]: e.target.value }))}
                    style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 8px' }}>
                    {CACHE_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={handleSaveCache} disabled={savingCache}
              style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingCache ? 0.7 : 1 }}>
              {savingCache ? 'Saving…' : 'Save cache settings'}
            </button>
          </div>
        </div>
      )}

      {/* WEB OPTIMISATION TAB */}
      {tab === 'optimisation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px 16px', background: '#e8f0fe', borderRadius: '8px', fontSize: '12px', color: '#185fa5' }}>
            ℹ️ These optimisations are applied at the CDN edge. Higher risk features may break some sites — test carefully.
          </div>
          {['html', 'css', 'javascript', 'images'].map(cls => {
            const clsOptions = options.filter(o => o.OptimisationClass === cls)
            if (clsOptions.length === 0) return null
            const clsIcons: Record<string, string> = { html: '📄', css: '🎨', javascript: '⚡', images: '🖼️' }
            return (
              <div key={cls} className="gsws-card">
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'capitalize' }}>
                  {clsIcons[cls]} {cls} optimisations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {clsOptions.map((feature: any) => {
                    const rc = RISK_COLORS[feature.RiskLevel] || RISK_COLORS.low
                    const isEnabled = feature.Enabled === 'true'
                    return (
                      <div key={feature.CdnFeatureId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: isEnabled ? '#f0f9e8' : '#f7f7f7', border: `1px solid ${isEnabled ? '#c0dd97' : '#ebebeb'}`, borderRadius: '6px' }}>
                        <div style={{ flex: 1, marginRight: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace' }}>{feature.Feature}</span>
                            <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 500, background: rc.bg, color: rc.color }}>{feature.RiskLevel}</span>
                          </div>
                        </div>
                        <div onClick={() => handleToggleFeature(feature)}
                          style={{ width: '40px', height: '22px', borderRadius: '11px', background: isEnabled ? '#1a6ef5' : '#d4d4d4', position: 'relative', cursor: saving === feature.CdnFeatureId ? 'wait' : 'pointer', transition: 'background 0.2s', flexShrink: 0, opacity: saving === feature.CdnFeatureId ? 0.5 : 1 }}>
                          <div style={{ position: 'absolute', top: '2px', left: isEnabled ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--card-bg)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* SECURITY HEADERS TAB */}
      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Active security headers ({cdnHeaders.length})
            </h3>
            {cdnHeaders.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--card-border-hover)', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No security headers configured yet.</p>
              </div>
            ) : (
              <table className="gsws-table">
                <thead><tr><th>Header</th><th>Value</th><th></th></tr></thead>
                <tbody>
                  {cdnHeaders.map((h: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{h.header || h.name}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#5a5a5a' }}>{h.value}</td>
                      <td><button style={{ padding: '0 8px', height: '22px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Recommended security headers</h3>
            {[
              { header: 'X-Frame-Options', value: 'SAMEORIGIN', desc: 'Prevents clickjacking' },
              { header: 'X-Content-Type-Options', value: 'nosniff', desc: 'Prevents MIME sniffing' },
              { header: 'X-XSS-Protection', value: '1; mode=block', desc: 'Browser XSS filter' },
              { header: 'Referrer-Policy', value: 'strict-origin-when-cross-origin', desc: 'Controls referrer data' },
              { header: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains', desc: 'Forces HTTPS' },
            ].map(r => (
              <div key={r.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{r.header}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{r.desc}</p>
                </div>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: '#5a5a5a', fontSize: '11px', flexShrink: 0 }}>{r.value}</span>
                <button onClick={async () => {
                  try {
                    await post('headers', { header: r.header, value: r.value })
                    setSuccess(`${r.header} added`)
                    setTimeout(() => setSuccess(''), 3000)
                  } catch (err: any) { setError(err.message) }
                }} style={{ height: '26px', padding: '0 10px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, fontWeight: 600 }}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BLOCK VISITORS TAB */}
      {tab === 'blocking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Block by country */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>🌍 Block by country</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Block or allow visitors based on their country using GeoIP data.</p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
              {[
                { value: 'block', label: 'Block All Except', desc: 'Block everyone except selected countries' },
                { value: 'allow', label: 'Allow All Except', desc: 'Allow everyone except selected countries' },
              ].map(opt => (
                <div key={opt.value} onClick={() => setBlockType(opt.value as any)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${blockType === opt.value ? '#1a6ef5' : '#ebebeb'}`, background: blockType === opt.value ? '#e8f0fe' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${blockType === opt.value ? '#1a6ef5' : '#d4d4d4'}`, background: blockType === opt.value ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {blockType === opt.value && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--card-bg)' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{opt.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={newCountry} onChange={e => setNewCountry(e.target.value)}
                style={{ flex: 1, height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 8px' }}>
                <option value="">Select country…</option>
                {Object.entries(COUNTRIES).filter(([code]) => !blockedCountries.includes(code)).map(([code, name]) => (
                  <option key={code} value={code}>{name} ({code})</option>
                ))}
              </select>
              <button onClick={() => { if (newCountry) { setBlockedCountries(c => [...c, newCountry]); setNewCountry('') } }}
                disabled={!newCountry}
                style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newCountry ? 0.5 : 1 }}>
                Add
              </button>
            </div>

            {blockedCountries.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {blockedCountries.map((code: string) => (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: '#fcebeb', borderRadius: '20px', border: '1px solid #f5c1c1' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#a32d2d' }}>{COUNTRIES[code] || code}</span>
                    <button onClick={() => setBlockedCountries(c => c.filter(x => x !== code))}
                      style={{ background: 'none', border: 'none', color: '#a32d2d', cursor: 'pointer', fontSize: '14px', padding: '0', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>No countries selected.</p>
            )}

            <button onClick={handleSaveCountries} disabled={savingBlock}
              style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingBlock ? 0.7 : 1 }}>
              {savingBlock ? 'Saving…' : 'Save country rules'}
            </button>
          </div>

          {/* Block by IP */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>🔒 Block by IP address</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Block IPv4, IPv6 addresses or CIDR ranges (e.g. 192.168.0.0/24).
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input value={newIp} onChange={e => setNewIp(e.target.value)}
                placeholder="e.g. 192.168.0.1 or 192.168.0.0/24"
                style={{ flex: 1, height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
              <button onClick={() => { if (newIp) { setBlockedIps(ips => [...ips, newIp]); setNewIp('') } }}
                disabled={!newIp}
                style={{ height: '34px', padding: '0 16px', background: '#a32d2d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newIp ? 0.5 : 1 }}>
                Block IP
              </button>
            </div>

            {blockedIps.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>No IP addresses blocked.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                {blockedIps.map((ip: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#fcebeb', borderRadius: '6px' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#a32d2d' }}>{ip}</span>
                    <button onClick={() => setBlockedIps(ips => ips.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#a32d2d', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSaveIps} disabled={savingBlock}
              style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingBlock ? 0.7 : 1 }}>
              {savingBlock ? 'Saving…' : 'Save IP rules'}
            </button>
          </div>
        </div>
      )}

      {/* STATISTICS TAB */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.keys(last24Hits).length > 0 ? (
            <div className="gsws-card">
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>CDN hits — last 24 hours</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px', marginBottom: '6px' }}>
                {Object.entries(last24Hits).map(([time, hits]: any) => {
                  const maxHits = Math.max(...Object.values(last24Hits) as number[])
                  const height = maxHits > 0 ? Math.max(4, (hits / maxHits) * 80) : 4
                  return (
                    <div key={time} title={`${time.split(' ')[1]?.substring(0, 5)}: ${hits} hits`}
                      style={{ flex: 1, height: `${height}px`, background: '#1a6ef5', borderRadius: '2px 2px 0 0', opacity: 0.8, cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span>24h ago</span>
                <span style={{ fontWeight: 600, color: '#1a6ef5' }}>{totalHits24h.toLocaleString()} total hits</span>
                <span>now</span>
              </div>
            </div>
          ) : (
            <div className="gsws-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '32px', marginBottom: '10px' }}>📊</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No CDN traffic yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>CDN statistics will appear once traffic flows through the network.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="gsws-card">
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>24h summary</h3>
              {[
                ['Total hits', totalHits24h.toLocaleString()],
                ['Bandwidth served', `${(totalBW24h / 1024 / 1024).toFixed(2)} MB`],
                ['Features active', `${enabledCount} of ${options.length}`],
                ['Countries blocked', String(blockedCountries.length)],
                ['IPs blocked', String(blockedIps.length)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="gsws-card">
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Cache settings</h3>
              {[
                ['Images', CACHE_DURATIONS.find(d => d.value === cache.images)?.label || '1 day'],
                ['CSS', CACHE_DURATIONS.find(d => d.value === cache.css)?.label || '1 day'],
                ['JavaScript', CACHE_DURATIONS.find(d => d.value === cache.javascript)?.label || '1 day'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
