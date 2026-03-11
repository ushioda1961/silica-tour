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

                                このたびはシリカ製造工場 無料見学会にお申込いただき、ありがとうございます。
                                以下の内容で参加申込を受け付けました。

                                ━━━━━━━━━━━━━━━━━━━━━━
                                📅 開催日時：${eventDate}　${eventTime}
                                🏭 会　　場：愛知県一宮市内（詳細は担当販売者にお問い合わせください）
                                👤 お　名　前：${lastName} ${firstName} 様
                                🏪 担当販売者：${shopName || '直接申込'}${partyText}
                                ━━━━━━━━━━━━━━━━━━━━━━

                                当日のご来場をスタッフ一同、心よりお待ちしております。

                                ※ キャンセルの場合は下記URLよりお手続きください。
                                https://silica-tour.vercel.app/cancel

                                ────────────────────
                                シリカ製造工場 見学会 運営事務局
                                （担当販売者経由でのお申込の場合は、担当者にお問い合わせください）
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

                                                                                                                                                                
