import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// スタッフ通知先メールアドレス（ここに追加してください）
const STAFF_EMAILS = [
  'u-mail@ushioda-masaaki.com',
  // 'staff2@example.com',  // 2人目のスタッフ
  // 'staff3@example.com',  // 3人目のスタッフ
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, participant, companions = [] } = body

    const totalCount = 1 + companions.length
    const partyCount = (participant.party ? 1 : 0) + companions.filter((c: any) => c.party).length
    const partyTotal = partyCount * 3000

    const isWaiting = participant.status === 'waiting'
    const isCancel = type === 'cancel'
    const isPromote = type === 'promote'

    // 件名
    const getSubject = () => {
      if (isCancel) return `【キャンセル】${participant.last_name} ${participant.first_name}様 - シリカ工場見学会`
      if (isPromote) return `【参加確定】${participant.last_name} ${participant.first_name}様 - シリカ工場見学会`
      if (isWaiting) return `【キャンセル待ち受付】${participant.last_name} ${participant.first_name}様 - シリカ工場見学会`
      return `【申込完了】${participant.last_name} ${participant.first_name}様 - シリカ工場見学会`
    }

    // 申込者へのメール本文
    const getUserHtml = () => `
      <div style="font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#1a3a2a,#2d5a3a);padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;font-size:18px;margin:0;">🏭 シリカ製造工場 無料見学会</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">
            ${isCancel ? 'キャンセルを受け付けました' : isPromote ? '参加が確定しました！' : isWaiting ? 'キャンセル待ちを受け付けました' : 'お申込みありがとうございます！'}
          </p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #d4eadc;border-top:none;border-radius:0 0 12px 12px;">
          <p style="color:#1a3a2a;font-size:15px;font-weight:bold;">
            ${participant.last_name} ${participant.first_name} 様
          </p>
          ${isCancel ? `
            <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#ef4444;font-weight:bold;margin:0;">キャンセルを受け付けました</p>
              <p style="color:#666;font-size:13px;margin:8px 0 0;">またのご参加をお待ちしております。</p>
            </div>
          ` : isPromote ? `
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#2d7a4a;font-weight:bold;margin:0;">✅ 参加が確定しました！</p>
              <p style="color:#666;font-size:13px;margin:8px 0 0;">キャンセル待ちから参加確定になりました。当日のご参加をお待ちしております！</p>
            </div>
          ` : isWaiting ? `
            <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#d97706;font-weight:bold;margin:0;">⏳ キャンセル待ち ${participant.wait_no}番</p>
              <p style="color:#666;font-size:13px;margin:8px 0 0;">空きが出た場合、申込順に参加確定のご連絡をいたします。</p>
            </div>
          ` : `
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#2d7a4a;font-weight:bold;margin:0;">✅ 参加申込みを受け付けました</p>
            </div>
          `}
          
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px 0;color:#2d7a4a;font-weight:bold;width:120px;">開催日時</td>
              <td style="padding:8px 0;color:#1a2a3a;">2026年5月23日（土）13:00〜16:00</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px 0;color:#2d7a4a;font-weight:bold;">参加者</td>
              <td style="padding:8px 0;color:#1a2a3a;">${participant.last_name} ${participant.first_name}（${participant.last_name_kana} ${participant.first_name_kana}）${totalCount > 1 ? ` ＋ 同伴者${companions.length}名` : ''}</td>
            </tr>
            ${partyCount > 0 ? `
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px 0;color:#2d7a4a;font-weight:bold;">懇親会</td>
              <td style="padding:8px 0;color:#1a2a3a;">🍻 参加（${partyCount}名 × ¥3,000 = 当日払い ¥${partyTotal.toLocaleString()}）</td>
            </tr>
            ` : ''}
          </table>

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:16px;">
            <p style="color:#92400e;font-size:12px;font-weight:bold;margin:0 0 4px;">⚠️ 注意事項</p>
            <ul style="color:#78350f;font-size:12px;margin:0;padding-left:16px;line-height:1.8;">
              <li>現地集合・現地解散です</li>
              <li>駐車場はありません</li>
              <li>動きやすい服装・靴でお越しください</li>
              <li>工場内での写真撮影・SNS投稿はOKです</li>
            </ul>
          </div>
        </div>
      </div>
    `

    // スタッフへの通知メール本文
    const getStaffHtml = () => `
      <div style="font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:${isCancel ? '#ef4444' : isPromote ? '#2d7a4a' : isWaiting ? '#d97706' : '#1a3a2a'};padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;font-size:16px;margin:0;">
            ${isCancel ? '🚫 キャンセル通知' : isPromote ? '✅ 昇格通知' : isWaiting ? '⏳ キャンセル待ち通知' : '📝 新規申込み通知'}
          </h2>
        </div>
        <div style="background:#fff;padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#666;width:120px;">お名前</td><td style="padding:8px 0;font-weight:bold;">${participant.last_name} ${participant.first_name}（${participant.last_name_kana} ${participant.first_name_kana}）</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#666;">メール</td><td style="padding:8px 0;">${participant.email}</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#666;">電話</td><td style="padding:8px 0;">${participant.phone}</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#666;">ステータス</td><td style="padding:8px 0;">${isCancel ? 'キャンセル' : isPromote ? '確定（昇格）' : isWaiting ? `キャンセル待ち ${participant.wait_no}番` : '参加確定'}</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#666;">申込人数</td><td style="padding:8px 0;">${totalCount}名（代表者1名${companions.length > 0 ? ` + 同伴者${companions.length}名` : ''}）</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#666;">懇親会</td><td style="padding:8px 0;">${partyCount > 0 ? `参加 ${partyCount}名（¥${partyTotal.toLocaleString()}）` : '不参加'}</td></tr>
            ${participant.remarks ? `<tr><td style="padding:8px 0;color:#666;">備考</td><td style="padding:8px 0;">${participant.remarks}</td></tr>` : ''}
          </table>
          <div style="margin-top:16px;text-align:center;">
            <a href="https://silica-tour.vercel.app/staff" style="background:#1a3a2a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">管理画面を開く</a>
          </div>
        </div>
      </div>
    `

    // 申込者へメール送信
    if (!isCancel || isPromote) {
      await resend.emails.send({
        from: 'シリカ工場見学会 <onboarding@resend.dev>',
        to: participant.email,
        subject: getSubject(),
        html: getUserHtml(),
      })
    }

    // キャンセルの場合も申込者にメール
    if (isCancel) {
      await resend.emails.send({
        from: 'シリカ工場見学会 <onboarding@resend.dev>',
        to: participant.email,
        subject: getSubject(),
        html: getUserHtml(),
      })
    }

    // スタッフ全員に通知メール
    for (const staffEmail of STAFF_EMAILS) {
      await resend.emails.send({
        from: 'シリカ工場見学会システム <onboarding@resend.dev>',
        to: staffEmail,
        subject: `【管理通知】${getSubject()}`,
        html: getStaffHtml(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}