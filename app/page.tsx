'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EVENT = {
  title: "シリカ製造工場 無料見学会",
  date: "2026年5月23日（土）",
  time: "13:00〜16:00",
  fee: "無料",
  type: "現地集合・現地解散",
  parking: "駐車場はありません",
  deadline: "定員となり次第締め切ります",
  capacity: 50,
  party: { title: "見学会後 懇親会", fee: 3000, time: "17:00〜19:00" },
}

const shops = [
  { id: "S01", name: "札幌中央販売店" },
  { id: "S02", name: "仙台北販売店" },
  { id: "S03", name: "青森販売店" },
  { id: "S04", name: "東京新宿販売店" },
  { id: "S05", name: "横浜南販売店" },
  { id: "S06", name: "埼玉販売店" },
  { id: "S07", name: "大阪梅田販売店" },
  { id: "S08", name: "名古屋中央販売店" },
  { id: "S09", name: "福岡博多販売店" },
  { id: "S10", name: "広島販売店" },
]

export default function Home() {
  const [step, setStep] = useState(0)
  const [currentCount, setCurrentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', prefecture: '', userType: 'customer', prefecture: '',
    email: '', emailConfirm: '', phone: '', shopId: '',
    isFirst: null as boolean | null, party: null as boolean | null, remarks: '',
  })

  const [companions, setCompanions] = useState<any[]>([])

  // 現在の参加人数をSupabaseから取得
  useEffect(() => {
    fetchCount()
  }, [])

  const fetchCount = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('participants')
      .select('id, companions(id)')
      .eq('status', 'confirmed')

    if (!error && data) {
      const total = data.reduce((sum: number, p: any) => {
        return sum + 1 + (p.companions?.length || 0)
      }, 0)
      setCurrentCount(total)
    }
    setLoading(false)
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
    if (!form.lastName.trim()) e.lastName = '姓を入力してください'
    if (!form.firstName.trim()) e.firstName = '名を入力してください'
    if (!form.lastNameKana.trim()) e.lastNameKana = 'セイを入力してください'
    if (!form.firstNameKana.trim()) e.firstNameKana = 'メイを入力してください'
    if (!form.email.trim()) e.email = 'メールアドレスを入力してください'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = '形式が正しくありません'
    if (form.email !== form.emailConfirm) e.emailConfirm = 'メールアドレスが一致しません'
    if (!form.phone.trim()) e.phone = '電話番号を入力してください'
    if (!form.shopId) e.shopId = '販売店を選択してください'
    if (form.isFirst === null) e.isFirst = '参加区分を選択してください'
    if (form.party === null) e.party = '懇親会の参加有無を選択してください'
    companions.forEach((c, i) => {
      if (!c.lastName?.trim()) e[`c_${i}_name`] = '名前を入力してください'
      if (c.isFirst === null || c.isFirst === undefined) e[`c_${i}_isFirst`] = '参加区分を選択してください'
      if (c.party === null || c.party === undefined) e[`c_${i}_party`] = '懇親会の参加有無を選択してください'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // キャンセル待ち番号を取得
      let waitNo = null
      if (isFull || willWait) {
        const { data: waitData } = await supabase
          .from('participants')
          .select('wait_no')
          .eq('status', 'waiting')
          .order('wait_no', { ascending: false })
          .limit(1)
        waitNo = waitData && waitData.length > 0 ? (waitData[0].wait_no || 0) + 1 : 1
      }

      // 参加者を登録
      const { data: eventData } = await supabase.from('events').select('id').single()
      const eventId = eventData?.id
      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          last_name: form.lastName,
          first_name: form.firstName,
          last_name_kana: form.lastNameKana,
          first_name_kana: form.firstNameKana,
          email: form.email,
          phone: form.phone,
          shop_id: form.shopId,
          is_first: form.isFirst,
          party: form.party,
          status: (isFull || willWait) ? 'waiting' : 'confirmed',
          wait_no: waitNo,
          prefecture: form.prefecture,
          user_type: form.userType,
          remarks: form.remarks,
        })
        .select()
        .single()

      if (error) throw error

      // 同伴者を登録
      if (companions.length > 0) {
        const companionData = companions.map(c => ({
          participant_id: participant.id,
          last_name: c.lastName,
          first_name: c.firstName || '',
          relation: c.relation || '',
          is_first: c.isFirst,
          party: c.party,
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
      fetchCount()
    } catch (e) {
      alert('申込中にエラーが発生しました。もう一度お試しください。')
    }
    setSubmitting(false)
  }

  const handleNext = () => {
    if (step === 1 && !validate()) return
    if (step === 2) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  const Req = () => <span style={{ fontSize: 10, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 3, marginLeft: 5, fontWeight: 700 }}>必須</span>
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
      <Lbl>🍻 懇親会（{EVENT.party.time}）<Req /></Lbl>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { v: true, icon: '🙋', label: '参加する', sub: `¥${EVENT.party.fee.toLocaleString()}`, color: '#2d7a4a', bg: '#f0fdf4', border: '#86efac' },
          { v: false, icon: '🙅', label: '不参加', sub: '参加費なし', color: '#64748b', bg: '#f8faff', border: '#e2e8f0' },
        ].map(opt => (
          <div key={String(opt.v)} onClick={() => onChange(opt.v)}
            style={{ padding: '11px 10px', borderRadius: 10, border: `2px solid ${value === opt.v ? opt.border : '#e2e8f0'}`, cursor: 'pointer', textAlign: 'center',
              background: value === opt.v ? opt.bg : '#f8faff' }}>
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

        {/* 定員バー */}
        {step < 3 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 18, boxShadow: '0 2px 14px rgba(30,80,50,0.08)', border: '1px solid #d4eadc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: '#2d7a4a', fontWeight: 700, marginBottom: 3 }}>🏭 {EVENT.title}</div>
                <div style={{ fontSize: 12, color: '#445' }}>📅 {EVENT.date}　{EVENT.time}</div>
                <div style={{ fontSize: 12, color: '#445', marginTop: 2 }}>🎫 {EVENT.fee}　🚗 {EVENT.parking}</div>
                <div style={{ fontSize: 12, color: '#1a7a4a', marginTop: 2, fontWeight: 600 }}>🍻 懇親会あり（JR尾張一宮駅近辺のお店・{EVENT.party.time}・¥{EVENT.party.fee.toLocaleString()}）</div>
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 700 }}>⚠️ {EVENT.deadline}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 10, color: '#888' }}>残り枠</div>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: isFull ? '#ef4444' : remaining <= 5 ? '#f59e0b' : '#2d7a4a' }}>
                  {remaining}<span style={{ fontSize: 13, color: '#aaa', marginLeft: 2 }}>名</span>
                </div>
                {isFull && <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '2px 8px', marginTop: 4 }}>満員</div>}
                <div style={{ height: 5, width: 80, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', margin: '6px auto 0' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? '#ef4444' : fillPct >= 80 ? '#f59e0b' : '#2d7a4a', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{currentCount}/{EVENT.capacity}名</div>
              </div>
            </div>
          </div>
        )}

        {/* ステップ表示 */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
            {['見学会について', '申込み情報', '確認・送信'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                    background: i < step ? '#2d7a4a' : i === step ? 'linear-gradient(135deg,#1a3a2a,#2d7a4a)' : '#e5e7eb',
                    color: i <= step ? '#fff' : '#9ca3af' }}>{i < step ? '✓' : i + 1}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? '#1a3a2a' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: i < step ? '#2d7a4a' : '#e5e7eb', margin: '0 6px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 0: 見学会について */}
        {step === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 2px 14px rgba(30,80,50,0.07)', border: '1px solid #d4eadc' }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#1a3a2a', marginBottom: 6 }}>🏭 {EVENT.title}</h2>
            <p style={{ fontSize: 13, color: '#6a8070', lineHeight: 1.8, marginBottom: 20 }}>シリカの製造工程を間近でご覧いただける貴重な機会です。ご参加をお待ちしております。</p>
            <div style={{ marginBottom: 16 }}>
              {[
                ['開催日時', `${EVENT.date}　${EVENT.time}`],
                ['参加費', EVENT.fee],
                ['集合・解散', EVENT.type],
                ['駐車場', EVENT.parking],
                ['定員', `${EVENT.capacity}名`],
                ['申込締切', EVENT.deadline],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #f0f5f2' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4a', minWidth: 80 }}>{l}</span>
                  <span style={{ fontSize: 13, color: '#2a3a2a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#fffbeb)', border: '2px solid #a7f3d0', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a3a2a', marginBottom: 10 }}>🍻 見学会後 懇親会</div>
              {[
                ['開催時間', EVENT.party.time],
                ['参加費', `¥${EVENT.party.fee.toLocaleString()}（当日現金払い）`],
                ['申込', '見学会申込と同時にお申込みいただけます'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #d1fae5' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4a', minWidth: 70 }}>{l}</span>
                  <span style={{ fontSize: 12, color: '#1a3a2a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20, padding: '13px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, color: '#92400e', fontWeight: 700, marginBottom: 4 }}>⚠️ 注意事項</div>
              <ul style={{ fontSize: 12, color: '#78350f', lineHeight: 1.9, margin: 0, paddingLeft: 16 }}>
                <li>安全のため工場内ではスタッフの指示に従ってください</li>
                <li>動きやすい服装・靴でお越しください</li>
                <li>工場内での写真撮影は全てOKです。SNSへの投稿もOKです。</li>
                <li>お車でのご来場はご遠慮ください</li>
              </ul>
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '14px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff' }}>
              {isFull ? 'キャンセル待ちで申込む →' : '参加申込みへ進む →'}
            </button>
          </div>
        )}

        {/* STEP 1: 申込情報入力 */}
        {step === 1 && (
          <div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '22px', marginBottom: 14, boxShadow: '0 2px 10px rgba(30,80,50,0.06)', border: '1px solid #d4eadc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800 }}>代</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a3a2a' }}>代表者のご情報</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><Lbl>姓<Req /></Lbl><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="山田" style={inpStyle('lastName')} /><Err f="lastName" /></div>
                <div><Lbl>名<Req /></Lbl><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="花子" style={inpStyle('firstName')} /><Err f="firstName" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><Lbl>セイ<Req /></Lbl><input value={form.lastNameKana} onChange={e => setForm({ ...form, lastNameKana: e.target.value })} placeholder="ヤマダ" style={inpStyle('lastNameKana')} /><Err f="lastNameKana" /></div>
                <div><Lbl>メイ<Req /></Lbl><input value={form.firstNameKana} onChange={e => setForm({ ...form, firstNameKana: e.target.value })} placeholder="ハナコ" style={inpStyle('firstNameKana')} /><Err f="firstNameKana" /></div>
              </div>
              <div style={{ marginBottom: 12 }}><Lbl>メールアドレス<Req /></Lbl><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@mail.com" style={inpStyle('email')} /><Err f="email" /></div>
              <div style={{ marginBottom: 12 }}><Lbl>メールアドレス（確認）<Req /></Lbl><input type="email" value={form.emailConfirm} onChange={e => setForm({ ...form, emailConfirm: e.target.value })} placeholder="もう一度入力" style={inpStyle('emailConfirm')} /><Err f="emailConfirm" /></div>
              <div style={{ marginBottom: 12 }}><Lbl>電話番号<Req /></Lbl><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="090-0000-0000" style={inpStyle('phone')} /><Err f="phone" /></div>
              <div style={{ marginBottom: 14 }}>
                <Lbl>担当販売店<Req /></Lbl>
                <select value={form.shopId} onChange={e => setForm({ ...form, shopId: e.target.value })} style={{ ...inpStyle('shopId'), appearance: 'none' as const }}>
                  <option value="">選択してください</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select><Err f="shopId" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Lbl>見学会 参加区分<Req /></Lbl>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ v: true, icon: '🆕', title: '初回参加', desc: '今回が初めて' }, { v: false, icon: '↩️', title: 'リピート', desc: '以前も参加あり' }].map(opt => (
                    <div key={String(opt.v)} onClick={() => setForm({ ...form, isFirst: opt.v })}
                      style={{ padding: '12px', borderRadius: 10, border: `2px solid ${form.isFirst === opt.v ? '#2d7a4a' : '#dde8f5'}`, cursor: 'pointer',
                        background: form.isFirst === opt.v ? '#f0fdf4' : '#f8fbff', textAlign: 'center' }}>
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
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#2a4a2a' }}>同伴者 {i + 1}</span>
                  <button onClick={() => setCompanions(c => c.filter((_, idx) => idx !== i))}
                    style={{ fontSize: 11, color: '#ef4444', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>削除</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div><Lbl>姓<Req /></Lbl>
                    <input value={comp.lastName || ''} onChange={e => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, lastName: e.target.value } : x))} placeholder="山田"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${errors[`c_${i}_name`] ? '#fca5a5' : '#dde8f5'}`, fontSize: 13, background: '#f8fbff', color: '#1a2a3a', boxSizing: 'border-box' as const }} />
                    <Err f={`c_${i}_name`} /></div>
                  <div><Lbl>名</Lbl>
                    <input value={comp.firstName || ''} onChange={e => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, firstName: e.target.value } : x))} placeholder="太郎"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde8f5', fontSize: 13, background: '#f8fbff', color: '#1a2a3a', boxSizing: 'border-box' as const }} /></div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Lbl>参加区分<Req /></Lbl>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ v: true, label: '🆕 初回' }, { v: false, label: '↩️ リピート' }].map(opt => (
                      <div key={String(opt.v)} onClick={() => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, isFirst: opt.v } : x))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 7, border: `2px solid ${comp.isFirst === opt.v ? '#2d7a4a' : '#dde8f5'}`, cursor: 'pointer', textAlign: 'center', fontSize: 11, fontWeight: 700,
                          background: comp.isFirst === opt.v ? '#f0fdf4' : '#f8fbff', color: comp.isFirst === opt.v ? '#1a3a2a' : '#9aaa9a' }}>{opt.label}</div>
                    ))}
                  </div><Err f={`c_${i}_isFirst`} />
                </div>
                <PartySelect value={comp.party} onChange={v => setCompanions(c => c.map((x, idx) => idx === i ? { ...x, party: v } : x))} errKey={`c_${i}_party`} />
              </div>
            ))}

            <button onClick={() => setCompanions(c => [...c, { lastName: '', firstName: '', isFirst: null, relation: '', party: null }])}
              style={{ width: '100%', padding: '13px', borderRadius: 11, border: '2px dashed #a3d9b0', background: 'transparent', color: '#2d7a4a', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 18 }}>
              ＋ 同伴者を追加する
            </button>

            {partyCount > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#fffbeb)', border: '1.5px solid #a7f3d0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>🍻 懇親会参加者</div>
                  <div style={{ fontSize: 13, color: '#1a3a2a', marginTop: 2 }}>{partyCount}名 × ¥{EVENT.party.fee.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>当日お支払い合計</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#2d7a4a' }}>¥{partyTotal.toLocaleString()}</div>
                </div>
              </div>
            )}

           <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <Lbl>参加区分</Lbl>
                <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                  {[{ value: 'customer', label: '👤 一般のお客様', desc: '販売者のお客様' }, { value: 'shop', label: '🏪 販売者', desc: '販売店担当者' }].map(opt => (
                    <label key={opt.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `2px solid ${form.userType === opt.value ? '#2d7a4a' : '#e0e0e0'}`, background: form.userType === opt.value ? '#f0fdf4' : '#fafafa', cursor: 'pointer' }}>
                      <input type="radio" name="userType" value={opt.value} checked={form.userType === opt.value} onChange={e => setForm({ ...form, userType: e.target.value })} style={{ accentColor: '#2d7a4a' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                <Lbl>都道府県</Lbl>
                <select value={form.prefecture} onChange={e => setForm({ ...form, prefecture: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d4eadc', fontSize: 14, background: '#fff' }}>
                  <option value="">選択してください</option>
                  {['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 18, border: '1px solid #d4eadc' }}>
              <Lbl>備考・ご要望（任意）</Lbl>
              <textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="" rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde8f5', fontSize: 13, background: '#f8fbff', color: '#1a2a3a', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '13px', borderRadius: 11, border: '1.5px solid #d4eadc', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6a8070' }}>← 戻る</button>
              <button onClick={handleNext} style={{ flex: 2, padding: '13px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff' }}>
                確認画面へ（{totalApplying}名）→
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 確認 */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 2px 14px rgba(30,80,50,0.07)', border: '1px solid #d4eadc' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a3a2a', marginBottom: 4 }}>申込内容の確認</h2>
            <p style={{ fontSize: 12, color: '#6a8070', marginBottom: 16 }}>以下の内容でお申込みします。ご確認ください。</p>
            {willWait && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 3 }}>⏳ キャンセル待ちを含むお申込みです</div>
                <div style={{ fontSize: 12, color: '#b45309' }}>確定：{confirmCount}名　／　キャンセル待ち：{waitCount}名</div>
              </div>
            )}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 800, marginBottom: 10 }}>▶ 代表者</div>
              {[
                ['お名前', `${form.lastName} ${form.firstName}（${form.lastNameKana} ${form.firstNameKana}）`],
                ['メール', form.email], ['電話', form.phone], ['担当販売店', selectedShop?.name || ''],
                ['参加区分', form.isFirst ? '🆕 初回参加' : '↩️ リピート参加'],
                ['懇親会', form.party ? `🙋 参加（¥${EVENT.party.fee.toLocaleString()}）` : '🙅 不参加'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid #d1fae5' }}>
                  <span style={{ fontSize: 11, color: '#4ade80', minWidth: 90, fontWeight: 600 }}>{l}</span>
                  <span style={{ fontSize: 12, color: '#1a3a2a', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            {companions.map((comp, i) => (
              <div key={i} style={{ background: '#f8fbff', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: '1px solid #dde8f5' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2d5a8a', marginBottom: 8 }}>▶ 同伴者 {i + 1}</div>
                {[
                  ['お名前', `${comp.lastName} ${comp.firstName}`],
                  ['参加区分', comp.isFirst ? '🆕 初回参加' : '↩️ リピート参加'],
                  ['懇親会', comp.party ? `🙋 参加（¥${EVENT.party.fee.toLocaleString()}）` : '🙅 不参加'],
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
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>申込合計</div><div style={{ fontSize: 24, fontWeight: 900, color: '#2d7a4a' }}>{totalApplying}<span style={{ fontSize: 11, color: '#aaa' }}>名</span></div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: '#888' }}>懇親会参加</div><div style={{ fontSize: 24, fontWeight: 900, color: '#1a7a4a' }}>{partyCount}<span style={{ fontSize: 11, color: '#aaa' }}>名</span></div></div>
                </div>
                {partyCount > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#888' }}>懇親会 当日払い合計</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#2d7a4a' }}>¥{partyTotal.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '13px 15px', background: '#f8fbff', borderRadius: 10, border: '1px solid #dde8f5', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: '#2d7a4a' }} />
                <span style={{ fontSize: 12, color: '#4a6070', lineHeight: 1.7 }}>注意事項および個人情報の取り扱いに同意します。同伴者の情報についても代表者として同意・提供する権限があることを確認しました。</span>
              </label>
            </div>
            {!agreed && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 12 }}>同意が必要です</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', borderRadius: 11, border: '1.5px solid #d4eadc', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#6a8070' }}>← 修正する</button>
              <button onClick={handleNext} disabled={!agreed || submitting}
                style={{ flex: 2, padding: '13px', borderRadius: 11, border: 'none', cursor: agreed && !submitting ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 800,
                  background: agreed && !submitting ? 'linear-gradient(135deg,#1a3a2a,#2d7a4a)' : '#e5e7eb', color: agreed && !submitting ? '#fff' : '#9ca3af' }}>
                {submitting ? '送信中...' : '送信する ✓'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 完了 */}
        {step === 3 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', boxShadow: '0 2px 20px rgba(30,80,50,0.08)', border: `2px solid ${submitted === 'waiting' ? '#fcd34d' : '#a7f3d0'}`, textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 14 }}>{submitted === 'waiting' ? '⏳' : '✅'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a3a2a', marginBottom: 8 }}>
              {submitted === 'waiting' ? 'キャンセル待ち受付完了' : 'お申込みが完了しました！'}
            </h2>
            <p style={{ fontSize: 13, color: '#6a8070', lineHeight: 1.9, marginBottom: 22 }}>
              {submitted === 'waiting'
                ? 'キャンセル待ちを受け付けました。空きが出た場合、申込順に参加確定のご連絡をいたします。'
                : '確認メールをお送りしました。当日のご参加をお待ちしております！'}
            </p>
            <button onClick={() => { setStep(0); setForm({ lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', email: '', emailConfirm: '', phone: '', shopId: '', isFirst: null, party: null, prefecture: '', remarks: '' }); setCompanions([]); setAgreed(false); setSubmitted(null); }}
              style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #d4eadc', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#6a8070' }}>
              別の方の申込みをする
            </button>
          </div>
        )}
      </div>
    </div>
  )
}