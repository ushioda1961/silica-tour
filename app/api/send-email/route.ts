import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// スタッフ通知先メールアドレス（ここに追加してください）
const STAFF_EMAILS = [
  'u-mail@ushioda-masaaki.com',
  'lotuseveil@gmail.com',
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

    // 担当販売者のメールアドレスをSupabaseから取得
    let shopEmail: string | null = null
    let shopName: string | null = null
    if (participant.shop_id) {
      const { data: shopData } = await supabase
        .from('shops')
        .select('name, email')
        .eq('id', participant.shop_id)
        .single()
      if (shopData?.email) {
        shopEmail = shopData.email
        shopName = shopData.name
      }
    }

    // 件名
    const getSubject = () => {
      if (isCancel) return `【シリカ工場見学】キャンセルです`
      if (isPromote) return `【シリカ工場見学】参加確定です`
      if (isWaiting) return `【シリカ工場見学】キャンセル待ち申込です`
      return `【シリカ工場見学】申込です`
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
            ${isCancel ? '🚫 キャンセル' : isPromote ? '✅ 参加確定（昇格）' : isWaiting ? '⏳ キャンセル待ち申込' : '📝 新規申込み'}
          </h2>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;font-size:15px;line-height:1.6;">

          <p style="margin:0 0 20px;">
            <strong>【新規申込者お名前】</strong><br>
            ${participant.last_name} ${participant.first_name}（${participant.last_name_kana} ${participant.first_name_kana}）
          </p>

          <p style="margin:0 0 20px;">
            <strong>【担当販売者】</strong><br>
            ${shopName ? shopName : '（なし・直接参加）'}
          </p>

          <p style="margin:0 0 20px;">
            <strong>【メールアドレス】</strong><br>
            ${participant.email}
          </p>

          <p style="margin:0 0 20px;">
            <strong>【電話】</strong><br>
            ${participant.phone}
          </p>

          <p style="margin:0 0 20px;">
            <strong>【ステータス】</strong><br>
            ${isCancel ? 'キャンセル' : isPromote ? '確定（昇格）' : isWaiting ? `キャンセル待ち ${participant.wait_no}番` : '参加確定'}　申込人数 ${totalCount}名（代表者1名${companions.length > 0 ? ` ＋ 同伴者${companions.length}名` : ''}）
          </p>

          <p style="margin:0 0 20px;">
            <strong>【懇親会】</strong><br>
            ${partyCount > 0 ? `参加 ${partyCount}名（¥${partyTotal.toLocaleString()}）` : '不参加'}
          </p>

          ${participant.remarks ? `
          <p style="margin:0 0 20px;">
            <strong>【備考】</strong><br>
            ${participant.remarks}
          </p>
          ` : ''}

          <div style="margin-top:24px;text-align:center;">
            <a href="https://silica-tour.vercel.app/staff" style="background:#1a3a2a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">管理画面を開く</a>
          </div>
        </div>
      </div>
    `

    // 販売者への通知メール本文
    const getShopHtml = () => `
      <div style="font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:${isCancel ? '#ef4444' : '#1a3a2a'};padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;font-size:16px;margin:0;">
            ${isCancel ? '🚫 キャンセル通知' : '📝 担当のお客様からの申込みです'}
          </h2>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;font-size:15px;line-height:1.6;">

          <p style="margin:0 0 20px;color:#333;">
            ${shopName} 様<br>
            担当のお客様から${isCancel ? 'キャンセルの連絡' : '見学会のお申込み'}がありました。
          </p>

          <p style="margin:0 0 20px;">
            <strong>【お客様お名前】</strong><br>
            ${participant.last_name} ${participant.first_name}（${participant.last_name_kana} ${participant.first_name_kana}）
          </p>

          <p style="margin:0 0 20px;">
            <strong>【メールアドレス】</strong><br>
            ${participant.email}
          </p>

          <p style="margin:0 0 20px;">
            <strong>【電話】</strong><br>
            ${participant.phone}
          </p>

          <p style="margin:0 0 20px;">
            <strong>【ステータス】</strong><br>
            ${isCancel ? 'キャンセル' : isWaiting ? `キャンセル待ち ${participant.wait_no}番` : '参加確定'}　申込人数 ${totalCount}名
          </p>

          ${partyCount > 0 ? `
          <p style="margin:0 0 20px;">
            <strong>【懇親会】</strong><br>
            参加 ${partyCount}名（¥${partyTotal.toLocaleString()}）
          </p>
          ` : ''}

          ${participant.remarks ? `
          <p style="margin:0 0 20px;">
            <strong>【備考】</strong><br>
            ${participant.remarks}
          </p>
          ` : ''}

        </div>
      </div>
    `

    // 申込者へメール送信
    if (!isCancel || isPromote) {
      await resend.emails.send({
        from: 'シリカ工場見学会 <noreply@you-planning.org>',
        to: participant.email,
        subject: getSubject(),
        html: getUserHtml(),
      })
    }

    // キャンセルの場合も申込者にメール
    if (isCancel) {
      await resend.emails.send({
        from: 'シリカ工場見学会 <noreply@you-planning.org>',
        to: participant.email,
        subject: getSubject(),
        html: getUserHtml(),
      })
    }

    // スタッフ全員に通知メール
    for (const staffEmail of STAFF_EMAILS) {
      await resend.emails.send({
        from: 'シリカ工場見学会システム <noreply@you-planning.org>',
        to: staffEmail,
        subject: getSubject(),
        html: getStaffHtml(),
      })
    }

    // 担当販売者に通知メール（メールアドレスがある場合のみ）
    if (shopEmail) {
      await resend.emails.send({
        from: 'シリカ工場見学会システム <noreply@you-planning.org>',
        to: shopEmail,
        subject: getSubject(),
        html: getShopHtml(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
