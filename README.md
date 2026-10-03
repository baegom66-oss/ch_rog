# OC 관찰 일기

자작 캐릭터(OC)를 세계에 풀어 두고, 캐릭터가 스스로 보내는 하루를 타임라인과 SNS로 지켜보는 관찰 시뮬레이터 프로토타입입니다.

## 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)을 열면 됩니다. 데이터는 서버 없이 브라우저 localStorage에만 저장됩니다.

## 주요 기능

- **타임라인**: 캐릭터별 행동 기록 피드. 세계마다 하루 기록 빈도를 정하고, 전체 70개까지 최신순으로 보관합니다(보관함에 넣은 기록은 남지만 그만큼 자리를 차지).
- **SNS**: 캐릭터가 직접 올리는 게시물과 댓글·공유. 댓글과 공유는 관계(친구·연인 등), 친밀도, 사회성에 따라 정해집니다. 캐릭터당 게시물 10개, 즐겨찾기 10개까지.
- **캐릭터**: 성격·MBTI·성향 수치·말투·과거사·취향 등 상세 프로필, 대표 색상, 관계도, 자주 가는 장소, 비밀 일기.
- **이벤트**: 여행·공연 같은 기간 이벤트를 열어 참여 캐릭터의 기록과 게시물을 이벤트 내용으로 채웁니다.
- **세계**: 여러 세계를 만들고 세계관 설명·시설·시간 흐름(배속, 일시정지)을 관리합니다.

## AI 연동 (Gemini)

설정 패널(또는 상단 AI 칩)에 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급한 API 키를 넣으면, 타임라인 기록·SNS 글·댓글을 캐릭터 설정과 세계관에 맞춰 AI가 작성합니다.

- 키는 이 브라우저의 localStorage에만 저장되고, Google API로 직접 요청합니다.
- 키가 없거나 AI를 끄면 템플릿 기반 생성으로 동작합니다.
- 오랜만에 접속해도 캐릭터당 따라잡는 기록 수를 제한해 호출량을 아낍니다.

## 디자인

Playful Digital 테마: 화이트 배경에 Digital Violet(`#8F41E5`), Light Violet(`#DCD0F5`), 소량의 Acid Lime(`#D7F23A`) 포인트. 캐릭터 대표 색상은 타임라인 카드와 캐릭터 프로필에만 쓰이고, 이벤트 관련 카드는 핑크·하늘색 그라데이션 테두리로 구분합니다. 색상 변수는 `src/app/globals.css`에 있습니다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/components` | 화면 컴포넌트 (`SimulatorApp`이 상태와 자동 생성 루프를 관리) |
| `src/lib` | 생성 로직 (AI 호출, 타임라인·SNS 자동 생성, 보관 한도, 저장소) |
| `src/data` | 기본 캐릭터·세계·이벤트 데이터와 옵션 |
| `src/types` | 공용 타입 |

## 기술 스택

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript · lucide-react

```bash
npm run lint   # ESLint
npm run build  # 프로덕션 빌드
```
