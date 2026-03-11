'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get('eventId')

  const [event, setEvent] = useState<Event | null>(null)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [party, setParty] = useState(false)
  const [shopName, setShopName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!eventId) return
    const load = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      if (data) setEvent(data)
    }
    load()
  }, [eventId])

  const handleSubmit = async () => {
    if (!lastName || !firstName || !email) {
      setError('姓・名・メールアドレスは必須です')
      return
    }
    setLoading(true)
    setError('')

    const { error: dbError } = await supabase
      .from('participants')
      .insert({
        event_id: eventId,
        last_name: lastName,
        first_name: firstName,
        email,
        phone,
        party,
        shop_name: shopName,
        status: 'confirmed',
      })

    if (dbError) {
      setError('登録に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        lastName,
        firstName,
        eventTitle: event?.title ?? '',
        eventDate: event?.date ?? '',
        eventTime: event ? event.time_start + ' ～ ' + event.time_end : '',
        shopName,
        party,
      }),
    })

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#fff', fontSize: 22, marginBottom: 12 }}>お申込みが完了しました</h2>
          <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            確認メールを送信しました。<br />
            ご登録のメールアドレスをご確認ください。
          </p>
          <button
            onClick={() => router.push('/')}
            style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 15, cursor: 'pointer' }}
          >
            トップページへ戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '40px 24px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}>
          ← 戻る
        </button>

        {event && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 20px', marginBottom: 28 }}>
            <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>申込イベント</div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{event.title}</div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{event.date}　{event.time_start} ～ {event.time_end}</div>
          </div>
        )}

        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 28 }}>参加申込フォーム</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 6 }}>姓 <span style={{ color: '#f87' }}>*</span></label>
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="山田"
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 6 }}>名 <span style={{ color: '#f87' }}>*</span></label>
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="太郎"
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 6 }}>メールアドレス <span style={{ color: '#f87' }}>*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 6 }}>電話番号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="090-0000-0000"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 6 }}>担当販売店名</label>
            <input
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              placeholder="（なければ空白でOK）"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>

          {event && event.party_fee > 0 && (
            <div
              onClick={() => setParty(!party)}
              style={{ background: party ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.04)', border: party ? '1px solid #4f8ef7' : '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 4, background: party ? '#4f8ef7' : 'transparent', border: party ? 'none' : '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {party && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 14 }}>🍺 懇親会に参加する（任意）</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{event.party_time}　参加費 ¥{event.party_fee.toLocaleString()}</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(248,68,68,0.1)', border: '1px solid rgba(248,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f87', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: loading ? '#444' : '#4f8ef7', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}
          >
            {loading ? '送信中...' : '申込を確定する'}
          </button>
        </div>
      </div>
    </div>
  )
}
