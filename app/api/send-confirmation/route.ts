import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, lastName, firstName, eventTitle, eventDate, eventTime, shopName, party, participantId, isPromotion, shopEmail } = body

    if (!to || !lastName || !firstName || !eventTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const partyText = party ? '\n🍺 懇親会：参加' : ''

    // 昇格の場合は冒頭に特別メッセージを挿入
    const promotionHeader = isPromotion
      ? 'キャンセルが発生したため、キャンセル待ちから参加確定となりました！\nぜひご参加ください。\n\n'
      : ''

    const emailBody = lastName + ' ' + firstName + ' 様\n\n'
      + promotionHeader
      + '工場見学へのお申込みありがとうございました。\n\n'
      + '工場見学会を主宰しております牛王田（うしおだ）です。\n\n'
      + '工場見学会当日には前で、ご挨拶させて頂きますのでよろしくお願いします。\n\n'
      + '工場見学はオープニングの演奏からはじまり、工場内の各セクションの見学、メーカーのスタッフ、社長からのミニセミナー、プレゼント企画など、楽しい内容がたくさんありアッというまの3時間になると思います。\n\n'
      + 'また何かの場合のキャンセルは、担当販売者にお申し頂ければ受付致します。\n\n'
      + 'このイベントは大変人気のイベントの為、出来るだけ直近のキャンセルはお控え下さい。\n\n'
      + 'なお、何かご質問がある場合は私に直接ご連絡下さい。\n\n'
      + '私へのご連絡は以下のどんな方法でもOKです。\n\n'
      + 'では、よろしくお願いします。\n\n'
      + 'シリカの工場でお会いしましょう！\n\n'
      + '牛王田雅章\n'
      + 'mail@you-planning.org\n\n'
      + '⚠️ 注意事項\n'
      + ' * 現地集合・現地解散です\n'
      + ' * 駐車場はありません\n'
      + ' * 動きやすい服装・靴でお越しください\n'
      + ' * 工場内での写真撮影・SNS投稿はOKです'

    // 申込者へメール送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'シリカ見学会 <noreply@you-planning.org>',
        to: [to],
        subject: isPromotion
          ? '【参加確定】工場見学のキャンセル待ちから参加確定になりました'
          : '工場見学のお申込みを受け付けました',
        text: emailBody,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Mail send failed', detail: err }, { status: 500 })
    }

    // 昇格の場合は担当販売店にも通知
    if (isPromotion && shopEmail) {
      const shopBody = '担当のお客様がキャンセル待ちから参加確定になりました。\n\n'
        + '【お客様名】\n'
        + lastName + ' ' + firstName + ' 様\n\n'
        + '【販売店】\n'
        + (shopName || '') + '\n\n'
        + 'キャンセルが発生したため、自動的に参加確定へ昇格しました。\n'
        + '詳細は管理画面よりご確認ください。'

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'シリカ工場見学会システム <noreply@you-planning.org>',
          to: [shopEmail],
          subject: '【昇格通知】担当のお客様が参加確定になりました',
          text: shopBody,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('send-confirmation error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
