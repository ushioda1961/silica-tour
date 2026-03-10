'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Event = { id: string; title: string; date: string; time_start: string; time_end: string; capacity: number; party_fee: number; party_time: string }
type Shop = { id: string; name: string; agent_name: string }

export default function ShopRegisterPage() {
  const [step, setStep] = useState<'login' | 'select' | 'form' | 'done'>('login')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [shop, setShop] = useState<Shop | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)

  // フォーム項目
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastNameKana, setLastNameKana] = useState('')
  const [firstNameKana, setFirstNameKana] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isFirst, setIsFirst] = useState(true)
  const [party, setParty] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [companions, setCompanions] = useState<{last_name:string;first_name:string;is_first:boolean;party:boolean}[]>([])
  const [formError, setFormError] = useState('')

  const handleLogin = async () => {
    setLoginError('')
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('login_id', loginId.trim())
      .eq('password', password.trim())
      .eq('role', 'shop')
      .single()
    if (error || !data) { setLoginError('IDまたはパスワードが違います'); setLoading(false); return }

    // 対応するshop情報を取得
    const { data: shopData } = await supabase.from('shops').select('*').eq('id', data.shop_id).single()
    if (!shopData) { setLoginError('販売者情報が見つかりません'); setLoading(false); return }
    setShop(shopData)

    // イベント一覧取得
    const { data: evtData } = await supabase.from('events').select('*').eq('status','open').order('date',{ascending:true})
    if (evtData) setEvents(evtData)

    setLoading(false)
    setStep('select')
  }

  const handleSubmit = async () => {
    setFormError('')
    if (!lastName || !firstName || !lastNameKana || !firstNameKana || !email || !phone) {
      setFormError('必須項目をすべて入力してください'); return
    }
    if (!selectedEvent || !shop) return
    setLoading(true)

    // 定員確認
    const { count } = await supabase.from('participants').select('*', {count:'exact',head:true}).eq('event_id', selectedEvent.id).eq('status','confirmed')
    const isWaiting = (count || 0) >= selectedEvent.capacity
    const waitNo = isWaiting ? ((count || 0) - selectedEvent.capacity + 1) : null

    const { data: inserted, error } = await supabase.from('participants').insert({
      event_id: selectedEvent.id,
      last_name: lastName, first_name: firstName,
      last_name_kana: lastNameKana, first_name_kana: firstNameKana,
      email, phone,
      shop_id: shop.id,
      user_type: 'shop',
      is_first: isFirst,
      party,
      remarks,
      status: isWaiting ? 'waiting' : 'confirmed',
      wait_no: waitNo,
    }).select().single()

    if (error || !inserted) { setFormError('登録に失敗しました。もう一度お試しください'); setLoading(false); return }

    // 同伴者登録
    if (companions.length > 0) {
      await supabase.from('companions').insert(companions.map(c => ({ participant_id: inserted.id, ...c })))
    }

    setLoading(false)
    setStep('done')
  }

  const addCompanion = () => setCompanions([...companions, { last_name:'', first_name:'', is_first: true, party: false }])
  const removeCompanion = (i: number) => setCompanions(companions.filter((_,idx) => idx !== i))
  const updateCompanion = (i: number, key: string, val: any) => setCompanions(companions.map((c,idx) => idx === i ? {...c, [key]: val} : c))

  const formatDate = (d: string) => {
    const dt = new Date(d)
    const days = ['日','月','火','水','木','金','土']
    return `${dt.getMonth()+1}月${dt.getDate()}日（${days[dt.getDay()]}）`
  }

  const bg = '#0d1424'
  const card: React.CSSProperties = { background: '#111827', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 520, margin: '0 auto', width: '100%' }
  const label: React.CSSProperties = { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: 600 }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#1e293b', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }
  const disabledInput: React.CSSProperties = { ...inputStyle, background: '#0f172a', color: '#64748b', cursor: 'not-allowed' }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
        <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 900 }}>シリカ製造工場 無料見学会</div>
        <div style={{ color: '#10b981', fontSize: 13, marginTop: 4, fontWeight: 700 }}>🏪 販売者専用 参加申込</div>
      </div>

      {/* ── STEP 1: ログイン ── */}
      {step === 'login' && (
        <div style={card}>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
            販売者IDとパスワードでログインしてください。<br />担当販売者名は自動的にセットされます。
          </p>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>販売者ログインID</label>
            <input value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="例：shop_s01" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>パスワード</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" style={inputStyle} />
          </div>
          {loginError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>{loginError}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: loading ? '#334155' : 'linear-gradient(135deg,#10b981,#047857)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'ログイン中...' : 'ログイン →'}
          </button>
        </div>
      )}

      {/* ── STEP 2: 開催回選択 ── */}
      {step === 'select' && shop && (
        <div style={card}>
          <div style={{ color: '#10b981', fontSize: 13, fontWeight: 800, marginBottom: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 14px' }}>
            🏪 {shop.name} さんとしてログイン中
          </div>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>参加希望の回をお選びください</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((evt, i) => {
              const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6']
              const C = colors[i] || '#3b82f6'
              return (
                <button key={evt.id} onClick={() => { setSelectedEvent(evt); setStep('form') }}
                  style={{ padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${C}40`, background: `${C}10`, color: '#f1f5f9', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>第{i+1}回　{formatDate(evt.date)}</span>
                  <span style={{ color: C, fontSize: 13 }}>選択 →</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: 申込フォーム ── */}
      {step === 'form' && shop && selectedEvent && (
        <div style={{ ...card, maxWidth: 560 }}>
          {/* 選択中イベント表示 */}
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>申込回</div>
              <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 900 }}>{formatDate(selectedEvent.date)}　{selectedEvent.time_start}〜{selectedEvent.time_end}</div>
            </div>
            <button onClick={() => setStep('select')} style={{ fontSize: 11, color: '#64748b', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>変更</button>
          </div>

          {/* 担当販売者（固定表示） */}
          <div style={{ marginBottom: 14 }}>
            <label style={label}>🏪 担当販売者（自動設定）</label>
            <input value={shop.name} disabled style={disabledInput} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={label}>姓 <span style={{color:'#ef4444'}}>*</span></label><input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="山田" style={inputStyle} /></div>
            <div><label style={label}>名 <span style={{color:'#ef4444'}}>*</span></label><input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="太郎" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={label}>姓（カナ） <span style={{color:'#ef4444'}}>*</span></label><input value={lastNameKana} onChange={e=>setLastNameKana(e.target.value)} placeholder="ヤマダ" style={inputStyle} /></div>
            <div><label style={label}>名（カナ） <span style={{color:'#ef4444'}}>*</span></label><input value={firstNameKana} onChange={e=>setFirstNameKana(e.target.value)} placeholder="タロウ" style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>メールアドレス <span style={{color:'#ef4444'}}>*</span></label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="example@email.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>電話番号 <span style={{color:'#ef4444'}}>*</span></label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="090-0000-0000" style={inputStyle} />
          </div>

          {/* 初回/リピート */}
          <div style={{ marginBottom: 14 }}>
            <label style={label}>参加区分 <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{v:true,l:'初回参加'},{v:false,l:'リピート'}].map(({v,l}) => (
                <button key={String(v)} onClick={()=>setIsFirst(v)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border: isFirst===v ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', background: isFirst===v ? 'rgba(245,158,11,0.12)' : 'transparent', color: isFirst===v ? '#f59e0b' : '#94a3b8', fontWeight: isFirst===v ? 900 : 400, cursor:'pointer', fontSize:13 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* 懇親会 */}
          <div style={{ marginBottom: 20 }}>
            <label style={label}>懇親会（{selectedEvent.party_fee.toLocaleString()}円・任意）</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{v:true,l:'参加する'},{v:false,l:'参加しない'}].map(({v,l}) => (
                <button key={String(v)} onClick={()=>setParty(v)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border: party===v ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', background: party===v ? 'rgba(139,92,246,0.12)' : 'transparent', color: party===v ? '#a78bfa' : '#94a3b8', fontWeight: party===v ? 900 : 400, cursor:'pointer', fontSize:13 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* 同伴者 */}
          {companions.map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ color:'#94a3b8', fontSize:12, fontWeight:700 }}>同伴者 {i+1}</span>
                <button onClick={()=>removeCompanion(i)} style={{ color:'#ef4444', background:'transparent', border:'none', fontSize:12, cursor:'pointer' }}>削除</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <input value={c.last_name} onChange={e=>updateCompanion(i,'last_name',e.target.value)} placeholder="姓" style={inputStyle} />
                <input value={c.first_name} onChange={e=>updateCompanion(i,'first_name',e.target.value)} placeholder="名" style={inputStyle} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>updateCompanion(i,'is_first',true)} style={{ flex:1, padding:'8px', borderRadius:7, border: c.is_first ? '2px solid #f59e0b':'1px solid rgba(255,255,255,0.1)', background: c.is_first ? 'rgba(245,158,11,0.1)':'transparent', color: c.is_first ? '#f59e0b':'#94a3b8', fontSize:12, cursor:'pointer' }}>初回</button>
                <button onClick={()=>updateCompanion(i,'is_first',false)} style={{ flex:1, padding:'8px', borderRadius:7, border: !c.is_first ? '2px solid #60a5fa':'1px solid rgba(255,255,255,0.1)', background: !c.is_first ? 'rgba(96,165,250,0.1)':'transparent', color: !c.is_first ? '#60a5fa':'#94a3b8', fontSize:12, cursor:'pointer' }}>リピート</button>
                <button onClick={()=>updateCompanion(i,'party',!c.party)} style={{ flex:1, padding:'8px', borderRadius:7, border: c.party ? '2px solid #8b5cf6':'1px solid rgba(255,255,255,0.1)', background: c.party ? 'rgba(139,92,246,0.1)':'transparent', color: c.party ? '#a78bfa':'#94a3b8', fontSize:12, cursor:'pointer' }}>🍻懇親会</button>
              </div>
            </div>
          ))}
          <button onClick={addCompanion} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px dashed rgba(255,255,255,0.15)', background:'transparent', color:'#64748b', fontSize:13, cursor:'pointer', marginBottom:16 }}>＋ 同伴者を追加</button>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>備考</label>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3} style={{ ...inputStyle, resize:'vertical' as const }} />
          </div>

          {formError && <div style={{ color:'#f87171', fontSize:13, marginBottom:14 }}>{formError}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', padding:14, borderRadius:10, border:'none', background: loading ? '#334155' : 'linear-gradient(135deg,#10b981,#047857)', color:'#fff', fontSize:16, fontWeight:900, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '送信中...' : '申込を確定する'}
          </button>
        </div>
      )}

      {/* ── STEP 4: 完了 ── */}
      {step === 'done' && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 900, marginBottom: 12 }}>申込が完了しました！</div>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8, marginBottom: 24 }}>
            ご参加ありがとうございます。<br />
            当日会場でお会いできることを楽しみにしております。
          </div>
          <button onClick={() => { setStep('select'); setLastName(''); setFirstName(''); setLastNameKana(''); setFirstNameKana(''); setEmail(''); setPhone(''); setCompanions([]); setRemarks('') }}
            style={{ padding:'10px 24px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', fontSize:14, cursor:'pointer' }}>
            別の回にも申込む
          </button>
        </div>
      )}
    </div>
  )
}
