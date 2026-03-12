import { NextRequest, NextResponse } from 'next/server'



export async function POST(req: NextRequest) {

  try {

      const body = await req.json()

          const { to, lastName, firstName, eventTitle, eventDate, eventTime, shopName, party, participantId } = body

                            const cancelUrl = participantId
                              ? `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?id=${participantId}`
                              : ''



              if (!to || !lastName || !firstName || !eventTitle) {

                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

                        }



                            const partyText = party ? `\n🍺 懇親会：参加` : ''



                                const emailBody = `${lastName} ${firstName} 様



工場見学へのお申込みありがとうございました。



工場見学会を主宰しております牛王田（うしおだ）です。



工場見学会当日には前で、ご挨拶させて頂きますのでよろしくお願いします。



工場見学はオープニングの演奏からはじまり、工場内の各セクションの見学、メーカーのスタッフ、社長からのミニセミナー、プレゼント企画など、楽しい内容がたくさんありアッというまの3時間になると思います。



また何かの場合のキャンセルは下記リンクをクリックして、開いたページでキャンセルボタンを押して貰えれば結構です。



▼キャンセルはこちら▼

${cancelUrl}



なお、何かご質問がある場合は私に直接ご連絡下さい。



私へのご連絡は以下のどんな方法でもOKです。



では、よろしくお願いします。



シリカの工場でお会いしましょう！



▼牛連絡先・情報一覧▼

https://share-me.design/ushiodamasaaki

`

                                    const res = await fetch('https://api.resend.com/emails', {

                                          method: 'POST',

                                                headers: {

                                                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,

                                                                'Content-Type': 'application/json',

                                                                      },

                                                                            body: JSON.stringify({

                                                                                                                from: 'シリカ見学会 <noreply@you-planning.org>',

                                                                                            to: [to],

                                                                                                    subject: `【申込完了】シリカ製造工場 無料見学会 ${eventDate}`,

                                                                                                            text: emailBody,

                                                                                                                  }),

                                                                                                                      })



                                                                                                                          if (!res.ok) {

                                                                                                                                const err = await res.text()

                                                                                                                                      console.error('Resend error:', err)

                                                                                                                                            return NextResponse.json({ error: 'Mail send failed', detail: err }, { status: 500 })

                                                                                                                                                }



                                                                                                                                                    return NextResponse.json({ success: true })

                                                                                                                                                      } catch (e) {

                                                                                                                                                          console.error('send-confirmation error:', e)

                                                                                                                                                              return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

                                                                                                                                                                }

                                                                                                                                                                }



                                                                                                                                                                



import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
      const body = await req.json()
          const { to, lastName, firstName, eventTitle, eventDate, eventTime, shopName, party } = body

              if (!to || !lastName || !firstName || !eventTitle) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
                        }

                            const partyText = party ? `\n🍺 懇親会：参加` : ''

                                const emailBody = `${lastName} ${firstName} 様

工場見学へのお申込みありがとうございました。

工場見学会を主宰しております牛王田（うしおだ）です。

工場見学会当日には前で、ご挨拶させて頂きますのでよろしくお願いします。

工場見学はオープニングの演奏からはじまり、工場内の各セクションの見学、メーカーのスタッフ、社長からのミニセミナー、プレゼント企画など、楽しい内容がたくさんありアッというまの3時間になると思います。

また何かの場合のキャンセルは下記リンクをクリックして、開いたページでキャンセルボタンを押して貰えれば結構です。

▼キャンセルはこちら▼
${cancelUrl}

なお、何かご質問がある場合は私に直接ご連絡下さい。

私へのご連絡は以下のどんな方法でもOKです。

では、よろしくお願いします。

シリカの工場でお会いしましょう！

▼牛連絡先・情報一覧▼
https://share-me.design/ushiodamasaaki
`
                                    const res = await fetch('https://api.resend.com/emails', {
                                          method: 'POST',
                                                headers: {
                                                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                                                                'Content-Type': 'application/json',
                                                                      },
                                                                            body: JSON.stringify({
                                                                                                                from: 'シリカ見学会 <noreply@you-planning.org>',
                                                                                            to: [to],
                                                                                                    subject: `【申込完了】シリカ製造工場 無料見学会 ${eventDate}`,
                                                                                                            text: emailBody,
                                                                                                                  }),
                                                                                                                      })

                                                                                                                          if (!res.ok) {
                                                                                                                                const err = await res.text()
                                                                                                                                      console.error('Resend error:', err)
                                                                                                                                            return NextResponse.json({ error: 'Mail send failed', detail: err }, { status: 500 })
                                                                                                                                                }

                                                                                                                                                    return NextResponse.json({ success: true })
                                                                                                                                                      } catch (e) {
                                                                                                                                                          console.error('send-confirmation error:', e)
                                                                                                                                                              return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
                                                                                                                                                                }
                                                                                                                                                                }

                                                                                                                                                                


