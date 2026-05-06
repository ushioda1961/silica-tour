import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const KANJI_EMAIL = 'lotuseveil@gmail.com'
const KANJI_NAME = '池尾里絵'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = days[d.getDay()]
  return y + '年' + m + '月' + day + '日（' + dow + '）'
}

const formatTime = (t: string) => t?.slice(0, 5) || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participantId, newParty, changedBy } = body

    if (typeof participantId !== 'string' || typeof newParty !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 参加者情報を取得
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('*, companions(*)')
      .eq('id', participantId)
      .single()

    if (fetchError || !participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // 懇親会フラグを更新
    const { error: updateError } = await supabase
      .from('participants')
      .update({ party: newParty })
      .eq('id', participantId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // イベント情報を取得
    let eventDateStr = ''
    if (participant.event_id) {
      const { data: eventData } = await supabase
        .from('events')
        .select('date, time_start, time_end')
        .eq('id', participant.event_id)
        .single()
      if (eventData) {
        eventDateStr = formatDate(eventData.date) + ' ' + formatTime(eventData.time_start) + '～' + formatTime(eventData.time_end)
      }
    }

    // 同イベントの懇親会総人数を集計（更新後の値で計算）
    const { data: allParticipants } = await supabase
      .from('participants')
      .select('id, party, companions(*)')
      .eq('event_id', participant.event_id)
      .eq('status', 'confirmed')

    let totalPartyCount = 0
    if (allParticipants) {
      for (const p of allParticipants) {
        const partyVal = p.id === participantId ? newParty : p.party
        if (partyVal) totalPartyCount++
        const comps = (p.companions || []) as any[]
        totalPartyCount += comps.filter((c: any) => c.party).length
      }
    }

    // 販売店名を取得
    let shopName = ''
    if (participant.shop_id) {
      const { data: shopData } = await supabase
        .from('shops')
        .select('name')
        .eq('id', participant.shop_id)
        .single()
      if (shopData) shopName = shopData.name
    }

    const changeLabel = newParty ? '不参加 → 参加' : '参加 → 不参加'
    const participantName = participant.last_name + ' ' + participant.first_name
    const bgColor = newParty ? '#7c3aed' : '#6b7280'
    const lightColor = newParty ? '#f5f3ff' : '#f9fafb'
    const numColor = newParty ? '#7c3aed' : '#374151'

    const kanjiHtml = '<div style="font-family:Hiragino Kaku Gothic ProN,Meiryo,sans-serif;max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="background:' + bgColor + ';padding:16px 20px;border-radius:8px 8px 0 0;">'
      + '<h2 style="color:#fff;font-size:16px;margin:0;">🍻 懇親会 参加変更のお知らせ</h2>'
      + '</div>'
      + '<div style="background:#fff;padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;font-size:15px;line-height:1.8;">'
      + '<p style="margin:0 0 16px;">' + KANJI_NAME + ' 様<br>懇親会の参加状況が変更されましたのでお知らせします。</p>'
      + '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">'
      + '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px 8px;color:#7c3aed;font-weight:bold;width:140px;">変更内容</td><td style="padding:10px 8px;font-weight:bold;color:' + bgColor + ';">' + changeLabel + '</td></tr>'
      + '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px 8px;color:#7c3aed;font-weight:bold;">お客様氏名</td><td style="padding:10px 8px;">' + participantName + '（' + participant.last_name_kana + ' ' + participant.first_name_kana + '）</td></tr>'
      + '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px 8px;color:#7c3aed;font-weight:bold;">担当販売者</td><td style="padding:10px 8px;">' + (shopName || changedBy || '不明') + '</td></tr>'
      + '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px 8px;color:#7c3aed;font-weight:bold;">開催日時</td><td style="padding:10px 8px;">' + (eventDateStr || '日程未定') + '</td></tr>'
      + '</table>'
      + '<div style="background:' + lightColor + ';border:2px solid ' + bgColor + ';border-radius:12px;padding:20px;margin:20px 0;text-align:center;">'
      + '<div style="font-size:13px;color:#555;margin-bottom:6px;">現在の懇親会 参加総人数</div>'
      + '<div style="font-size:42px;font-weight:900;color:' + numColor + ';">' + totalPartyCount + '<span style="font-size:18px;font-weight:600;">名</span></div>'
      + '<div style="font-size:12px;color:#888;margin-top:4px;">（確定参加者のうち懇親会に参加する方の合計）</div>'
      + '</div>'
      + '<div style="margin-top:20px;text-align:center;"><a href="https://silica-tour.vercel.app/staff" style="background:#1a3a2a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">管理画面を開く</a></div>'
      + '</div></div>'

    await resend.emails.send({
      from: 'シリカ工場見学会システム <noreply@you-planning.org>',
      to: KANJI_EMAIL,
      subject: '【懇親会変更】' + participantName + 'さん ' + changeLabel + '（合計' + totalPartyCount + '名）',
      html: kanjiHtml
    })

    return NextResponse.json({ success: true, newParty, totalPartyCount })

  } catch (error) {
    console.error('toggle-party error:', error)
    return NextResponse.json({ error: 'Failed to update party' }, { status: 500 })
  }
}
