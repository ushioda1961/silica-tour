const fs = require('fs');
let c = fs.readFileSync('app/staff/page.tsx', 'utf8');

const newMakerView = `if (userInfo?.role === 'maker') return (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", background: '#f0f4f8', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d5a3a)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>🏭</div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>MAKER VIEW</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>参加者一覧（メーカー用）</div>
            </div>
          </div>
          <button onClick={() => setLoggedIn(false)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: '参加確定', count: confirmedCount, icon: '✅', color: '#2d7a4a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'キャンセル待ち', count: waitingCount, icon: '⏳', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'キャンセル', count: cancelledCount, icon: '🚫', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: \`1.5px solid \${s.border}\`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}<span style={{ fontSize: 11, color: '#aaa', marginLeft: 2 }}>名</span></div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 13, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1a3a2a', color: '#fff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>氏名</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>都道府県</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>販売店</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>代理店</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>区分</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>懇親会</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>状態</th>
              </tr>
            </thead>
            <tbody>
              {participants.filter(p => p.status !== 'cancelled').map((p, i) => {
                const shop = shops.find(s => s.id === p.shop_id)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{p.last_name} {p.first_name}<br/><span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>{p.last_name_kana} {p.first_name_kana}</span></td>
                    <td style={{ padding: '10px 12px', color: '#6a8090' }}>{(p as any).prefecture || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#6a8090' }}>{shop?.name || p.shop_id}</td>
                    <td style={{ padding: '10px 12px', color: '#6a8090' }}>{shop?.agent_name || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>{p.is_first ? '🆕 初回' : '↩️ リピート'}</td>
                    <td style={{ padding: '10px 12px' }}>{p.party ? '🍻 参加' : '-'}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, fontWeight: 800, color: p.status === 'confirmed' ? '#2d7a4a' : '#d97706', background: p.status === 'confirmed' ? '#f0fdf4' : '#fffbeb', border: \`1px solid \${p.status === 'confirmed' ? '#86efac' : '#fcd34d'}\`, borderRadius: 5, padding: '2px 7px' }}>{p.status === 'confirmed' ? '確定' : '待ち'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )`;

// Find and replace the maker return block
const makerRegex = /if \(userInfo\?\.role === 'maker'\) return \([\s\S]*?\n  \)/;
if (makerRegex.test(c)) {
  c = c.replace(makerRegex, newMakerView);
  fs.writeFileSync('app/staff/page.tsx', c);
  console.log('done');
} else {
  console.log('ERROR: maker block not found');
}
