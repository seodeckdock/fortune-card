"use client";

import { useState } from "react";

const FORTUNE_MESSAGES = [
  "오늘은 뜻밖의 좋은 소식이 들려올 거예요.",
  "작은 용기가 큰 변화를 만드는 하루입니다.",
  "주변 사람에게 먼저 인사를 건네보세요. 좋은 인연이 시작됩니다.",
  "미뤄왔던 일을 시작하기에 완벽한 타이밍이에요.",
  "생각보다 일이 술술 풀리는 하루가 될 거예요.",
  "오늘 만나는 사람과의 대화 속에 힌트가 있어요.",
  "작은 실수에 너무 연연하지 마세요. 곧 만회할 기회가 옵니다.",
  "평소보다 직감이 예리해지는 날이에요. 믿고 따라가 보세요.",
  "지출보다는 저축에 신경 쓰면 좋은 하루입니다.",
  "가까운 사람과의 오해가 자연스럽게 풀립니다.",
  "새로운 도전을 하기에 아주 좋은 기운이 감돕니다.",
  "쉬어가는 여유가 필요한 하루예요. 잠시 멈춰도 괜찮아요.",
  "칭찬 한마디가 하루를 특별하게 만들어 줄 거예요.",
  "오늘 내린 결정이 훗날 좋은 결과로 돌아옵니다.",
  "예상치 못한 곳에서 도움의 손길을 받게 됩니다.",
  "꾸준함이 빛을 발하는 순간이 다가오고 있어요.",
  "감정 표현에 솔직해지면 관계가 더 깊어집니다.",
  "작은 행운이 연이어 찾아오는 하루가 될 거예요.",
  "계획했던 일이 순조롭게 마무리됩니다.",
  "오늘의 당신은 그 자체로 빛나고 있어요.",
];

const LUCKY_ITEMS = [
  "우산",
  "손거울",
  "초콜릿",
  "만년필",
  "향초",
  "텀블러",
  "손편지",
  "반지",
  "이어폰",
  "다이어리",
  "스카프",
  "동전지갑",
  "책",
  "캔들",
  "머그컵",
  "열쇠고리",
  "화분",
  "향수",
];

const LUCKY_COLORS = [
  "빨간색",
  "주황색",
  "노란색",
  "초록색",
  "하늘색",
  "파란색",
  "보라색",
  "분홍색",
  "하얀색",
  "검정색",
  "금색",
  "은색",
];

const STARS = Array.from({ length: 28 }, (_, i) => ({
  top: `${(i * 37) % 100}%`,
  left: `${(i * 53) % 100}%`,
  size: `${1 + (i % 3)}px`,
  delay: `${(i % 5) * 0.6}s`,
}));

type FortuneResult = {
  message: string;
  item: string;
  color: string;
  number: number;
};

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function drawFortune(): FortuneResult {
  return {
    message: pickRandom(FORTUNE_MESSAGES),
    item: pickRandom(LUCKY_ITEMS),
    color: pickRandom(LUCKY_COLORS),
    number: Math.floor(Math.random() * 99) + 1,
  };
}

export default function Home() {
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);

  const handleDraw = () => {
    if (flipped) {
      setFlipped(false);
      return;
    }
    setResult(drawFortune());
    setFlipped(true);
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-white/90 uppercase drop-shadow">
          Today&apos;s Fortune
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          🌈 오늘의 운세
        </h1>
        <p className="mt-3 text-sm font-medium text-white/90 drop-shadow">
          카드를 눌러 오늘 하루의 운세를 확인해보세요
        </p>
      </div>

      <button
        type="button"
        onClick={handleDraw}
        aria-label="운세 카드 뒤집기"
        className="perspective relative z-10 h-80 w-56 cursor-pointer sm:h-96 sm:w-64"
      >
        <div className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-card-face flex flex-col items-center justify-center gap-4 rounded-2xl border-4 border-white/70 bg-[conic-gradient(from_180deg,#ff4d4d,#ff9a3d,#ffe23d,#4dd06a,#4db5ff,#4d5dff,#a64dff,#ff4d4d)] shadow-[0_0_40px_rgba(255,255,255,0.5)]">
            <span className="text-6xl drop-shadow">🔮</span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-lg font-bold text-white backdrop-blur">
              운세 뽑기
            </span>
            <span className="text-xs font-medium text-white/90 drop-shadow">
              탭하여 카드를 뒤집으세요
            </span>
          </div>

          <div className="flip-card-face flip-card-back flex flex-col items-center justify-center gap-3 rounded-2xl border-4 border-transparent bg-white bg-clip-padding p-6 text-center shadow-[0_0_40px_rgba(255,255,255,0.6)] [background-image:linear-gradient(white,white),linear-gradient(120deg,#ff4d4d,#ff9a3d,#ffe23d,#4dd06a,#4db5ff,#4d5dff,#a64dff)] [background-origin:border-box] [background-clip:padding-box,border-box]">
            {result && (
              <>
                <span className="text-4xl">✨</span>
                <p className="text-base leading-relaxed font-medium text-indigo-950">
                  {result.message}
                </p>
                <div className="mt-2 grid w-full grid-cols-1 gap-1 text-sm text-indigo-800/80">
                  <p>
                    🍀 행운의 아이템:{" "}
                    <span className="font-semibold">{result.item}</span>
                  </p>
                  <p>
                    🎨 행운의 색:{" "}
                    <span className="font-semibold">{result.color}</span>
                  </p>
                  <p>
                    🔢 행운의 숫자:{" "}
                    <span className="font-semibold">{result.number}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={handleDraw}
        className="relative z-10 rounded-full border-2 border-white/80 bg-white/20 px-6 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/30"
      >
        {flipped ? "다시 뽑기" : "오늘의 운세 보기"}
      </button>
    </div>
  );
}
