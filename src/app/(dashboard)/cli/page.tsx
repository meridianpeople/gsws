'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
// xterm loaded dynamically to avoid SSR issues

interface Service {
  id: string
  name: string
  type: 'cli' | 'hosting' | 'vps' | 'gpu'
  packageId?: string
  orderId?: string
}

export default function TerminalPage() {
  const termRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<any>(null)
  const fitRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'cli' | 'ssh'>('cli')
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  // CLI state
  const [lines, setLines] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const cliBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load services
    async function loadServices() {
      const svcs: Service[] = [{ id: 'cli', name: 'SWS Command Line', type: 'cli' }]
      try {
        const pkgs = await fetch('/api/packages/list').then(r => r.json())
        for (const p of pkgs.packages || []) {
          // Only show packages with SSH enabled (Linux/WordPress — not Windows)
          if (p.platform !== 'windows') {
            svcs.push({ id: `pkg_${p.id}`, name: p.name, type: 'hosting', packageId: p.id })
          }
        }
        const vps = await fetch('/api/compute/vps').then(r => r.json())
        for (const v of vps.orders || []) {
          if (v.status === 'active') svcs.push({ id: `vps_${v.id}`, name: v.service_key, type: 'vps', orderId: String(v.id) })
        }
        const gpu = await fetch('/api/compute/gpu').then(r => r.json())
        for (const g of gpu.orders || []) {
          if (g.status === 'active' && g.ssh_host) svcs.push({ id: `gpu_${g.id}`, name: `GPU #${g.id} · ${g.tier}`, type: 'gpu', orderId: String(g.id) })
        }
      } catch {}
      setServices(svcs)
      setSelectedService(svcs[0])
    }

    loadServices()

    // Welcome message for CLI
    appendCLI('\x1b[1;36mGSWS Terminal\x1b[0m — Type \x1b[1mhelp\x1b[0m for SWS commands or select a service above to open a shell\n')
    appendCLI('\x1b[90mAll actions are logged for security purposes.\x1b[0m\n\n')
  }, [])

  useEffect(() => {
    cliBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  // Xterm setup for SSH mode
  useEffect(() => {
    if (mode !== 'ssh' || !termRef.current) return
    if (xtermRef.current) return // already initialized

    async function initTerm() {
    const { Terminal } = await import('xterm')
    const { FitAddon } = await import('xterm-addon-fit')
    const { WebLinksAddon } = await import('xterm-addon-web-links')
    await import('xterm/css/xterm.css')
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#e5e5e5',
        cursor: '#4ade80',
        selectionBackground: 'rgba(74,222,128,0.3)',
      },
      scrollback: 5000,
    })

    const fit = new FitAddon()
    const links = new WebLinksAddon()
    term.loadAddon(fit)
    term.loadAddon(links)
    if (!termRef.current) return
    term.open(termRef.current)
    fit.fit()

    xtermRef.current = term
    fitRef.current = fit

    term.onData(data => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }))
      }
    })

    const handleResize = () => {
      fit.fit()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
      xtermRef.current = null
    }
    } // end initTerm
    initTerm()
  }, [mode])

  function appendCLI(text: string) {
    setLines(prev => [...prev, text])
  }

  function ansiToHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\x1b\[0m/g, '</span>')
      .replace(/\x1b\[1m/g, '<span style="font-weight:700">')
      .replace(/\x1b\[1;36m/g, '<span style="color:#22d3ee;font-weight:700">')
      .replace(/\x1b\[1;32m/g, '<span style="color:#4ade80;font-weight:700">')
      .replace(/\x1b\[1;33m/g, '<span style="color:#facc15;font-weight:700">')
      .replace(/\x1b\[32m/g, '<span style="color:#4ade80">')
      .replace(/\x1b\[31m/g, '<span style="color:#f87171">')
      .replace(/\x1b\[33m/g, '<span style="color:#facc15">')
      .replace(/\x1b\[36m/g, '<span style="color:#22d3ee">')
      .replace(/\x1b\[90m/g, '<span style="color:#6b7280">')
      .replace(/\n/g, '<br/>')
  }

  function makeLinksClickable(html: string): string {
    return html.replace(/(\/support\/session\?token=[a-f0-9]+)/g,
      '<a href="$1" target="_blank" style="color:#22d3ee;text-decoration:underline">$1</a>')
  }

  async function runCLICommand(cmd: string) {
    if (!cmd.trim()) return
    setHistory(prev => [cmd, ...prev.slice(0, 49)])
    setHistoryIdx(-1)
    appendCLI(`\x1b[1;32m$\x1b[0m \x1b[1m${cmd}\x1b[0m\n`)
    if (cmd.trim() === 'clear') { setLines([]); return }
    setLoading(true)
    try {
      const res = await fetch('/api/cli', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: cmd }) })
      const data = await res.json()
      if (data.output) appendCLI(data.output)
      if (data.error) appendCLI(`\x1b[31m${data.error}\x1b[0m\n`)
    } catch { appendCLI('\x1b[31mConnection error\x1b[0m\n') }
    finally { setLoading(false); inputRef.current?.focus() }
  }

  function handleCLIKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { runCLICommand(input); setInput('') }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const idx = historyIdx + 1; if (idx < history.length) { setHistoryIdx(idx); setInput(history[idx]) } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const idx = historyIdx - 1; if (idx < 0) { setHistoryIdx(-1); setInput('') } else { setHistoryIdx(idx); setInput(history[idx]) } }
    else if (e.key === 'Tab') { e.preventDefault(); const cmds = ['help', 'balance', 'packages', 'domains', 'notifications', 'statement', 'package', 'whoami', 'clear', 'stats', 'audit', 'customer', 'support', 'compute', 'vps', 'gpu', 'credit', 'user', 'coupon', 'impersonate', 'sessions', 'version']; const match = cmds.find(c => c.startsWith(input)); if (match) setInput(match) }
  }

  async function connectSSH(service: Service) {
    setConnecting(true)

    // Switch to SSH mode first to mount xterm
    setMode('ssh')
    setSelectedService(service)

    // Wait for xterm to mount
    await new Promise(r => setTimeout(r, 300))

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    let wsUrl = `${proto}//${host}/terminal/ws?t=${Date.now()}`

    if (service.type === 'hosting') wsUrl += `&packageId=${service.packageId}&type=hosting`
    else if (service.type === 'vps') wsUrl += `&orderId=${service.orderId}&type=vps`
    else if (service.type === 'gpu') wsUrl += `&orderId=${service.orderId}&type=gpu`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => { setConnected(true); setConnecting(false) }

    ws.binaryType = 'arraybuffer'
    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'control') {
            xtermRef.current?.writeln(`\r\n\x1b[90m[SWS] ${msg.msg}\x1b[0m`)
            return
          }
        } catch {}
        xtermRef.current?.write(event.data)
      } else {
        xtermRef.current?.write(new Uint8Array(event.data))
      }
    }

    ws.onclose = () => { setConnected(false); setConnecting(false); xtermRef.current?.writeln('\r\n\x1b[33m[Disconnected]\x1b[0m') }
    ws.onerror = () => { setConnecting(false); xtermRef.current?.writeln('\r\n\x1b[31m[Connection error]\x1b[0m') }
  }

  function disconnect() {
    wsRef.current?.close()
    setConnected(false)
    setMode('cli')
    setSelectedService(services[0] || null)
    xtermRef.current?.dispose()
    xtermRef.current = null
  }

  function handleServiceSelect(svc: Service) {
    setDropOpen(false)
    if (svc.type === 'cli') {
      disconnect()
      setMode('cli')
      setSelectedService(svc)
    } else {
      connectSSH(svc)
    }
  }

  const svcIcon = (type: string) => {
    if (type === 'cli') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
    if (type === 'hosting') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01"/></svg>
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><path d="M6 7h.01M10 7h4"/></svg>
  }

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Terminal</h1>
          <span style={{ fontSize: '11px', color: '#999', background: 'var(--card-bg-elevated)', padding: '2px 8px', borderRadius: '20px' }}>
            {mode === 'ssh' ? (connected ? '● Connected' : connecting ? '◌ Connecting...' : '○ Disconnected') : '● SWS CLI'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Service selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: '#333' }}
            >
              <span style={{ color: mode === 'cli' ? '#6366f1' : '#10b981' }}>{svcIcon(selectedService?.type || 'cli')}</span>
              {selectedService?.name || 'Select service'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {dropOpen && (
              <div style={{ position: 'absolute', right: 0, top: '36px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', minWidth: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
                {services.map(svc => (
                  <div
                    key={svc.id}
                    onClick={() => handleServiceSelect(svc)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', color: selectedService?.id === svc.id ? 'var(--text-primary)' : 'var(--text-tertiary)', background: selectedService?.id === svc.id ? 'var(--card-border)' : 'transparent', borderBottom: '1px solid var(--card-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedService?.id === svc.id ? 'var(--card-border)' : 'transparent')}
                  >
                    <span style={{ color: svc.type === 'cli' ? '#6366f1' : svc.type === 'vps' ? '#f59e0b' : svc.type === 'gpu' ? '#ef4444' : '#10b981' }}>{svcIcon(svc.type)}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{svc.name}</div>
                      <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>{svc.type === 'cli' ? 'SWS Commands' : svc.type === 'vps' ? 'VPS Shell' : svc.type === 'gpu' ? 'GPU Shell' : 'Hosting Shell'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {mode === 'ssh' && (
            <button onClick={disconnect} style={{ height: '32px', padding: '0 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#dc2626' }}>
              Disconnect
            </button>
          )}

          <div style={{ display: 'flex', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#facc15' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }} />
          </div>
        </div>
      </div>

      {/* Terminal window */}
      <div style={{ flex: 1, background: '#0a0a0a', borderRadius: '10px', border: '1px solid #1a1a1a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* SSH mode — xterm */}
        {mode === 'ssh' && (
          <div ref={termRef} style={{ flex: 1, padding: '8px' }} />
        )}

        {/* CLI mode */}
        {mode === 'cli' && (
          <div
            onClick={e => { if (window.getSelection()?.toString()) return; inputRef.current?.focus() }}
            style={{ flex: 1, padding: '16px', overflowY: 'auto', cursor: 'text', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '13px', lineHeight: '1.6' }}
          >
            {lines.map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: makeLinksClickable(ansiToHtml(line)) }} style={{ color: '#e5e5e5', minHeight: '1px', userSelect: 'text', WebkitUserSelect: 'text' } as any} />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ color: '#4ade80', fontWeight: 700, marginRight: '8px', whiteSpace: 'nowrap' }}>$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleCLIKey}
                disabled={loading}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e5e5e5', fontFamily: 'inherit', fontSize: 'inherit', caretColor: '#4ade80' }}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              />
              {loading && <span style={{ color: '#6b7280', fontSize: '11px' }}>running...</span>}
            </div>
            <div ref={cliBottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
