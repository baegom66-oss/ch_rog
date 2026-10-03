import type { Metadata } from "next";
import { Black_Han_Sans, Gowun_Dodum, Jua, Nunito } from "next/font/google";
import "./globals.css";

/** 영문·숫자용 둥근 글꼴. 한글 글리프가 없어 한글은 다음 글꼴로 넘어간다 */
const latin = Nunito({
  variable: "--font-latin",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

/** 한글 본문용 둥근 글꼴 */
const round = Gowun_Dodum({
  variable: "--font-round",
  weight: "400",
  subsets: ["latin"],
});

/** 제목·중요한 글자용 두꺼운 둥근 글꼴 (한 가지 굵기뿐이라 굵게 합성하지 않는다) */
const display = Jua({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

/** 앱 제목 전용 각진 글꼴 */
const title = Black_Han_Sans({
  variable: "--font-title",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OC 관찰 일기",
  description: "자작 캐릭터 자율 일상 관찰 시뮬레이터 프로토타입",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${latin.variable} ${round.variable} ${display.variable} ${title.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
