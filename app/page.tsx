'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import RegisterForm from './components/RegisterForm'

type Event = {
  id: string
  title: string
  date: string
  time_start: string
  time_end: string
  capacity: number
  party_fee: number
  party_time: string
  status: string
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      const { data: evts } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'open')
        .order('date', { ascending: true })
      if (evts) setEvents(evts)

      // 各回の確定参加者数を取得
      const { data: parts } = await supabase
        .from('participants')
        .select('event_id, status')
        .eq('status', 'confirmed')
      if (parts) {
        const c: Record<string, number> = {}
        parts.forEach(p => { c[p.event_id] = (c[p.event_id] || 0) + 1 })
        setCounts(c)
      }
    }
    load()
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['日','月','火','水','木','金','土']
    const m = d.getMonth() + 1
    const day = d.getDate()
    const dow = days[d.getDay()]
    return { month: m, day, dow, full: `${m}月${day}日（${dow}）` }
  }

  if (selectedEvent) {
    return <RegisterForm event={selectedEvent} onBack={() => setSelectedEvent(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a1628 0%,#0d2035 50%,#0a1628 100%)', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '40px 20px' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
        <h1 style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 900, margin: 0, marginBottom: 8 }}>シリカ製造工場<br />無料見学会</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>参加をご希望の回をお選びください</p>
      </div>

      {/* イベントカード一覧 */}
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column' as const, gap: 16, marginBottom: 48 }}>
        {events.map((evt, i) => {
          const { month, day, dow, full } = formatDate(evt.date)
          const confirmed = counts[evt.id] || 0
          const remaining = evt.capacity - confirmed
          const pct = Math.round((confirmed / evt.capacity) * 100)
          const isFull = remaining <= 0
          const isAlmostFull = remaining <= 10 && remaining > 0
          const labels = ['第1回', '第2回', '第3回', '第4回']
          const colors = [
            { main: '#3b82f6', dark: '#1d4ed8', glow: 'rgba(59,130,246,0.2)' },
            { main: '#10b981', dark: '#047857', glow: 'rgba(16,185,129,0.2)' },
            { main: '#f59e0b', dark: '#b45309', glow: 'rgba(245,158,11,0.2)' },
            { main: '#8b5cf6', dark: '#6d28d9', glow: 'rgba(139,92,246,0.2)' },
          ]
          const C = colors[i] || colors[0]

          return (
            <div
              key={evt.id}
              onClick={() => !isFull && setSelectedEvent(evt)}
              style={{ background: '#111827', borderRadius: 16, border: `1.5px solid ${isFull ? 'rgba(255,255,255,0.06)' : C.main + '60'}`, boxShadow: isFull ? 'none' : `0 4px 24px ${C.glow}`, cursor: isFull ? 'not-allowed' : 'pointer', overflow: 'hidden', opacity: isFull ? 0.6 : 1, transition: 'transform 0.15s', }}
              onMouseEnter={e => { if (!isFull) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              {/* カラーバー */}
              <div style={{ height: 4, background: isFull ? '#334155' : `linear-gradient(90deg, ${C.main}, ${C.dark})` }} />

              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: C.main, background: C.main + '20', border: `1px solid ${C.main}40`, borderRadius: 6, padding: '3px 10px', letterSpacing: '0.05em' }}>{labels[i]}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>{full}</span>
                  </div>
                  {isFull
                    ? <span style={{ fontSize: 11, fontWeight: 900, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '3px 10px' }}>満員</span>
                    : isAlmostFull
                    ? <span style={{ fontSize: 11, fontWeight: 900, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 10px' }}>残り{remaining}名</span>
                    : <span style={{ fontSize: 11, color: '#64748b' }}>残り{remaining}名</span>
                  }
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 14, color: '#94a3b8', fontSize: 13 }}>
                  <span>🕐 {evt.time_start}〜{evt.time_end}</span>
                  <span>👥 定員{evt.capacity}名</span>
                </div>

                {/* プログレスバー */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: isFull ? '#ef4444' : `linear-gradient(90deg,${C.main},${C.dark})`, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>🍻 懇親会あり（任意参加）</span>
                  {!isFull && (
                    <span style={{ fontSize: 13, fontWeight: 900, color: C.main }}>申込む →</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* フッター注記 */}
      <div style={{ color: '#334155', fontSize: 11, textAlign: 'center', lineHeight: 1.8 }}>
        <p style={{ margin: 0 }}>参加費：無料　／　懇親会：3,000円（任意）</p>
        <p style={{ margin: 0 }}>会場：愛知県一宮市内（詳細は担当販売者にお問い合わせください）</p>
      </div>
    </div>
  )
}
