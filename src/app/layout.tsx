import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Song_Myung } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans_KR({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const display = Song_Myung({
  variable: "--font-display",
  weight: "400",
});

export const metadata: Metadata = {
  title: "OC 관찰 일기",
  description: "자작 캐릭터 자율 일상 관찰 시뮬레이터 프로토타입",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
