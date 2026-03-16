undefined'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CancelPage() {
  const [step, setStep] = useState<'input' | 'confirm' | 'done' | 'notfound'>('input')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [participant, setParticipant] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setError('')
    if (!email.trim() || !name.trim()) { setError('お名前とメールアドレスを入力してください'); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('participants')
      .select('*, companions(*)')
      .eq('email', email.trim())
      .in('status', ['confirmed', 'waiting'])
      .single()
    setLoading(false)
    if (err || !data) { setStep('notfound'); return }
    const fullName = data.last_name + data.first_name
    const inputName = name.trim().replace(/\s/g, '')
    if (fullName !== inputName) { setStep('notfound'); return }
    setParticipant(data)
    setStep('confirm')
  }

  const handleCancel = async () => {
    if (!participant) return
    setLoading(true)
    await supabase
      .from('participants')
      .update({ status: 'cancelled' })
      .eq('id', participant.id)
    setLoading(false)
    setStep('done')
  }

  const bg = '#0d1424'
  const card = { background: '#111827', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 480, margin: '0 auto' }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
        <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 900 }}>シリカ製造工場 無料見学会</div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>参加キャンセル手続き</div>
      </div>

      {/* ── STEP 1: 入力 ── */}
      {step === 'input' && (
        <div style={card}>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
            申込時のお名前とメールアドレスを入力してください。<br />
            本人確認後にキャンセルの確認画面に進みます。
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>お名前（姓名続けて）</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：牛王田雅章"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#1e293b', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' as const }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>メールアドレス</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="例：example@email.com"
              type="email"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#1e293b', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' as const }}
            />
          </div>
          {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#334155' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '検索中...' : '申込情報を確認する →'}
          </button>
        </div>
      )}

      {/* ── STEP 2: 確認 ── */}
      {step === 'confirm' && participant && (
        <div style={card}>
          <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 700, marginBottom: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '10px 14px' }}>
            ⚠️ 以下の申込をキャンセルしますか？
          </div>
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{participant.last_name} {participant.first_name} 様</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>ステータス：{participant.status === 'confirmed' ? '✅ 参加確定' : '⏳ 補欠待ち'}</div>
            {participant.companions?.length > 0 && (
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                同伴者：{participant.companions.map((c: any) => c.last_name + c.first_name).join('、')}
              </div>
            )}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
            ※ キャンセル後の取り消しはできません。<br />
            ※ 同伴者も含めてキャンセルされます。
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setStep('input')}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}
            >
              戻る
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: loading ? '#334155' : 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '処理中...' : 'キャンセルを確定する'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: 完了 ── */}
      {step === 'done' && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 900, marginBottom: 12 }}>キャンセルが完了しました</div>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
            ご参加いただけなくなり残念ですが、<br />またの機会にぜひお越しください。<br /><br />
            ご不明な点は担当販売者にお問い合わせください。
          </div>
        </div>
      )}

      {/* ── 見つからない ── */}
      {step === 'notfound' && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 900, marginBottom: 12 }}>申込情報が見つかりません</div>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
            お名前またはメールアドレスが一致しないか、<br />
            すでにキャンセル済みの可能性があります。
          </div>
          <button
            onClick={() => setStep('input')}
            style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}
          >
            ← 入力画面に戻る
          </button>
        </div>
      )}
    </div>
  )
}
