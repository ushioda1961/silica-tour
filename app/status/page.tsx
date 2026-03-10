'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const CAPACITY = 50

export default function StatusPage() {
  const [confirmed, setConfirmed] = useState(0)
  const [waiting, setWaiting] = useState(0)
  const [shops, setShops] = useState<{ id: string; name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchData = async () => {
    // 販売店一覧取得
    const { data: shopData } = await supabase
      .from('shops')
      .select('id, name')
      .order('id')

    // 確定参加者取得
    const { data: confirmedData } = await supabase
      .from('participants')
      .select('id, shop_id, companions(id)')
      .eq('status', 'confirmed')

    // キャンセル待ち取得
    const { data: waitingData } = await supabase
      .from('participants')
      .select('id, companions(id)')
      .eq('status', 'waiting')

    if (confirmedData) {
      const total = confirmedData.reduce((s: number, p: any) =>
        s + 1 + (p.companions?.length || 0), 0)
      setConfirmed(total)
    }

    if (waitingData) {
      const totalWait = waitingData.reduce((s: number, p: any) =>
        s + 1 + (p.companions?.length || 0), 0)
      setWaiting(totalWait)
    }

    if (shopData && confirmedData) {
      const shopCounts = shopData.map((shop: any) => {
        const count = confirmedData
          .filter((p: any) => p.shop_id === shop.id)
          .reduce((s: number, p: any) => s + 1 + (p.companions?.length || 0), 0)
        return { id: shop.id, name: shop.name, count }
      })
      setShops(shopCounts)
    }

    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [])

  const remaining = CAPACITY - confirmed
  const fillPct = Math.round((confirmed / CAPACITY) * 100)
  const isFull = remaining <= 0
  const isNearFull = remaining <= 10 && !isFull
  const barColor = isFull ? '#ef4444' : isNearFull ? '#f59e0b' : '#22c55e'
  const remainColor = isFull ? '#ef4444' : isNearFull ? '#f59e0b' : '#16a34a'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#22c55e', fontSize: 16, fontFamily: 'sans-serif' }}>
      読み込み中...
    </div>
  )

  return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 50%,#0f2027 100%)', minHeight: '100vh', padding: '0 0 60px', color: '#e2e8f0' }}>

      {/* ヘッダー */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏭</div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.15em' }}>FACTORY TOUR</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>定員状況</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#475569' }}>最終更新</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{lastUpdated.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>30秒ごとに自動更新</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>

        {/* イベント情報 */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>シリカ製造工場 無料見学会</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>📅 2026年5月23日（土）13:00〜16:00</div>
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠️ 定員となり次第締め切ります</div>
        </div>

        {/* 定員メインカード */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${isFull ? 'rgba(239,68,68,0.4)' : isNearFull ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 16, padding: '24px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${isFull ? 'rgba(239,68,68,0.15)' : isNearFull ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>残り枠</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: remainColor }}>{remaining}</span>
                <span style={{ fontSize: 16, color: '#64748b' }}>/ {CAPACITY}名</span>
              </div>
              {isFull && <div style={{ display: 'inline-block', marginTop: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 800, color: '#ef4444' }}>満員</div>}
              {isNearFull && <div style={{ display: 'inline-block', marginTop: 6, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>残りわずか</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>参加確定</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{confirmed}<span style={{ fontSize: 12, color: '#64748b' }}>名</span></div>
              {waiting > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, marginBottom: 2 }}>キャンセル待ち</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{waiting}<span style={{ fontSize: 11, color: '#64748b' }}>名</span></div>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#475569' }}>0</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{fillPct}% 埋まっています</span>
              <span style={{ fontSize: 10, color: '#475569' }}>{CAPACITY}名</span>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fillPct}%`, background: `linear-gradient(90deg,${barColor},${isFull ? '#dc2626' : isNearFull ? '#d97706' : '#16a34a'})`, borderRadius: 99, boxShadow: `0 0 10px ${barColor}88` }} />
            </div>
          </div>
        </div>

        {/* 販売者別 */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🏪</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>担当販売者別 参加状況</span>
          </div>
          {shops.filter(s => s.count > 0).map((shop, i, arr) => (
            <div key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#22c55e' }}>{shop.id.replace('S','')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, marginBottom: 3 }}>{shop.name}</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((shop.count / 8) * 100, 100)}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e', minWidth: 30, textAlign: 'right' }}>{shop.count}<span style={{ fontSize: 10, color: '#475569', fontWeight: 400 }}>名</span></div>
            </div>
          ))}
          {shops.filter(s => s.count === 0).length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 11, color: '#475569' }}>未申込: {shops.filter(s => s.count === 0).map(s => s.name).join('、')}</span>
            </div>
          )}
        </div>

        {/* 申込ボタン */}
        {!isFull ? (
          <a href="/" style={{ display: 'block', textDecoration: 'none', background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', borderRadius: 12, padding: '14px', textAlign: 'center', fontSize: 14, fontWeight: 800, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
            参加申込みはこちら →
          </a>
        ) : (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px', textAlign: 'center', fontSize: 13, color: '#f87171', fontWeight: 700 }}>
            定員に達しました（キャンセル待ちは申込フォームから）
          </div>
        )}
      </div>
    </div>
  )
}
