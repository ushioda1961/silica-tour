'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STAFF_PASSWORD = 'silica2026'

type Participant = {
  id: string
  last_name: string
  first_name: string
  last_name_kana: string
  first_name_kana: string
  email: string
  phone: string
  shop_id: string
  is_first: boolean
  party: boolean
  status: 'confirmed' | 'waiting' | 'cancelled'
  wait_no: number | null
  remarks: string
  created_at: string
  companions: Companion[]
}

type Companion = {
  id: string
  last_name: string
  first_name: string
  is_first: boolean
  party: boolean
}

export default function StaffPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'waiting' | 'cancelled'>('all')
  const [actionMsg, setActionMsg] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{ type: string, participant: Participant } | null>(null)

  const handleLogin = () => {
    if (password === STAFF_PASSWORD) {
      setLoggedIn(true)
      fetchParticipants()
    } else {
      setPwError('パスワードが違います')
    }
  }

  const fetchParticipants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('participants')
      .select('*, companions(*)')
      .order('created_at', { ascending: true })
    if (!error && data) setParticipants(data)
    setLoading(false)
  }

  const handlePromote = async (p: Participant) => {
    const { error } = await supabase
      .from('participants')
      .update({ status: 'confirmed', wait_no: null })
      .eq('id', p.id)
    if (!error) {
      setActionMsg(`✅ ${p.last_name} ${p.first_name}さんを確定に昇格しました`)
      fetchParticipants()
    }
    setConfirmDialog(null)
    setTimeout(() => setActionMsg(''), 3000)
  }

  const handleCancel = async (p: Participant) => {
    const { error } = await supabase
      .from('participants')
      .update({ status: 'cancelled' })
      .eq('id', p.id)
    if (!error) {
      setActionMsg(`🚫 ${p.last_name} ${p.first_name}さんをキャンセルしました`)
      fetchParticipants()
    }
    setConfirmDialog(null)
    setTimeout(() => setActionMsg(''), 3000)
  }

  const filtered = participants.filter(p => filter === 'all' || p.status === filter)
  const confirmedCount = participants.filter(p => p.status === 'confirmed').reduce((s, p) => s + 1 + (p.companions?.length || 0), 0)
  const waitingCount = participants.filter(p => p.status === 'waiting').length
  const cancelledCount = participants.filter(p => p.status === 'cancelled').length

  const statusLabel = (s: string) => {
    if (s === 'confirmed') return { text: '確定', color: '#2d7a4a', bg: '#f0fdf4', border: '#86efac' }
    if (s === 'waiting') return { text: 'キャンセル待ち', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' }
    return { text: 'キャンセル', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
  }

  if (!loggedIn) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1a3a2a' }}>スタッフログイン</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>工場見学会 管理システム</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6080', marginBottom: 6 }}>パスワード</div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPwError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="パスワードを入力"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: `1.5px solid ${pwError ? '#fca5a5' : '#dde8f5'}`, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }}
          />
          {pwError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{pwError}</div>}
        </div>
        <button onClick={handleLogin} style={{ width: '100%', padding: '13px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff' }}>
          ログイン
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: '#f0f4f8', minHeight: '100vh' }}>

      {/* ヘッダー */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>🏭</div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>STAFF MANAGEMENT</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>スタッフ管理画面</div>
            </div>
          </div>
          <button onClick={() => setLoggedIn(false)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
            ログアウト
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 18px' }}>

        {/* 確認・通知メッセージ */}
        {actionMsg && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#1a3a2a' }}>
            {actionMsg}
          </div>
        )}

        {/* サマリー */}
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

        {/* フィルター */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'すべて' },
            { key: 'confirmed', label: '✅ 確定' },
            { key: 'waiting', label: '⏳ 待ち' },
            { key: 'cancelled', label: '🚫 キャンセル' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter === f.key ? '#2d7a4a' : '#dde8f5'}`, background: filter === f.key ? '#2d7a4a' : '#fff', color: filter === f.key ? '#fff' : '#6a8090', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
          <button onClick={fetchParticipants} style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 20, border: '1.5px solid #dde8f5', background: '#fff', color: '#6a8090', fontSize: 12, cursor: 'pointer' }}>
            🔄 更新
          </button>
        </div>

        {/* 参加者リスト */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#2d7a4a', fontSize: 14 }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: 14 }}>該当する参加者がいません</div>
        ) : (
          filtered.map(p => {
            const sl = statusLabel(p.status)
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 13, padding: '18px 20px', marginBottom: 10, border: `1.5px solid ${sl.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#1a2a3a' }}>{p.last_name} {p.first_name}</span>
                      <span style={{ fontSize: 10, color: '#888' }}>（{p.last_name_kana} {p.first_name_kana}）</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: sl.color, background: sl.bg, border: `1px solid ${sl.border}`, borderRadius: 5, padding: '2px 7px' }}>
                        {p.status === 'waiting' ? `待ち ${p.wait_no}番` : sl.text}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6a8090', lineHeight: 1.8 }}>
                      <span>📧 {p.email}</span>　<span>📞 {p.phone}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6a8090' }}>
                      <span>{p.is_first ? '🆕 初回' : '↩️ リピート'}</span>　
                      <span>{p.party ? '🍻 懇親会参加' : '懇親会不参加'}</span>
                      {p.companions?.length > 0 && <span>　👥 同伴者{p.companions.length}名</span>}
                    </div>
                    {p.remarks && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>💬 {p.remarks}</div>}
                    {p.companions?.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
                        {p.companions.map((c, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#6a8090', lineHeight: 1.7 }}>
                            👤 {c.last_name} {c.first_name}　{c.is_first ? '🆕 初回' : '↩️ リピート'}　{c.party ? '🍻 懇親会参加' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
                    {p.status === 'waiting' && (
                      <button onClick={() => setConfirmDialog({ type: 'promote', participant: p })}
                        style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1a3a2a,#2d7a4a)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                        ✅ 確定に昇格
                      </button>
                    )}
                    {p.status !== 'cancelled' && (
                      <button onClick={() => setConfirmDialog({ type: 'cancel', participant: p })}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        🚫 キャンセル
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 確認ダイアログ */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>
              {confirmDialog.type === 'promote' ? '✅' : '🚫'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a3a', textAlign: 'center', marginBottom: 8 }}>
              {confirmDialog.type === 'promote' ? '確定に昇格しますか？' : 'キャンセルしますか？'}
            </div>
            <div style={{ fontSize: 13, color: '#6a8090', textAlign: 'center', marginBottom: 20 }}>
              {confirmDialog.participant.last_name} {confirmDialog.participant.first_name}さん
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDialog(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1.5px solid #dde8f5', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6a8090', fontWeight: 700 }}>
                戻る
              </button>
              <button onClick={() => confirmDialog.type === 'promote' ? handlePromote(confirmDialog.participant) : handleCancel(confirmDialog.participant)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  background: confirmDialog.type === 'promote' ? 'linear-gradient(135deg,#1a3a2a,#2d7a4a)' : '#ef4444', color: '#fff' }}>
                {confirmDialog.type === 'promote' ? '昇格する' : 'キャンセルする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}