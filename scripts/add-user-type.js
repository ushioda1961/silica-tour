const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

// 1. 初期値にuser_typeを追加
c = c.replace(
  "lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', prefecture: '',",
  "lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', prefecture: '', userType: 'customer',"
);

// 2. insertにuser_typeを追加
c = c.replace(
  'prefecture: form.prefecture,',
  'prefecture: form.prefecture,\n          user_type: form.userType,'
);

// 3. 都道府県の直前にuser_type選択欄を追加
c = c.replace(
  '<Lbl>都道府県</Lbl>',
  `<Lbl>参加区分</Lbl>
                <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                  {[{ value: 'customer', label: '👤 一般のお客様', desc: '販売者のお客様' }, { value: 'shop', label: '🏪 販売者', desc: '販売店担当者' }].map(opt => (
                    <label key={opt.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: \`2px solid \${form.userType === opt.value ? '#2d7a4a' : '#e0e0e0'}\`, background: form.userType === opt.value ? '#f0fdf4' : '#fafafa', cursor: 'pointer' }}>
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
                <Lbl>都道府県</Lbl>`
);

fs.writeFileSync('app/page.tsx', c);
console.log('done');
