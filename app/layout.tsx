import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
    subsets: ["latin", "japanese"],
      weight: ["400", "700"],
      });

      export const metadata: Metadata = {
        title: "シリカGO",
          description: "シリカGO - 工場見学予約サービス",
          };

          export default function RootLayout({
            children,
            }: Readonly<{
              children: React.ReactNode;
              }>) {
                return (
                    <html lang="ja">
                          <body
                                  className={`${notoSansJP.variable} antialiased`}
                                        >
                                                {children}
                                                      </body>
                                                          </html>
                                                            );
                                                            }