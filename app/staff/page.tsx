'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Role = 'admin' | 'agent' | 'shop' | 'maker'
type UserInfo = { login_id: string; role: Role; shop_id: string | null }
type Participant = {
  id: string; last_name: string; first_name: string
  last_name_kana: string; first_name_kana: string
  email: string; phone: string; shop_id: string
  is_first: boolean; party: boolean
  status: 'confirmed' | 'waiting' | 'cancelled'
  wait_no: number | null; remarks: string; registered_at: string
  companions: Companion[]
}
type Companion = { id: string; last_name: string; first_name: string; is_first: boolean; party: boolean }
type Shop = { id: string; name: string; agent_name: string }

export default function StaffPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'waiting' | 'cancelled'>('all')
  const [actionMsg, setActionMsg] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; participant: Participant } | null>(null)

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('users').select('*')
      .eq('login_id', loginId).eq('password', password).single()
    if (error || !data) { setPwError('IDまたはパスワードが違います'); return }
    setUserInfo({ login_id: data.login_id, role: data.role, shop_id: data.shop_id })
    setLoggedIn(true)
  }

  const fetchData = async (user: UserInfo) => {
    setLoading(true)
    const { data: shopData } = await supabase.from('shops').select('*')
    if (shopData) setShops(shopData)
    let query = supabase.from('participants').select('*, companions(*)').order('registered_at', { ascending: true })
    if (user.role === 'shop') {
      query = query.eq('shop_id', user.shop_id!)
    } else if (user.role === 'agent') {
      const agentShops = shopData?.filter(s => s.agent_name === getAgentName(user.login_id)) || []
      const shopIds = agentShops.map(s => s.id)
      if (shopIds.length > 0) query = query.in('shop_id', shopIds)
    }
    const { data } = await query
    if (data) setParticipants(data)
    setLoading(false)
  }

  const getAgentName = (loginId: string) => {
    const map: Record<string, string> = {
      'ushioda': '牛王田雅章', 'kawakami': '川上利夫', 'ikeo': '池尾里絵', 'fujii': '藤井佑昴'
    }
    return map[loginId] || ''
  }

  useEffect(() => {
    if (loggedIn && userInfo) fetchData(userInfo)
  }, [loggedIn, userInfo])

  const handlePromote = async (p: Participant) => {
    const { error } = await supabase.from('participants').update({ status: 'confirmed', wait_no: null }).eq('id', p.id)
    if (!error) { setActionMsg(`✅ ${p.last_name} ${p.first_name}さんを確定に昇格しました`); fetchData(userInfo!) }
    setConfirmDialog(null); setTimeout(() => setActionMsg(''), 3000)
  }

  const handleCancel = async (p: Participant) => {
    const { error } = await supabase.from('participants').update({ status: 'cancelled' }).eq('id', p.id)
    if (!error) { setActionMsg(`🚫 ${p.last_name} ${p.first_name}さんをキャンセルしました`); fetchData(userInfo!) }
    setConfirmDialog(null); setTimeout(() => setActionMsg(''), 3000)
  }

  const getShopName = (shopId: string) => shops.find(s => s.id === shopId)?.name || shopId
  const filtered = participants.filter(p => filter === 'all' || p.status === filter)
  const confirmedCount = participants.filter(p => p.status === 'confirmed').reduce((s, p) => s + 1 + (p.companions?.length || 0), 0)
  const waitingCount = participants.filter(p => p.status === 'waiting').length
  const cancelledCount = participants.filter(p => p.status === 'cancelled').length
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed')
  const firstTimers = confirmedParticipants.filter(p => p.is_first).length
  const firstTimerCompanions = confirmedParticipants.flatMap(p => p.companions || []).filter(c => c.is_first).length
  const repeaters = confirmedParticipants.filter(p => !p.is_first).length
  const repeaterCompanions = confirmedParticipants.flatMap(p => p.companions || []).filter(c => !c.is_first).length
  const partyCount = confirmedParticipants.filter(p => p.party).length + confirmedParticipants.flatMap(p => p.companions || []).filter(c => c.party).length

  const statusLabel = (s: string) => {
    if (s === 'confirmed') return { text: '確定', color: '#2d7a4a', bg: '#f0fdf4', border: '#86efac' }
    if (s === 'waiting') return { text: 'キャンセル待ち', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' }
    return { text: 'キャンセル', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
  }

  const roleLabel = (role: Role) => {
    if (role === 'admin') return '総合管理者'
    if (role === 'agent') return '代理店'
    if (role === 'shop') return '販売店'
    return 'メーカー'
  }

  // ─── ログイン画面 ───
  if (!loggedIn) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1a3a2a' }}>ログイン</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>工場見学会 管理システム</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6080', marginBottom: 6 }}>ログインID</div>
          <input type="text" value={loginId} onChange={e => { setLoginId(e.target.value); setPwError('') }} placeholder="IDを入力"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #dde8f5', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6080', marginBottom: 6 }}>パスワード</div>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPwError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="パスワードを入力"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: `1.5px solid ${pwError ? '#fca5a5' : '#dde8f5'}`, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }} />
          {pwError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{pwError}</div>}
        </div>
        <button onClick={handleLogin} style={{ width: '100%', padding: '13px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff' }}>ログイン</button>
      </div>
    </div>
  )

  // ─── メーカービュー ───
  if (userInfo?.role === 'maker') {
    const makerParticipants = participants.filter(p => p.status !== 'cancelled')
    return (
      <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: '#0a0f1a', minHeight: '100vh' }}>
        <style>{`
          @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          .pcard { animation: slideIn 0.3s ease both; }
          .pcard:nth-child(2) { animation-delay: 0.05s; }
          .pcard:nth-child(3) { animation-delay: 0.1s; }
          .pcard:nth-child(4) { animation-delay: 0.15s; }
          .pcard:nth-child(5) { animation-delay: 0.2s; }
        `}</style>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏭</div>
              <div>
                <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Maker View</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>来場者チェック</div>
              </div>
            </div>
            <button onClick={() => setLoggedIn(false)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>ログアウト</button>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { label: '参加確定', val: confirmedCount, color: '#22c55e', glow: 'rgba(34,197,94,0.3)', icon: '✅' },
              { label: '初回', val: firstTimers + firstTimerCompanions, color: '#fb923c', glow: 'rgba(251,146,60,0.3)', icon: '🆕' },
              { label: 'リピート', val: repeaters + repeaterCompanions, color: '#60a5fa', glow: 'rgba(96,165,250,0.3)', icon: '🔄' },
              { label: '懇親会', val: partyCount, color: '#c084fc', glow: 'rgba(192,132,252,0.3)', icon: '🍻' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 6px', textAlign: 'center', boxShadow: `0 0 16px ${s.glow}` }}>
                <div style={{ fontSize: 13, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: s.color, marginTop: 3, fontWeight: 700, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 18, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'linear-gradient(135deg,#fb923c,#f97316)', boxShadow: '0 0 8px rgba(251,146,60,0.5)' }} />
              <span style={{ color: '#fb923c', fontWeight: 700 }}>初回</span><span style={{ color: '#475569' }}>のお客様</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', boxShadow: '0 0 8px rgba(96,165,250,0.5)' }} />
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>リピート</span><span style={{ color: '#475569' }}>のお客様</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#22c55e', fontSize: 14 }}>読み込み中...</div>
          ) : makerParticipants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#334155', fontSize: 14 }}>参加者がいません</div>
          ) : (
            makerParticipants.map((p) => {
              const shop = shops.find(s => s.id === p.shop_id)
              const isFirst = p.is_first
              const C = isFirst
                ? { main: '#fb923c', dark: '#c2410c', light: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', glow: 'rgba(251,146,60,0.2)', label: '初 回', stripe: '#f97316' }
                : { main: '#60a5fa', dark: '#1d4ed8', light: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', glow: 'rgba(96,165,250,0.2)', label: 'リピート', stripe: '#3b82f6' }
              return (
                <div key={p.id} className="pcard" style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${C.border}`, boxShadow: `0 4px 24px ${C.glow}`, background: '#0d1424' }}>
                  <div style={{ background: `linear-gradient(90deg, ${C.stripe}, ${C.dark})`, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '3px 10px' }}>{C.label}</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{p.last_name} {p.first_name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{p.last_name_kana} {p.first_name_kana}</span>
                    </div>
                    {p.status === 'waiting' && (
                      <div style={{ fontSize: 11, color: '#fef08a', fontWeight: 800, background: 'rgba(0,0,0,0.3)', borderRadius: 5, padding: '2px 8px' }}>⏳ 待ち{p.wait_no}番</div>
                    )}
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ background: C.light, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${C.stripe}, ${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏪</div>
                      <div>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 3 }}>担当販売者</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>{shop?.name || p.shop_id}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                      {p.party && <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 7, padding: '4px 10px', fontSize: 11, color: '#c084fc', fontWeight: 700 }}>🍻 懇親会参加</div>}
                      {(p as any).prefecture && <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 10px', fontSize: 11, color: '#94a3b8' }}>📍 {(p as any).prefecture}</div>}
                    </div>
                    {p.companions?.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#475569', width: '100%', marginBottom: 2 }}>同伴者</span>
                        {p.companions.map((c, i) => {
                          const CC = c.is_first
                            ? { main: '#fb923c', light: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', label: '初回' }
                            : { main: '#60a5fa', light: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', label: 'リピート' }
                          return (
                            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: CC.light, border: `1px solid ${CC.border}`, borderRadius: 7, padding: '5px 11px', fontSize: 12 }}>
                              <span style={{ fontSize: 9, fontWeight: 900, color: CC.main, background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '1px 5px' }}>{CC.label}</span>
                              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{c.last_name} {c.first_name}</span>
                              {c.party && <span style={{ color: '#c084fc' }}>🍻</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ─── admin / agent / shop 共通ビュー ───
  return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: '#f0f4f8', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>🏭</div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{roleLabel(userInfo!.role).toUpperCase()} VIEW</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>スタッフ管理画面</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', borderRadius: 5, padding: '3px 8px' }}>{roleLabel(userInfo!.role)}</div>
            <button onClick={() => setLoggedIn(false)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>ログアウト</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 18px' }}>
        {actionMsg && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#1a3a2a' }}>{actionMsg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: '参加確定', count: confirmedCount, icon: '✅', color: '#2d7a4a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'キャンセル待ち', count: waitingCount, icon: '⏳', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'キャンセル', count: cancelledCount, icon: '🚫', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.count}<span style={{ fontSize: 11, color: '#aaa', marginLeft: 2 }}>名</span></div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
          {[{ key: 'all', label: 'すべて' }, { key: 'confirmed', label: '✅ 確定' }, { key: 'waiting', label: '⏳ 待ち' }, { key: 'cancelled', label: '🚫 キャンセル' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter === f.key ? '#2d7a4a' : '#dde8f5'}`, background: filter === f.key ? '#2d7a4a' : '#fff', color: filter === f.key ? '#fff' : '#6a8090', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
          <button onClick={() => fetchData(userInfo!)} style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 20, border: '1.5px solid #dde8f5', background: '#fff', color: '#6a8090', fontSize: 12, cursor: 'pointer' }}>🔄 更新</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#2d7a4a', fontSize: 14 }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: 14 }}>該当する参加者がいません</div>
        ) : (
          filtered.map(p => {
            const sl = statusLabel(p.status)
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 13, padding: '18px 20px', marginBottom: 10, border: `1.5px solid ${sl.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#1a2a3a' }}>{p.last_name} {p.first_name}</span>
                      <span style={{ fontSize: 10, color: '#888' }}>（{p.last_name_kana} {p.first_name_kana}）</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: sl.color, background: sl.bg, border: `1px solid ${sl.border}`, borderRadius: 5, padding: '2px 7px' }}>
                        {p.status === 'waiting' ? `待ち ${p.wait_no}番` : sl.text}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6a8090', lineHeight: 1.8 }}>
                      <span>📧 {p.email} </span><span>📞 {p.phone}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6a8090' }}>
                      <span>🏪 {getShopName(p.shop_id)} </span>
                      <span>{p.is_first ? '🆕 初回' : '↩️ リピート'} </span>
                      <span>{p.party ? '🍻 懇親会参加' : '懇親会不参加'}</span>
                      {p.companions?.length > 0 && <span> 👥 同伴者{p.companions.length}名</span>}
                    </div>
                    {p.remarks && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>💬 {p.remarks}</div>}
                    {p.companions?.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
                        {p.companions.map((c, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#6a8090', lineHeight: 1.7 }}>
                            👤 {c.last_name} {c.first_name} {c.is_first ? '🆕 初回' : '↩️ リピート'}{c.party ? ' 🍻 懇親会参加' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {(userInfo?.role === 'admin' || userInfo?.role === 'agent') && (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, minWidth: 120 }}>
                      {p.status === 'waiting' && (
                        <button onClick={() => setConfirmDialog({ type: 'promote', participant: p })}
                          style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✅ 確定に昇格</button>
                      )}
                      {p.status !== 'cancelled' && (
                        <button onClick={() => setConfirmDialog({ type: 'cancel', participant: p })}
                          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🚫 キャンセル</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>{confirmDialog.type === 'promote' ? '✅' : '🚫'}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a3a', textAlign: 'center', marginBottom: 8 }}>
              {confirmDialog.type === 'promote' ? '確定に昇格しますか？' : 'キャンセルしますか？'}
            </div>
            <div style={{ fontSize: 13, color: '#6a8090', textAlign: 'center', marginBottom: 20 }}>
              {confirmDialog.participant.last_name} {confirmDialog.participant.first_name}さん
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDialog(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1.5px solid #dde8f5', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6a8090', fontWeight: 700 }}>戻る</button>
              <button onClick={() => confirmDialog.type === 'promote' ? handlePromote(confirmDialog.participant) : handleCancel(confirmDialog.participant)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', background: confirmDialog.type === 'promote' ? 'linear-gradient(135deg,#1a3a2a,#2d7a4a)' : '#ef4444', color: '#fff' }}>
                {confirmDialog.type === 'promote' ? '昇格する' : 'キャンセルする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
