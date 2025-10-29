import React, { useMemo, useRef, useState, useEffect } from 'react'
import { BrowserChatRuntime } from '../web-runtime/BrowserChatRuntime'
import { TopView } from './TopView'

export const App: React.FC = () => {
  const runtimeRef = useRef<BrowserChatRuntime | null>(null)
  const [messages, setMessages] = useState<Array<{ who: 'you' | 'companion'; text: string }>>([])
  const [input, setInput] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const runtime = new BrowserChatRuntime({ companionId: 'hi_introvert' })
    runtimeRef.current = runtime

    // subscribe transcript
    const unsub = runtime.onTranscript((utt) => {
      if (utt.speaker === runtime.user.id) {
        setMessages(m => [...m, { who: 'you', text: utt.text }])
      } else if (utt.speaker === runtime.companion.id) {
        setMessages(m => [...m, { who: 'companion', text: utt.text }])
      }
    })

    const raf = setInterval(() => setTick(t => t + 1), 500)

    return () => { unsub(); clearInterval(raf); runtime.destroy() }
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || !runtimeRef.current) return
    setInput('')
    await runtimeRef.current.send(text)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', height: '100%' }}>
      <div style={{ borderRight: '1px solid #eee', padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Top View</h3>
        {runtimeRef.current && (
          <TopView world={runtimeRef.current.world} key={tick} />
        )}
        {runtimeRef.current && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            <div>Entities: {runtimeRef.current.world.entities.length}</div>
            <div>Lexicon: {runtimeRef.current.world.lexicon?.size ?? 0}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0 }}>hi, introvert — web</h3>
          <div style={{ fontSize: 12, color: '#666' }}>A simple browser chatroom + topview</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <b style={{ color: m.who === 'you' ? '#0066cc' : '#2a7f2a' }}>
                {m.who === 'you' ? 'You' : 'Companion'}:
              </b>{' '}
              <span>{m.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', padding: 16, borderTop: '1px solid #eee', gap: 8 }}>
          <input
            placeholder="Type something..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            style={{ flex: 1, padding: 8, fontSize: 14 }}
          />
          <button onClick={send} style={{ padding: '8px 14px' }}>Send</button>
        </div>
      </div>
    </div>
  )
}

