'use client'
import { useEffect, useRef, useState } from 'react'

export default function CLIPage() {
  const termRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Welcome message
    appendOutput('\x1b[1;36mGSWS Web CLI\x1b[0m — Type \x1b[1mhelp\x1b[0m to get started\n')
    appendOutput('\x1b[90mAll commands are logged for security and audit purposes.\x1b[0m\n\n')
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  function appendOutput(text: string) {
    setLines(prev => [...prev, text])
  }

  function makeLinksClickable(html: string): string {
    // Make /support/session?token=... clickable
    return html.replace(
      /(\/support\/session\?token=[a-f0-9]+)/g,
      '<a href="$1" target="_blank" style="color:#22d3ee;text-decoration:underline;cursor:pointer">$1</a>'
    )
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
      .replace(/\x1b\[2J\x1b\[H/g, '') // clear screen handled separately
      .replace(/\n/g, '<br/>')
  }

  async function runCommand(cmd: string) {
    if (!cmd.trim()) return
    
    // Add to history
    setHistory(prev => [cmd, ...prev.slice(0, 49)])
    setHistoryIdx(-1)

    // Show command in terminal
    appendOutput(`\x1b[1;32m$\x1b[0m \x1b[1m${cmd}\x1b[0m\n`)

    if (cmd.trim() === 'clear') {
      setLines([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      const data = await res.json()
      if (data.output) appendOutput(data.output)
      if (data.error) appendOutput(`\x1b[31m${data.error}\x1b[0m\n`)
    } catch {
      appendOutput('\x1b[31mConnection error\x1b[0m\n')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      runCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = historyIdx + 1
      if (idx < history.length) {
        setHistoryIdx(idx)
        setInput(history[idx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = historyIdx - 1
      if (idx < 0) { setHistoryIdx(-1); setInput('') }
      else { setHistoryIdx(idx); setInput(history[idx]) }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Basic tab completion
      const cmds = ['help', 'balance', 'packages', 'domains', 'notifications', 'statement', 'package', 'whoami', 'clear', 'stats', 'audit', 'customer', 'support', 'compute', 'vps', 'gpu', 'credit', 'user', 'coupon', 'impersonate', 'sessions', 'version']
      const match = cmds.find(c => c.startsWith(input))
      if (match) setInput(match)
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: 0 }}>Web CLI</h1>
          <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0' }}>Command line interface — all actions are logged</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#facc15' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }} />
        </div>
      </div>

      {/* Terminal window */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1, background: '#0a0a0a', borderRadius: '10px', border: '1px solid #1a1a1a',
          padding: '16px', overflowY: 'auto', cursor: 'text',
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          fontSize: '13px', lineHeight: '1.6',
        }}
      >
        {/* Output lines */}
        {lines.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: makeLinksClickable(ansiToHtml(line)) }} style={{ color: '#e5e5e5', minHeight: '1px' }} />
        ))}

        {/* Input line */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ color: '#4ade80', fontWeight: 700, marginRight: '8px', whiteSpace: 'nowrap' }}>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#e5e5e5', fontFamily: 'inherit', fontSize: 'inherit',
              caretColor: '#4ade80',
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {loading && <span style={{ color: '#6b7280', fontSize: '11px' }}>running...</span>}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
