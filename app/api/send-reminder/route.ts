import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { supabase } = require('../../../lib/supabase')

// Vercel Cron Job: 毎朝9時(JST)に実行
// vercel.jsonで "0 0 * * *" (UTC 0時 = JST 9時) に設定
export async function GET(req: NextRequest) {
  // cronジョブからのリクエストか確認
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    

    // 7日後の日付を計算
    const today = new Date()
    const target = new Date(today)
    target.setDate(today.getDate() + 7)
    const targetDate = target.toISOString().split('T')[0] // YYYY-MM-DD形式

    // 7日後にイベントがある参加確定の参加者を取得
    const { data: participants, error } = await supabase
      .from('participants')
      .select(`
        id, last_name, first_name, email,
        events!inner(title, date, time_start)
      `)
      .eq('status', 'confirmed')
      .eq('events.date', targetDate)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ message: '7日後のイベント参加者なし', date: targetDate })
    }

    // 各参加者にリマインドメールを送信
    let sentCount = 0
    const errors: string[] = []

    for (const participant of participants) {
      if (!participant.email) continue

      const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?id=${participant.id}`

      const emailBody = `${participant.last_name} ${participant.first_name} 様

シリカ工場見学が7日後に迫ってきました。

工場見学会を主宰しております牛王田です。

みなさんお元気でしょうか？

工場見学会の予定、お変わりありませんか？

万一急遽のご用が出来た場合には、下記のページよりキャンセルボタンでキャンセル処理をしてください。

もしくは担当して貰っております販売店の方へご連絡下さい。

キャンセル待ちの方がおりますので、ご予定の変更は出来るだけ早めにお願い致します。

では、当日よろしくお願いします。

▼キャンセルはこちら▼
${cancelUrl}

▼牛王田までのご連絡は以下まで▼
https://share-me.design/ushiodamasaaki`

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'シリカ見学会 <noreply@you-planning.org>',
            to: [participant.email],
            subject: 'シリカ工場見学１週間前です',
            text: emailBody,
          })
        })

        if (res.ok) {
          sentCount++
        } else {
          const err = await res.text()
          errors.push(`${participant.email}: ${err}`)
        }
      } catch (e) {
        errors.push(`${participant.email}: ${String(e)}`)
      }
    }

    return NextResponse.json({
      message: `リマインドメール送信完了`,
      targetDate,
      totalParticipants: participants.length,
      sentCount,
      errors
    })

  } catch (e) {
    console.error('Reminder error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
