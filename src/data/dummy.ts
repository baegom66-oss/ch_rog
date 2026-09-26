import type {
  ActionLog,
  CharacterProfile,
  Facility,
  ScheduleItem,
  SnsPost,
} from "@/types";

export const FAVORITE_SLOT_MAX = 20;

export const initialCharacters: CharacterProfile[] = [
  {
    id: "kazuki",
    name: "카즈키",
    age: 22,
    gender: "남성",
    avatarUrl: "",
    avatarEmoji: "🧵",
    avatarColor: "#3D6B5A",
    personality:
      "자기중심적이고 제멋대로처럼 보이지만, 사실은 챙김이 서툰 츤데레. 감정 표현은 짧고 건조하며, 관심은 행동으로만 드러낸다. 혼자만의 루틴을 깨는 걸 싫어한다.",
    toneQuotes:
      "\"…굳이?\" / \"알 바 아닌데.\" / \"네가 알아서 해.\" / (작게) \"…다 식기 전에 먹어.\" / \"그런 거 물어보지 마.\"",
    mbti: "ISTP",
    alignment: "혼돈 중립",
    backstory:
      "소도시에서 혼자 자취 중. 중학생 때 할머니에게 바느질을 배우며 '손으로 고치면 마음이 가라앉는다'는 걸 알게 됐다. 부모와의 대화는 항상 어긋났고, 그 뒤로 긴 설명보다 침묵을 택한다. 겉으로는 무심하지만, 상대가 진심을 보이면 슬쩍 챙기는 편이다.",
    foodPreference:
      "초딩입맛 쪽. 달달한 디저트·따뜻한 라떼 선호. 매운 음식은 거의 못 먹음. 민트초코는 기피.",
    likesDislikes:
      "좋아함: 비 오는 날 창가, 헌책방, 손바느질, 사람 적은 카페 / 싫어함: 갑작스러운 스몰토크, 소음, 붐비는 피크 타임, 계획 없는 단체 약속",
    pets: "회색 고양이 '연탄' (주말마다 하룻밤 맡김)",
    subHobbies: [
      "손바느질 수선",
      "빈티지 단추 수집",
      "창가 독서",
      "디저트 카페 순례",
      "밤샘 영화 감상",
    ],
    relationships: [
      {
        targetId: "luka",
        tag: "친한 지인",
        affinity: 72,
        impression: "같이 있으면 시끄럽지만 심심하진 않다. 굳이 피하진 않음.",
      },
    ],
    locationPrefs: {
      hangouts: ["달무리 카페", "골목 헌책방", "자취방"],
      interested: ["신규 개장한 미술관", "조용한 북카페(미해금)"],
      mobilityPattern: "집돌이/집순이",
    },
    currentLocation: "달무리 카페",
    currentAction: "창가에서 딸기 타르트를 음미하는 중",
    vitals: { hunger: 35, fatigue: 48, social: 22, stress: 31 },
    secretDiary:
      "오늘은 카페 창가 자리를 또 찜했다. 옆 테이블에서 누군가 크게 웃을 때마다 귀가 간지러웠지만, 딸기 타르트가 달아서 참을 만했다. 루카가 또 SNS에 사진을 올렸더라. 댓글은 안 달았지만… 사진 속 케이크 플레이팅은 괜찮았다. 인정.",
    wish: "집 근처에 조용한 북카페가 생기면 좋겠다. 바느질하다 책 읽다, 아무도 말을 걸지 않는 곳이.",
  },
  {
    id: "luka",
    name: "루카",
    age: 21,
    gender: "남성",
    avatarUrl: "",
    avatarEmoji: "🌶️",
    avatarColor: "#C45C26",
    personality:
      "발랄하고 상냥하며 사람을 끌어모으는 타입. 분위기를 읽는 감각이 좋아 먼저 말을 건넨다. 겉으로는 밝지만, 혼자 있을 때는 깊이 고민하는 면이 있다.",
    toneQuotes:
      "\"야, 여기 진짜 맛있어!\" / \"같이 갈래? 거절해도 괜찮고~\" / \"오늘 해시태그 뭐 하지?\" / \"카즈키도 한입만… 안 되지? ㅎㅎ\" / \"괜찮아요, 천천히 와요.\"",
    mbti: "ENFJ",
    alignment: "질서 선",
    backstory:
      "동네 카페를 돌며 사장님 이름을 외우고, SNS에 추천 코스를 올리는 게 일상. 고등학교 때 '분위기 메이커' 역할에 익숙해졌고, 지금도 웃음을 먼저 보여주는 습관이 있다. 다만 정작 본인의 속마음은 피드에 잘 올리지 않는다.",
    foodPreference:
      "매운 음식 애호가. 떡볶이·마라·신라면 계열 선호. 달달한 것도 먹지만 '맵고 따뜻한 것'이 우선. 싱거운 메뉴만 있는 집은 아쉬워함.",
    likesDislikes:
      "좋아함: 신상 카페, SNS 소통, 번개 약속, 밤 산책 / 싫어함: 무표정한 반응, 너무 조용한 방(오래 있으면 답답), 매운맛 제로 메뉴만 있는 집",
    pets: "없음 (언젠가 골든리트리버를 키우고 싶음)",
    subHobbies: [
      "카페 탐방 루트 짜기",
      "해시태그 작명",
      "매운맛 챌린지",
      "친구 번개 주최",
      "스토리 감성샷",
    ],
    relationships: [
      {
        targetId: "kazuki",
        tag: "친한 지인",
        affinity: 78,
        impression: "말은 짧아도 신경 써주는 타입. 같이 다니면 재미있을 것 같은데 아직 조심스럽다.",
      },
    ],
    locationPrefs: {
      hangouts: ["골목 분식집 '얼큰'", "달무리 카페", "동네 공원"],
      interested: ["신규 개장한 미술관", "루프탑 야시장(미해금)", "구름설탕 베이커리"],
      mobilityPattern: "핫플 추적파",
    },
    currentLocation: "골목 분식집 '얼큰'",
    currentAction: "떡볶이 맵기 단계 도전 중",
    vitals: { hunger: 18, fatigue: 40, social: 78, stress: 25 },
    secretDiary:
      "오늘도 사람 많은 곳에서 웃고 다녔다. 근데 밤이 되면 문득, 나 말고 다른 사람은 지금 뭘 하고 있을까 궁금해진다. 카즈키가 또 조용한 카페에 틀어박혀 있겠지. 언젠가 같이 매운 거 먹자고 하면… 거절하겠지? 그래도 한 번쯤은 물어보고 싶다.",
    wish: "밤에만 여는 루프탑 야시장이 생겼으면. 매운 분식이랑 따뜻한 음료를 같이 팔고, 사람들이 천천히 이야기나눌 수 있는 곳.",
  },
];

export const initialLogs: ActionLog[] = [
  {
    id: "log-k1",
    characterId: "kazuki",
    time: "14:20",
    location: "달무리 카페",
    summary:
      "평소보다 일찍 카페에 도착해 창가 자리를 확보했다. 딸기 타르트와 아이스 라떼를 주문한 뒤, 무릎 위에 펼친 소설을 천천히 넘겼다. 가끔 바느질 키트를 만지작거리며 다음 수선 계획을 떠올렸다.",
    innerThought: "사람이 적을 때가 제일 달다. 타르트도, 이 자리도.",
    detail: `【이동】 단골 카페인 [달무리 카페]로 이동
집돌이 루틴대로 발걸음이 자동으로 향했다. 창가 왕좌를 지키는 날.

【14:18】 달무리 카페 입구
카즈키는 출입문의 풍경종 소리를 듣자마자 살짝 인상을 찌푸렸다. 그래도 창가 좌석이 비어 있는 걸 확인하고는 발걸음을 재촉했다.

【14:20】 주문 카운터
점원: "어서 오세요! 오늘도 창가 자리로 드릴까요?"
카즈키: "…응. 딸기 타르트랑 아이스 라떼."
점원: "타르트 오늘 마지막이에요. 운 좋으시네요!"
카즈키: (작게) "…운이라."

【14:25】 창가 자리
그는 포크로 타르트 끝을 작게 잘라 입에 넣었다. 단맛이 퍼지자 어깨가 조금 풀렸다. 소설책 책갈피를 빼며 중얼거렸다.

카즈키 (속마음): 루카가 또 여기 태그하고 다니면 사람들 몰릴 텐데. 오늘은 그냥 이 자리만 지키자.
카즈키 (속마음): …그래도 이 타르트 플레이팅은 인정해 줘야지. 사진 찍진 않을 거지만.`,
    isFavorite: false,
    placeTags: ["단골", "아지트"],
    contextNote: "단골 카페인 [달무리 카페]로 이동",
  },
  {
    id: "log-k2",
    characterId: "kazuki",
    time: "11:45",
    location: "골목 헌책방",
    summary:
      "점심 전이지만 배가 고프지 않아 헌책방에 들렀다. 바느질 관련 오래된 에세이를 찾아 서가 사이를 천천히 걸었다. 주인장과 짧은 눈인사만 나눈 채 구석 의자에 앉았다.",
    innerThought: "말 안 해도 알아주는 곳이 있어서 다행이다.",
    detail: `【이동】 단골 아지트 [골목 헌책방]으로 이동
사람 적은 골목만 골라 걷는 집돌이 패턴.

【11:40】 헌책방 골목
햇빛이 좁은 골목을 비스듬히 비췄다. 카즈키는 이어폰을 빼고 문을 밀었다.

【11:45】 서가 안쪽
주인장: "오랜만이네."
카즈키: "…책 좀 보러."
주인장: "저번에 찾던 바느질 에세이, 들어온 거 있어. 구석에 뒀어."
카즈키: (살짝 고개만 끄덕이며) "고마워."

【11:58】 구석 의자
낡은 페이지를 넘기며 그는 연필로 귀퉁이에 작은 밑줄을 그었다.

카즈키 (속마음): 손끝으로 고치는 건 사람도 옷도 비슷하다. 다만 사람은… 바늘을 들이밀기가 더 어렵다.`,
    isFavorite: true,
    placeTags: ["단골"],
    contextNote: "단골 아지트 [골목 헌책방]으로 이동",
  },
  {
    id: "log-k3",
    characterId: "kazuki",
    time: "09:10",
    location: "자취방",
    summary:
      "늦은 아침에 일어나 연탄이 남긴 털을 소파에서 털어냈다. 남긴 빵을 토스트로 구워 먹고, 바느질감으로 쓸 낡은 셔츠 단추를 교체했다. 창밖 날씨를 확인한 뒤 외출 준비를 시작했다.",
    innerThought: "단추 하나 달아도 하루가 정리되는 기분.",
    detail: `【09:05】 자취방
알람을 끄고 일어난 카즈키는 바닥에 널린 실뭉치를 주워 바구니에 넣었다.

【09:10】 간이 작업대
그는 낡은 셔츠의 떨어진 단추를 새것으로 바꿨다. 바늘이 천을 통과할 때마다 숨이 고르게 가라앉았다.

카즈키 (속마음): 오늘은 카페 가서 타르트 먹자. 그다음에… 책은 헌책방.
카즈키 (속마음): 루카한테 연락은 안 해도 되겠지. 굳이. (친한 지인이긴 한데… 아침부터는 사양.)`,
    isFavorite: false,
    placeTags: ["아지트", "루틴"],
    contextNote: "집돌이 루틴 · 자취방에서 하루 시작",
  },
  {
    id: "log-k4",
    characterId: "kazuki",
    time: "16:10",
    location: "달무리 카페",
    summary:
      "창가에서 책을 읽던 중 루카가 반대편 자리에 앉은 것을 알아챘다. 말은 걸지 않았지만, 자리를 비우지 않고 타르트를 천천히 마저 먹었다. 루카가 손을 흔들자 아주 짧게 고개만 끄덕였다.",
    innerThought: "시끄러워질 뻔했는데… 오늘은 거리를 지켜 줘서 괜찮다.",
    detail: `【동행 맥락】 루카와 같은 공간에 머무름 (직접 대화는 최소)
관계 태그: 친한 지인 · 친밀도 반영으로 '무시' 대신 '짧은 인정'을 선택.

【16:05】 창가
카즈키는 페이지를 넘기다가 맞은편 웃음소리를 들었다. 루카였다.

【16:10】
루카: (멀리서 손 흔들며) "야— 카즈키!"
카즈키: (고개만 살짝) "…응."
루카: "방해 안 할게! 에이드만 마시고 갈게~"
카즈키 (속마음): 같이 있으면 시끄럽지만… 오늘은 이 정도면 심심하진 않다.`,
    isFavorite: false,
    companionIds: ["luka"],
    companionNames: ["루카"],
    placeTags: ["단골", "동행"],
    contextNote: "루카와 같은 단골 카페에 머무름 (짧은 인사)",
  },
  {
    id: "log-l1",
    characterId: "luka",
    time: "15:05",
    location: "골목 분식집 '얼큰'",
    summary:
      "신메뉴 매운 떡볶이 4단계를 도전했다. 이마에 땀이 맺혔지만 끝까지 비우고 나서 사진을 찍었다. 사장님과 맵기 내기를 하며 크게 웃었다.",
    innerThought: "혀가 얼얼한 게 제일 살아 있는 느낌이야!",
    detail: `【이동】 단골 분식집 [골목 분식집 '얼큰']으로 이동
핫플 추적파답게 신메뉴 소문을 듣고 바로 달려왔다.

【15:00】 분식집 입구
루카는 문을 열자마자 손을 크게 흔들었다.

루카: "사장님! 오늘 4단계 도전합니다!"
사장: "또? 지난번엔 3단계에서 물 세 잔이더니."
루카: "오늘은 물 두 잔으로 버팁니다. 믿어 주세요!"

【15:12】 카운터 앞
떡볶이를 한입 넣고 눈을 질끈 감았다가, 이내 환하게 웃었다.

루카: "으아— 맛있다! 혀가 도망가려고 해요!"
사장: "그래서 질 거야, 이길 거야?"
루카: "이깁니다! …물 조금만요."

【15:20】 인증샷
그는 빈 접시와 함께 셀카를 찍으며 중얼거렸다.

루카 (속마음): 카즈키도 이런 거 한 번만 같이 먹으면 좋을 텐데. 단 것만 먹으면 인생이 밋밋하잖아.
루카 (속마음): …다음에 SNS에 태그해 볼까? 아니지, 귀찮아하겠지.`,
    isFavorite: false,
    placeTags: ["단골", "핫플"],
    contextNote: "단골 분식집 [골목 분식집 '얼큰']으로 이동",
  },
  {
    id: "log-l2",
    characterId: "luka",
    time: "12:30",
    location: "달무리 카페",
    summary:
      "점심 후 달무리 카페에 들러 신메뉴 라벤더 에이드를 시켰다. 창가에 앉은 카즈키를 발견하고 멀리서 손을 흔들었지만, 책에서 눈을 떼지 않는 모습을 보고 일부러 다른 자리에 앉았다.",
    innerThought: "방해하긴 싫지. 그래도 있는 건 알아서 좋다.",
    detail: `【관계】 카즈키와 같은 공간을 공유함 (친한 지인 · 거리 존중)
루카는 동행을 강요하지 않고, '같은 카페에 있다'는 사실만으로 만족했다.

【12:28】 카페 문 앞
루카는 풍경종 소리와 함께 들어서며 스마트폰을 꺼내 스토리용 사진을 찍었다.

【12:30】 홀
점원: "루카 씨! 오늘은 뭐로 할까요?"
루카: "라벤더 에이드요! 그리고… 창가 쪽은 이미 손님 있죠?"
점원: "네, 단골 분이요."
루카: (웃으며) "그럼 저는 반대편으로~"

【12:40】 반대편 자리
그는 빨대를 만지작거리며 창가 쪽을 슬쩍 바라봤다.

루카 (속마음): 저 표정이면 집중 모드네. 말 걸면 도망갈 거야.
루카 (속마음): 나중에 SNS에 카페 분위기만 올려야지. 사람 얼굴은 빼고요.`,
    isFavorite: true,
    companionIds: ["kazuki"],
    companionNames: ["카즈키"],
    placeTags: ["단골", "동행"],
    contextNote: "카즈키와 함께(같은 카페) 방문함 · 거리 두고 머무름",
  },
  {
    id: "log-l3",
    characterId: "luka",
    time: "10:00",
    location: "동네 공원",
    summary:
      "아침 러닝 대신 공원 벤치에서 팔로워 DM에 답장을 달았다. 지나가는 강아지에게 손을 흔들고, 오늘의 카페 루트를 메모 앱에 정리했다. 하늘이 맑아서 기분이 좋았다.",
    innerThought: "오늘 루트, 완전 예쁨. 공유각이다.",
    detail: `【이동】 단골 루트 [동네 공원] 경유
관심 장소 메모: 신규 개장한 미술관, 루프탑 야시장(아직 미개척).

【09:55】 공원 산책로
루카는 이어폰으로 신나는 플레이리스트를 틀고 벤치에 앉았다.

【10:00】 벤치
팔로워 DM에 "거기 라떼 진짜 고소해요!"라고 빠르게 답한 뒤, 메모 앱을 열었다.

루카 (혼잣말): "오전 카페 → 점심 분식 → 저녁은… 루프탑? 없나. 아쉽다."

【10:15】
강아지를 산책시키는 이웃과 눈을 마주치자 환하게 손을 흔들었다.

루카 (속마음): 저런 강아지 키우면 매일 산책 핑계로 사람 더 만나겠지. 언젠가.`,
    isFavorite: false,
    placeTags: ["단골", "루트 계획"],
    contextNote: "단골 루트 [동네 공원] 경유 · 관심 장소 루트 짜기",
  },
];

export const initialSchedules: ScheduleItem[] = [
  {
    id: "sch-k1",
    characterId: "kazuki",
    time: "17:00",
    title: "바느질 재료 사기",
    location: "수공예 가게 '실과바늘'",
  },
  {
    id: "sch-k2",
    characterId: "kazuki",
    time: "19:30",
    title: "집에서 독서 & 간단한 저녁",
    location: "자취방",
  },
  {
    id: "sch-k3",
    characterId: "kazuki",
    time: "22:00",
    title: "연탄 영상통화 (집사 모드)",
    location: "자취방",
  },
  {
    id: "sch-l1",
    characterId: "luka",
    time: "16:40",
    title: "신상 디저트 카페 방문",
    location: "구름설탕 베이커리",
  },
  {
    id: "sch-l2",
    characterId: "luka",
    time: "18:30",
    title: "친구들과 번개 저녁",
    location: "시장 골목 포차",
  },
  {
    id: "sch-l3",
    characterId: "luka",
    time: "21:00",
    title: "오늘 피드 정리 & 해시태그 작성",
    location: "자취방",
  },
];

export const initialSnsPosts: SnsPost[] = [
  {
    id: "sns-1",
    characterId: "luka",
    authorName: "루카",
    authorColor: "#C45C26",
    content:
      "오늘 달무리 카페 라벤더 에이드 미쳤다… 향이 부드러운데 끝맛이 상큼해. 창가쪽은 이미 단골 왕좌가 점령 중이었지만 나도 행복했다 ㅎㅎ",
    hashtags: ["#달무리카페", "#라벤더에이드", "#카페탐방", "#오늘의미소"],
    imageUrl: "",
    likes: 42,
    reactions: ["✨", "🍹"],
    comments: [
      {
        id: "c2",
        characterId: "kazuki",
        authorName: "카즈키",
        authorColor: "#3D6B5A",
        content: "…창가 자리는 양보 안 함.",
        time: "13:02",
      },
      {
        id: "c3",
        characterId: "luka",
        authorName: "루카",
        authorColor: "#C45C26",
        content: "알아요 알아요~ 왕좌는 지켜드리죠.",
        time: "13:05",
      },
    ],
    time: "12:41",
  },
  {
    id: "sns-2",
    characterId: "luka",
    authorName: "루카",
    authorColor: "#C45C26",
    content:
      "떡볶이 4단계 클리어!!! 혀는 아직 안 돌아왔지만 영혼은 불타오르는 중. 맵찔이 소환해도 나 혼자 먹을게… 카즈키는 단 것만 먹겠지.",
    hashtags: ["#얼큰분식", "#맵기챌린지", "#4단계"],
    imageUrl: "",
    likes: 67,
    reactions: ["🔥", "👏"],
    comments: [
      {
        id: "c4",
        characterId: "kazuki",
        authorName: "카즈키",
        authorColor: "#3D6B5A",
        content: "부르지 마. 매운 거 안 먹음.",
        time: "15:18",
      },
      {
        id: "c5",
        characterId: "luka",
        authorName: "루카",
        authorColor: "#C45C26",
        content: "알아~ 그래도 한 번은 같이 가고 싶다구.",
        time: "15:22",
      },
    ],
    time: "15:12",
  },
  {
    id: "sns-3",
    characterId: "kazuki",
    authorName: "카즈키",
    authorColor: "#3D6B5A",
    content:
      "타르트 달았음. 사람 많을 땐 오지 마세요.",
    hashtags: ["#달무리카페", "#디저트", "#창가"],
    imageUrl: "",
    likes: 19,
    reactions: ["🍰"],
    comments: [
      {
        id: "c6",
        characterId: "luka",
        authorName: "루카",
        authorColor: "#C45C26",
        content: "오? 카즈키가 글을 올렸다… 역사적인 날인데요?",
        time: "14:35",
      },
      {
        id: "c7",
        characterId: "kazuki",
        authorName: "카즈키",
        authorColor: "#3D6B5A",
        content: "글만. 더 안 씀.",
        time: "14:40",
      },
      {
        id: "c8",
        characterId: "luka",
        authorName: "루카",
        authorColor: "#C45C26",
        content: "짧아서 더 귀여움 인정.",
        time: "14:41",
      },
    ],
    time: "14:28",
  },
  {
    id: "sns-4",
    characterId: "kazuki",
    authorName: "카즈키",
    authorColor: "#3D6B5A",
    content:
      "헌책방 구석이 제일 편하다. 사진 따위 필요 없음. 말 안 거는 사람만 오면 됨.",
    hashtags: ["#헌책방", "#독서"],
    likes: 11,
    reactions: ["📚"],
    comments: [
      {
        id: "c9",
        characterId: "luka",
        authorName: "루카",
        authorColor: "#C45C26",
        content: "사진 없는 글… 카즈키답다. 그래도 좋아요 누름.",
        time: "12:01",
      },
    ],
    time: "11:50",
  },
];

export const initialFacilities: Facility[] = [
  {
    id: "fac-1",
    name: "달무리 카페",
    type: "건물",
    description:
      "골목 안쪽의 작은 카페. 창가 자리가 인기이며, 딸기 타르트와 시즌 음료가 유명하다. 카즈키의 아지트.",
    unlocked: true,
  },
  {
    id: "fac-2",
    name: "골목 분식집 '얼큰'",
    type: "건물",
    description:
      "맵기 단계가 네 단계까지 있는 동네 분식집. 사장님이 단골 이름을 외운다. 루카의 단골 챌린지 장소.",
    unlocked: true,
  },
  {
    id: "fac-3",
    name: "골목 헌책방",
    type: "건물",
    description:
      "좁은 서가와 구석 의자가 매력인 헌책방. 말수가 적어도 편히 머무를 수 있다.",
    unlocked: true,
  },
  {
    id: "fac-4",
    name: "수공예 가게 '실과바늘'",
    type: "건물",
    description:
      "원단, 단추, 자수실을 파는 작은 가게. 카즈키가 재료를 사러 들른다.",
    unlocked: true,
  },
  {
    id: "fac-5",
    name: "해안 산책 도시 '물결시'",
    type: "도시",
    description:
      "기차로 한 시간 거리의 해안 도시. 바람 부는 산책로와 해산물 포차 거리가 있다.",
    unlocked: true,
  },
  {
    id: "fac-6",
    name: "제주 조용한 북카페 거리",
    type: "해외",
    description:
      "아직 해금되지 않은 휴양 코스. 바다가 보이는 독서 공간과 손바느질 워크숍이 있다고 소문만 무성하다.",
    unlocked: false,
  },
];
