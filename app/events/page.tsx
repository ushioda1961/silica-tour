'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Event = {
  id: string
  title: string
  date: string
  time_start: string
  time_end: string
  capacity: number
  fee: number
  party_fee: number
  status: string
  location?: string
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = days[d.getDay()]
  return `${y}年${m}月${day}日（${dow}）`
}

const formatTime = (t: string) => t?.slice(0, 5) || ''

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    const { data: evData } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'open')
      .order('date', { ascending: true })

    if (evData) {
      setEvents(evData)

      const countMap: Record<string, number> = {}
      for (const ev of evData) {
        const { data: pData } = await supabase
          .from('participants')
          .select('id, companions(id)')
          .eq('event_id', ev.id)
          .eq('status', 'confirmed')
        if (pData) {
          countMap[ev.id] = pData.reduce((sum: number, p: any) => {
            return sum + 1 + (p.companions?.length || 0)
          }, 0)
        }
      }
      setCounts(countMap)
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', fontSize: 16, color: '#2d7a4a' }}>
      読み込み中...
    </div>
  )

  return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: 'linear-gradient(170deg,#e8f4ff 0%,#f0f8ee 60%,#fffbe8 100%)', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', padding: '0 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏭</div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>FACTORY TOUR REGISTRATION</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>工場見学会 参加申込</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '26px 18px 64px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a3a2a', marginBottom: 6, textAlign: 'center' }}>開催日程を選んでください</h2>
        <p style={{ fontSize: 13, color: '#6a8070', textAlign: 'center', marginBottom: 24 }}>参加ご希望の日程の「申込む」ボタンを押してください</p>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', padding: '60px 0' }}>現在申込可能なイベントはありません</div>
        )}

        {events.map(ev => {
          const count = counts[ev.id] || 0
          const remaining = ev.capacity - count
          const isFull = remaining <= 0
          const fillPct = Math.round((count / ev.capacity) * 100)

          return (
            <div key={ev.id} style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', marginBottom: 16, boxShadow: '0 2px 14px rgba(30,80,50,0.08)', border: `2px solid ${isFull ? '#fca5a5' : '#d4eadc'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#2d7a4a', marginBottom: 6 }}>🏭 シリカ製造工場 無料見学会</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1a3a2a', marginBottom: 4 }}>
                    📅 {formatDate(ev.date)}
                  </div>
                  <div style={{ fontSize: 13, color: '#445', marginBottom: 4 }}>
                    ⏰ {formatTime(ev.time_start)}〜{formatTime(ev.time_end)}
                  </div>
                  <div style={{ fontSize: 12, color: '#6a8070', marginBottom: 4 }}>
                    🎫 参加費：{ev.fee === 0 ? '無料' : `¥${ev.fee.toLocaleString()}`}
                  </div>
                  {ev.party_fee > 0 && (
                    <div style={{ fontSize: 12, color: '#1a7a4a', fontWeight: 600 }}>
                      🍻 懇親会あり（¥{ev.party_fee.toLocaleString()}）
                    </div>
                  )}
                  {ev.location && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>📍 {ev.location}</div>
                  )}
                </div>
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: '#888' }}>残り枠</div>
                  <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: isFull ? '#ef4444' : remaining <= 5 ? '#f59e0b' : '#2d7a4a' }}>
                    {remaining}<span style={{ fontSize: 12, color: '#aaa', marginLeft: 1 }}>名</span>
                  </div>
                  <div style={{ height: 5, width: 70, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', margin: '6px auto 4px' }}>
                    <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#ef4444' : fillPct >= 80 ? '#f59e0b' : '#2d7a4a', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>{count}/{ev.capacity}名</div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => router.push(`/?event_id=${ev.id}`)}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 11,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 800,
                    background: isFull
                      ? 'linear-gradient(135deg,#92400e,#b45309)'
                      : 'linear-gradient(135deg,#1a3a2a,#2d7a4a)',
                    color: '#fff',
                  }}
                >
                  {isFull ? 'キャンセル待ちで申込む →' : 'この日程で申込む →'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
