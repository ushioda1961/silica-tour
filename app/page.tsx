'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const EVENT_STATIC = {
  title: "ã·ãªã«è£½é å·¥å ´ ç¡æè¦å­¦ä¼",
  fee: "ç¡æ",
  type: "ç¾å°éåã»ç¾å°è§£æ£",
  parking: "é§è»å ´ã¯ããã¾ãã",
  deadline: "å®å¡ã¨ãªãæ¬¡ç¬¬ç· ãåãã¾ã",
  capacity: 50,
  party: { title: "è¦å­¦ä¼å¾ æè¦ªä¼", fee: 3000, time: "17:00ã19:00" },
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const days = ['æ¥', 'æ', 'ç«', 'æ°´', 'æ¨', 'é', 'å']
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = days[d.getDay()]
  return `${y}å¹´${m}æ${day}æ¥ï¼${dow}ï¼`
}

const formatTime = (t: string) => t?.slice(0, 5) || ''

const shops = [
  { id: "S01", name: "é«æ©æå­" },
  { id: "S02", name: "äºä¸äºç¢å­" },
  { id: "S03", name: "ä¸ç¢æºå­" },
  { id: "S04", name: "æ¾åè¯å­" },
  { id: "S05", name: "ä¼è¤ç¾å" },
  { id: "S06", name: "æ± å°¾éçµµ" },
  { id: "S07", name: "åæèä¸" },
  { id: "S08", name: "è±å ´è±æ" },
  { id: "S09", name: "å¢æ°¸ç¾å" },
  { id: "S10", name: "å¤ç°æ¦å­" },
  { id: "S11", name: "å¤§é¢å¼ç¾" },
  { id: "S12", name: "äºä¸äºç¢å­" },
  { id: "S13", name: "èäºè¡å­" },
  { id: "S14", name: "å®®ç°ææ" },
  { id: "S15", name: "è¾»ç´æ¨¹" },
  { id: "S16", name: "é«ç°å©é¦" },
  { id: "S17", name: "å¤§ä¹ä¿å¯ç¾" },
  { id: "S18", name: "çªªç°ç´ä¸" },
  { id: "S19", name: "ä¸¹ç¾½çå¼" },
  { id: "S20", name: "ä¸­éåä¹" },
  { id: "S21", name: "è¶³ç°ç«å­" },
  { id: "S22", name: "å¤ç¬ç±ç¾å­" },
  { id: "S23", name: "å¦»é¹¿ããã" },
  { id: "S24", name: "ãã­ãéå­" },
  { id: "S25", name: "ååæ" },
  { id: "S26", name: "åç°æå¸å­" },
  { id: "S27", name: "å¤å·è£å" },
  { id: "S28", name: "æåå­" },
]

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventIdParam = searchParams.get('event_id')

  const [step, setStep] = useState(0)
  const [currentCount, setCurrentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [eventId, setEventId] = useState<string | null>(null)
  const [eventInfo, setEventInfo] = useState<{ date: string; time_start: string; time_end: string } | null>(null)
  const [form, setForm] = useState({
    lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',
    prefecture: '', email: '', emailConfirm: '', phone: '',
    shopId: '', isFirst: null as boolean | null, party: null as boolean | null, remarks: '',
  })
  const [companions, setCompanions] = useState<any[]>([])

  useEffect(() => {
    fetchEvent()
  }, [eventIdParam])

  const fetchEvent = async () => {
    setLoading(true)
    let query = supabase.from('events').select('id, date, time_start, time_end, capacity, status').eq('status', 'open')
    if (eventIdParam) {
      query = query.eq('id', eventIdParam)
    } else {
      query = query.order('date', { ascending: true })
    }
    const { data, error } = await query.limit(1).single()

    if (!error && data) {
      setEventId(data.id)
      setEventInfo({ date: data.date, time_start: data.time_start, time_end: data.time_end })
      fetchCount(data.id, data.capacity)
    } else {
      setLoading(false)
    }
  }

  const fetchCount = async (eid: string, cap?: number) => {
    const { data, error } = await supabase
      .from('participants')
      .select('id, companions(id)')
      .eq('event_id', eid)
      .eq('status', 'confirmed')
    if (!error && data) {
      const total = data.reduce((sum: number, p: any) => sum + 1 + (p.companions?.length || 0), 0)
      setCurrentCount(total)
    }
    setLoading(false)
  }

  const EVENT = {
    ...EVENT_STATIC,
    date: eventInfo ? formatDate(eventInfo.date) : '',
    time: eventInfo ? `${formatTime(eventInfo.time_start)}ã${formatTime(eventInfo.time_end)}` : '',
  }

  const remaining = EVENT.capacity - currentCount
  const isFull = remaining <= 0
  const totalApplying = 1 + companions.length
  const willWait = totalApplying > remaining
  const confirmCount = Math.min(totalApplying, remaining)
  const waitCount = totalApplying - confirmCount
  const partyCount = (form.party === true ? 1 : 0) + companions.filter(c => c.party === true).length
  const partyTotal = partyCount * EVENT.party.fee
  const selectedShop = shops.find(s => s.id === form.shopId)
  const fillPct = Math.round((currentCount / EVENT.capacity) * 100)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.lastName.trim()) e.lastName = 'å§ãå¥åãã¦ãã ãã'
    if (!form.firstName.trim()) e.firstName = 'åãå¥åãã¦ãã ãã'
    if (!form.lastNameKana.trim()) e.lastNameKana = 'ã»ã¤ãå¥åãã¦ãã ãã'
    if (!form.firstNameKana.trim()) e.firstNameKana = 'ã¡ã¤ãå¥åãã¦ãã ãã'
    if (!form.email.trim()) e.email = 'ã¡ã¼ã«ã¢ãã¬ã¹ãå¥åãã¦ãã ãã'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'å½¢å¼ãæ­£ããããã¾ãã'
    if (form.email !== form.emailConfirm) e.emailConfirm = 'ã¡ã¼ã«ã¢ãã¬ã¹ãä¸è´ãã¾ãã'
    if (!form.phone.trim()) e.phone = 'é»è©±çªå·ãå¥åãã¦ãã ãã'
    if (!form.shopId) e.shopId = 'è²©å£²åºãé¸æãã¦ãã ãã'
    if (form.isFirst === null) e.isFirst = 'åå åºåãé¸æãã¦ãã ãã'
    if (form.party === null) e.party = 'æè¦ªä¼ã®åå æç¡ãé¸æãã¦ãã ãã'
    companions.forEach((c, i) => {
      if (!c.lastName?.trim()) e[`c_${i}_name`] = 'ååãå¥åãã¦ãã ãã'
      if (c.isFirst === null || c.isFirst === undefined) e[`c_${i}_isFirst`] = 'åå åºåãé¸æãã¦ãã ãã'
      if (c.party === null || c.party === undefined) e[`c_${i}_party`] = 'æè¦ªä¼ã®åå æç¡ãé¸æãã¦ãã ãã'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      let waitNo = null
      if (isFull || willWait) {
        const { data: waitData } = await supabase
          .from('participants').select('wait_no').eq('status', 'waiting')
          .order('wait_no', { ascending: false }).limit(1)
        waitNo = waitData && waitData.length > 0 ? (waitData[0].wait_no || 0) + 1 : 1
      }
      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          last_name: form.lastName, first_name: form.firstName,
          last_name_kana: form.lastNameKana, first_name_kana: form.firstNameKana,
          email: form.email, phone: form.phone, shop_id: form.shopId,
          is_first: form.isFirst, party: form.party,
          status: (isFull || willWait) ? 'waiting' : 'confirmed',
          wait_no: waitNo, prefecture: form.prefecture, remarks: form.remarks,
        })
        .select().single()
      if (error) throw error
      if (companions.length > 0) {
        const companionData = companions.map(c => ({
          participant_id: participant.id,
          last_name: c.lastName, first_name: c.firstName || '',
          relation: c.relation || '', is_first: c.isFirst, party: c.party,
        }))
        await supabase.from('companions').insert(companionData)
      }
      const finalStatus = (isFull || willWait) ? 'waiting' : 'confirmed'
      setSubmitted(finalStatus)
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new', participant: { ...participant, status: finalStatus }, companions }),
      }).catch(() => {})
      setStep(3)
      if (eventId) fetchCount(eventId)
    } catch (e) {
      alert('ç³è¾¼ä¸­ã«ã¨ã©ã¼ãçºçãã¾ãããããä¸åº¦ãè©¦ããã ããã')
    }
    setSubmitting(false)
  }

  const handleNext = () => {
    if (step === 1 && !validate()) return
    if (step === 2) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  const Req = () => <span style={{ fontSize: 10, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 3, marginLeft: 5, fontWeight: 700 }}>å¿é </span>
  const Err = ({ f }: { f: string }) => errors[f] ? <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors[f]}</div> : null
  const Lbl = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6080', marginBottom: 6 }}>{children}</div>
  const inpStyle = (field: string) => ({
    width: '100%', padding: '11px 13px', borderRadius: 9, fontSize: 13,
    background: errors[field] ? '#fff5f5' : '#f8fbff',
    border: `1.5px solid ${errors[field] ? '#fca5a5' : '#dde8f5'}`,
    color: '#1a2a3a', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif",
  })

  const PartySelect = ({ value, onChange, errKey }: { value: boolean | null, onChange: (v: boolean) => void, errKey?: string }) => (
    <div>
      <Lbl>ð» æè¦ªä¼ï¼{EVENT.party.time}ï¼<Req /></Lbl>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { v: true, icon: 'ð', label: 'åå ãã', sub: `Â¥${EVENT.party.fee.toLocaleString()}`, color: '#2d7a4a', bg: '#f0fdf4', border: '#86efac' },
          { v: false, icon: 'ð', label: 'ä¸åå ', sub: 'åå è²»ãªã', color: '#64748b', bg: '#f8faff', border: '#e2e8f0' },
        ].map(opt => (
          <div key={String(opt.v)} onClick={() => onChange(opt.v)} style={{ padding: '11px 10px', borderRadius: 10, border: `2px solid ${value === opt.v ? opt.border : '#e2e8f0'}`, cursor: 'pointer', textAlign: 'center', background: value === opt.v ? opt.bg : '#f8faff' }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{opt.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: value === opt.v ? opt.color : '#9ca3af' }}>{opt.label}</div>
            <div style={{ fontSize: 10, color: value === opt.v ? opt.color : '#d1d5db', marginTop: 2 }}>{opt.sub}</div>
          </div>
        ))}
      </div>
      {errKey && <Err f={errKey} />}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', fontSize: 16, color: '#2d7a4a' }}>
      èª­ã¿è¾¼ã¿ä¸­...
    </div>
  )

  if (!eventId) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', gap: 16 }}>
      <div style={{ fontSize: 16, color: '#888' }}>ã¤ãã³ããè¦ã¤ããã¾ãã</div>
      <button onClick={() => router.push('/events')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        ã¤ãã³ãä¸è¦§ã¸æ»ã
      </button>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: 'linear-gradient(170deg,#e8f4ff 0%,#f0f8ee 60%,#fffbe8 100%)', minHeight: '100vh' }}>
      {/* ãããã¼ */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', padding: '0 24px' }}>
                  <div style={{ textAlign: 'center', paddingTop: '18px', paddingBottom: '4px' }}>
                                <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textShadow: '0 2px 12px rgba(0,0,0,0.4)', fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif" }}>
                                                シリカ<span style={{ color: '#7ee8a2' }}>GO</span>
                                                            </span>
                                                                      </div>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>ð­</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#7ee8a2', letterSpacing: '0.05em', textShadow: '0 0 10px rgba(100,230,150,0.6)' }}>⚡ シリカGO！</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>FACTORY TOUR REGISTRATION</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>å·¥å ´è¦å­¦ä¼ åå ç³è¾¼</div>
            </div>
          </div>
          <button onClick={() => router.push('/events')} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
            â æ¥ç¨ä¸è¦§
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '26px 18px 64px' }}>
        {/* å®å¡ãã¼ */}
        {step < 3 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 18, boxShadow: '0 2px 14px rgba(30,80,50,0.08)', border: '1px solid #d4eadc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: '#2d7a4a', fontWeight: 700, marginBottom: 3 }}>ð­ {EVENT.title}</div>
                <div style={{ fontSize: 12, color: '#445' }}>ð {EVENT.date} {EVENT.time}</div>
                <div style={{ fontSize: 12, color: '#445', marginTop: 2 }}>ð« {EVENT.fee} ð {EVENT.parking}</div>
                <div style={{ fontSize: 12, color: '#1a7a4a', marginTop: 2, fontWeight: 600 }}>ð» æè¦ªä¼ããï¼JRå°¾å¼µä¸å®®é§è¿è¾ºã®ãåºã»{EVENT.party.time}ã»Â¥{EVENT.party.fee.toLocaleString()}ï¼</div>
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 700 }}>â ï¸ {EVENT.deadline}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 10, color: '#888' }}>æ®ãæ </div>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: isFull ? '#ef4444' : remaining <= 5 ? '#f59e0b' : '#2d7a4a' }}>
                  {remaining}<span style={{ fontSize: 13, color: '#aaa', marginLeft: 2 }}>å</span>
                </div>
                {isFull && <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '2px 8px', marginTop: 4 }}>æºå¡</div>}
                <div style={{ height: 5, width: 80, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', margin: '6px auto 0' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#ef4444' : fillPct >= 80 ? '#f59e0b' : '#2d7a4a', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{currentCount}/{EVENT.capacity}å</div>
              </div>
            </div>
          </div>
        )}

        {/* ã¹ãããè¡¨ç¤º */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
            {['è¦å­¦ä¼ã«ã¤ãã¦', 'ç³è¾¼ã¿æå ±', 'ç¢ºèªã»éä¿¡'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: i < step ? '#2d7a4a' : i === step ? 'linear-gradient(135deg,#1a3a2a,#2d7a4a)' : '#e5e7eb', color: i <= step ? '#fff' : '#9ca3af' }}>{i < step ? 'â' : i + 1}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? '#1a3a2a' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: i < step ? '#2d7a4a' : '#e5e7eb', margin: '0 6px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 0: è¦å­¦ä¼ã«ã¤ãã¦ */}
        {step === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 2px 14px rgba(30,80,50,0.07)', border: '1px solid #d4eadc' }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#1a3a2a', marginBottom: 6 }}>ð­ {EVENT.title}</h2>
            <p style={{ fontSize: 13, color: '#6a8070', lineHeight: 1.8, marginBottom: 20 }}>ã·ãªã«ã®è£½é å·¥ç¨ãéè¿ã§ãè¦§ããã ããè²´éãªæ©ä¼ã§ãããåå ããå¾ã¡ãã¦ããã¾ãã</p>
            <div style={{ marginBottom: 16 }}>
              {[
                ['éå¬æ¥æ', `${EVENT.date} ${EVENT.time}`],
                ['åå è²»', EVENT.fee],
                ['éåã»è§£æ£', EVENT.type],
                ['é§è»å ´', EVENT.parking],
                ['å®å¡', `${EVENT.capacity}å`],
                ['ç³è¾¼ç· å', EVENT.deadline],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #f0f5f2' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4a', minWidth: 80 }}>{l}</span>
                  <span style={{ fontSize: 13, color: '#2a3a2a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#fffbeb)', border: '2px solid #a7f3d0', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a3a2a', marginBottom: 10 }}>ð» è¦å­¦ä¼å¾ æè¦ªä¼</div>
              {[
                ['éå¬æé', EVENT.party.time],
                ['åå è²»', `Â¥${EVENT.party.fee.toLocaleString()}ï¼å½æ¥ç¾éæãï¼`],
                ['ç³è¾¼', 'è¦å­¦ä¼ç³è¾¼ã¨åæã«ãç³è¾¼ã¿ããã ãã¾ã'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #d1fae5' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4a', minWidth: 70 }}>{l}</span>
                  <span style={{ fontSize: 12, color: '#1a3a2a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20, padding: '13px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, color: '#92400e', fontWeight: 700, marginBottom: 4 }}>â ï¸ æ³¨æäºé </div>
              <ul style={{ fontSize: 12, color: '#78350f', lineHeight: 1.9, margin: 0, paddingLeft: 16 }}>
                <li>å®å¨ã®ããå·¥å ´åã§ã¯ã¹ã¿ããã®æç¤ºã«å¾ã£ã¦ãã ãã</li>
                <li>åããããæè£ã»é´ã§ãè¶ããã ãã</li>
                <li>å·¥å ´åã§ã®åçæ®å½±ã¯å¨ã¦OKã§ããSNSã¸ã®æç¨¿ãOKã§ãã</li>
                <li>ãè»ã§ã®ãæ¥å ´ã¯ãé æ®ãã ãã</li>
              </ul>
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff' }}>
              {isFull ? 'ã­ã£ã³ã»ã«å¾ã¡ã§ç³è¾¼ã â' : 'åå ç³è¾¼ã¿ã¸é²ã â'}
            </button>
          </div>
        )}

        {/* STEP 1: ç³è¾¼æå ±å¥å */}
        {step === 1 && (
          <div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '22px', marginBottom: 14, boxShadow: '0 2px 10px rgba(30,80,50,0.06)', border: '1px solid #d4eadc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800 }}>ä»£</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a3a2a' }}>ãåå èæ§æå ±ï¼ã°ã«ã¼ãã®æ¹ã¯ä»£è¡¨èï¼</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><Lbl>å§<Req /></Lbl><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="å±±ç°" style={inpStyle('lastName')} /><Err f="lastName" /></div>
                <div><Lbl>å<Req /></Lbl><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="è±å­" style={inpStyle('firstName')} /><Err f="firstName" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><Lbl>ã»ã¤<Req /></Lbl><input value={form.lastNameKana} onChange={e => setForm({ ...form, lastNameKana: e.target.value })} placeholder="ã¤ãã" style={inpStyle('lastNameKana')} /><Err f="lastNameKana" /></div>
                <div><Lbl>ã¡ã¤<Req /></Lbl><input value={form.firstNameKana} onChange={e => setForm({ ...form, firstNameKana: e.target.value })} placeholder="ããã³" style={inpStyle('firstNameKana')} /><Err f="firstNameKana" /></div>
              </div>
              <div style={{ marginBottom: 12 }}><Lbl>ã¡ã¼ã«ã¢ãã¬ã¹<Req /></Lbl><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@mail.com" style={inpStyle('email')} /><Err f="email" /></div>
              <div style={{ marginBottom: 12 }}><Lbl>ã¡ã¼ã«ã¢ãã¬ã¹ï¼ç¢ºèªï¼<Req /></Lbl><input type="email" value={form.emailConfirm} onChange={e => setForm({ ...form, emailConfirm: e.target.value })} placeholder="ããä¸åº¦å¥å" style={inpStyle('emailConfirm')} /><Err f="emailConfirm" /></div>
              <div style={{ marginBottom: 12 }}><Lbl>é»è©±çªå·<Req /></Lbl><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="090-0000-0000" style={inpStyle('phone')} /><Err f="phone" /></div>
              <div style={{ marginBottom: 14 }}>
                <Lbl>æå½è²©å£²åº<Req /></Lbl>
                <select value={form.shopId} onChange={e => setForm({ ...form, shopId: e.target.value })} style={{ ...inpStyle('shopId'), appearance: 'none' as const }}>
                  <option value="">é¸æãã¦ãã ãã</option><option value="NONE">ãªãï¼ä»£çåºã»ç´æ¥åå ï¼</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select><Err f="shopId" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Lbl>è¦å­¦ä¼ åå åºå<Req /></Lbl>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ v: true, icon: 'ð', title: 'åååå ', desc: 'ä»åãåãã¦' }, { v: false, icon: 'â©ï¸', title: 'ãªãã¼ã', desc: 'ä»¥åãåå ãã' }].map(opt => (
                    <div key={String(opt.v)} onClick={() => setForm({ ...form, isFirst: opt.v })} style={{ padding: '12px', borderRadius: 10, border: `2px solid ${form.isFirst === opt.v ? '#2d7a4a' : '#dde8f5'}`, cursor: 'pointer', background: form.isFirst === opt.v ? '#f0fdf4' : '#f8fbff', textAlign: 'center' }}>
                      <div style={{ fontSize: 20 }}>{opt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: form.isFirst === opt.v ? '#1a3a2a' : '#6a8090', marginTop: 3 }}>{opt.title}</div>
                      <div style={{ fontSize: 10, color: '#9aaa9a', marginTop: 1 }}>{opt.desc}</div>
                    </div>
                  ))}
                </div><Err f="isFirst" />
              </div>
              <PartySelect value={form.party} onChange={v => setForm({ ...form, party: v })} errKey="party" />
            </div>

            {companions.map((comp, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 13, padding: '20px 22px', marginBottom: 12, border: '2px solid #d4f0dc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#2a4a2a' }}>åä¼´è {i + 1}</span>
                  <button onClick={() => setCompanions(c => c.filter((_, idx) => idx !== i))} style={{ fontSize: 11, color: '#ef4444', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>åé¤</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div><Lbl>å§<Req /></Lbl>
                    <input value={comp.lastName || ''} onChange={e => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, lastName: e.target.value } : x))} placeholder="å±±ç°" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${errors[`c_${i}_name`] ? '#fca5a5' : '#dde8f5'}`, fontSize: 13, background: '#f8fbff', color: '#1a2a3a', boxSizing: 'border-box' as const }} />
                    <Err f={`c_${i}_name`} /></div>
                  <div><Lbl>å</Lbl>
                    <input value={comp.firstName || ''} onChange={e => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, firstName: e.target.value } : x))} placeholder="å¤ªé" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde8f5', fontSize: 13, background: '#f8fbff', color: '#1a2a3a', boxSizing: 'border-box' as const }} /></div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Lbl>åå åºå<Req /></Lbl>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ v: true, label: 'ð åå' }, { v: false, label: 'â©ï¸ ãªãã¼ã' }].map(opt => (
                      <div key={String(opt.v)} onClick={() => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, isFirst: opt.v } : x))} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, border: `2px solid ${comp.isFirst === opt.v ? '#2d7a4a' : '#dde8f5'}`, cursor: 'pointer', textAlign: 'center', fontSize: 11, fontWeight: 700, background: comp.isFirst === opt.v ? '#f0fdf4' : '#f8fbff', color: comp.isFirst === opt.v ? '#1a3a2a' : '#9aaa9a' }}>{opt.label}</div>
                    ))}
                  </div><Err f={`c_${i}_isFirst`} />
                </div>
                <PartySelect value={comp.party} onChange={v => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, party: v } : x))} errKey={`c_${i}_party`} />
              </div>
            ))}

            <button onClick={() => setCompanions(c => [...c, { lastName: '', firstName: '', isFirst: null, relation: '', party: null }])} style={{ width: '100%', padding: '13px', borderRadius: 11, border: '2px dashed #a3d9b0', background: 'transparent', color: '#2d7a4a', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 18 }}>
              ï¼ åä¼´èãè¿½å ãã
            </button>

            {partyCount > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#fffbeb)', border: '1.5px solid #a7f3d0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>ð» æè¦ªä¼åå è</div>
                  <div style={{ fontSize: 13, color: '#1a3a2a', marginTop: 2 }}>{partyCount}å Ã Â¥{EVENT.party.fee.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>å½æ¥ãæ¯æãåè¨</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#2d7a4a' }}>Â¥{partyTotal.toLocaleString()}</div>
                </div>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
              <Lbl>ãä½ã¾ãã®é½éåºç</Lbl>
              <select value={form.prefecture} onChange={e => setForm({ ...form, prefecture: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d4eadc', fontSize: 14, background: '#fff' }}>
                <option value="">é¸æãã¦ãã ãã</option><option value="NONE">ãªãï¼ä»£çåºã»ç´æ¥åå ï¼</option>
                {['åæµ·é','éæ£®ç','å²©æç','å®®åç','ç§ç°ç','å±±å½¢ç','ç¦å³¶ç','è¨åç','æ æ¨ç','ç¾¤é¦¬ç','å¼çç','åèç','æ±äº¬é½','ç¥å¥å·ç','æ°æ½ç','å¯å±±ç','ç³å·ç','ç¦äºç','å±±æ¢¨ç','é·éç','å²éç','éå²¡ç','æç¥ç','ä¸éç','æ»è³ç','äº¬é½åº','å¤§éªåº','åµåº«ç','å¥è¯ç','åæ­å±±ç','é³¥åç','å³¶æ ¹ç','å²¡å±±ç','åºå³¶ç','å±±å£ç','å¾³å³¶ç','é¦å·ç','æåªç','é«ç¥ç','ç¦å²¡ç','ä½è³ç','é·å´ç','çæ¬ç','å¤§åç','å®®å´ç','é¹¿åå³¶ç','æ²ç¸ç'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 18, border: '1px solid #d4eadc' }}>
              <Lbl>ã·ãªã«è£½åã«ã¤ãã¦èãã¦ã¿ãããã¨ï¼è¤æ°å¯ï¼</Lbl>
              <textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde8f5', fontSize: 13, background: '#f8fbff', color: '#1a2a3a', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '13px', borderRadius: 11, border: '1.5px solid #d4eadc', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6a8070' }}>â æ»ã</button>
              <button onClick={handleNext} style={{ flex: 2, padding: '13px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff' }}>
                ç¢ºèªç»é¢ã¸ï¼{totalApplying}åï¼â
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ç¢ºèª */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 2px 14px rgba(30,80,50,0.07)', border: '1px solid #d4eadc' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a3a2a', marginBottom: 4 }}>ç³è¾¼åå®¹ã®ç¢ºèª</h2>
            <p style={{ fontSize: 12, color: '#6a8070', marginBottom: 16 }}>ä»¥ä¸ã®åå®¹ã§ãç³è¾¼ã¿ãã¾ãããç¢ºèªãã ããã</p>
            {willWait && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 3 }}>â³ ã­ã£ã³ã»ã«å¾ã¡ãå«ããç³è¾¼ã¿ã§ã</div>
                <div style={{ fontSize: 12, color: '#b45309' }}>ç¢ºå®ï¼{confirmCount}å ï¼ ã­ã£ã³ã»ã«å¾ã¡ï¼{waitCount}å</div>
              </div>
            )}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 800, marginBottom: 10 }}>â¶ ä»£è¡¨è</div>
              {[
                ['ãåå', `${form.lastName} ${form.firstName}ï¼${form.lastNameKana} ${form.firstNameKana}ï¼`],
                ['ã¡ã¼ã«', form.email],
                ['é»è©±', form.phone],
                ['æå½è²©å£²åº', selectedShop?.name || ''],
                ['åå åºå', form.isFirst ? 'ð åååå ' : 'â©ï¸ ãªãã¼ãåå '],
                ['æè¦ªä¼', form.party ? `ð åå ï¼Â¥${EVENT.party.fee.toLocaleString()}ï¼` : 'ð ä¸åå '],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid #d1fae5' }}>
                  <span style={{ fontSize: 11, color: '#4ade80', minWidth: 90, fontWeight: 600 }}>{l}</span>
                  <span style={{ fontSize: 12, color: '#1a3a2a', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            {companions.map((comp, i) => (
              <div key={i} style={{ background: '#f8fbff', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: '1px solid #dde8f5' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2d5a8a', marginBottom: 8 }}>â¶ åä¼´è {i + 1}</div>
                {[
                  ['ãåå', `${comp.lastName} ${comp.firstName}`],
                  ['åå åºå', comp.isFirst ? 'ð åååå ' : 'â©ï¸ ãªãã¼ãåå '],
                  ['æè¦ªä¼', comp.party ? `ð åå ï¼Â¥${EVENT.party.fee.toLocaleString()}ï¼` : 'ð ä¸åå '],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid #e8eef8' }}>
                    <span style={{ fontSize: 11, color: '#8899cc', minWidth: 90 }}>{l}</span>
                    <span style={{ fontSize: 12, color: '#1a2a3a', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#fffbeb)', borderRadius: 10, border: '1px solid #a7f3d0', padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>ç³è¾¼åè¨</div><div style={{ fontSize: 24, fontWeight: 900, color: '#2d7a4a' }}>{totalApplying}<span style={{ fontSize: 11, color: '#aaa' }}>å</span></div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>æè¦ªä¼åå </div><div style={{ fontSize: 24, fontWeight: 900, color: '#1a7a4a' }}>{partyCount}<span style={{ fontSize: 11, color: '#aaa' }}>å</span></div></div>
                </div>
                {partyCount > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888' }}>æè¦ªä¼ å½æ¥æãåè¨</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#2d7a4a' }}>Â¥{partyTotal.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '13px 15px', background: '#f8fbff', borderRadius: 10, border: '1px solid #dde8f5', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: '#2d7a4a' }} />
                <span style={{ fontSize: 12, color: '#4a6070', lineHeight: 1.7 }}>æ³¨æäºé ããã³åäººæå ±ã®åãæ±ãã«åæãã¾ããåä¼´èã®æå ±ã«ã¤ãã¦ãä»£è¡¨èã¨ãã¦åæã»æä¾ããæ¨©éããããã¨ãç¢ºèªãã¾ããã</span>
              </label>
            </div>
            {!agreed && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 12 }}>åæãå¿è¦ã§ã</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', borderRadius: 11, border: '1.5px solid #d4eadc', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6a8070' }}>â ä¿®æ­£ãã</button>
              <button onClick={handleNext} disabled={!agreed || submitting} style={{ flex: 2, padding: '13px', borderRadius: 11, border: 'none', cursor: agreed && !submitting ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800, background: agreed && !submitting ? 'linear-gradient(135deg,#1a3a2a,#2d7a4a)' : '#e5e7eb', color: agreed && !submitting ? '#fff' : '#9ca3af' }}>
                {submitting ? 'éä¿¡ä¸­...' : 'éä¿¡ãã â'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: å®äº */}
        {step === 3 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', boxShadow: '0 2px 20px rgba(30,80,50,0.08)', border: `2px solid ${submitted === 'waiting' ? '#fcd34d' : '#a7f3d0'}`, textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 14 }}>{submitted === 'waiting' ? 'â³' : 'â'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a3a2a', marginBottom: 8 }}>
              {submitted === 'waiting' ? 'ã­ã£ã³ã»ã«å¾ã¡åä»å®äº' : 'ãç³è¾¼ã¿ãå®äºãã¾ããï¼'}
            </h2>
            <p style={{ fontSize: 13, color: '#6a8070', lineHeight: 1.9, marginBottom: 22 }}>
              {submitted === 'waiting'
                ? 'ã­ã£ã³ã»ã«å¾ã¡ãåãä»ãã¾ãããç©ºããåºãå ´åãç³è¾¼é ã«åå ç¢ºå®ã®ãé£çµ¡ããããã¾ãã'
                : 'ç¢ºèªã¡ã¼ã«ããéããã¾ãããå½æ¥ã®ãåå ããå¾ã¡ãã¦ããã¾ãï¼'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setStep(0); setForm({ lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', email: '', emailConfirm: '', phone: '', shopId: '', isFirst: null, party: null, prefecture: '', remarks: '' }); setCompanions([]); setAgreed(false); setSubmitted(null); }} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #d4eadc', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#6a8070' }}>
                å¥ã®æ¹ã®ç³è¾¼ã¿ããã
              </button>
              <button onClick={() => router.push('/events')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                ã¤ãã³ãä¸è¦§ã¸
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#2d7a4a' }}>èª­ã¿è¾¼ã¿ä¸­...</div>}>
      <HomeContent />
    </Suspense>
  )
                }
