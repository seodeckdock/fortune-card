"use client";

import { useEffect, useState } from "react";

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

type HistoryEntry = FortuneResult & {
  /** 뽑은 시각 (epoch ms) */
  drawnAt: number;
};

const HISTORY_KEY = "fortune-history";
const MAX_HISTORY = 50;

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

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  // 최초 렌더 이후 localStorage에서 기록을 불러온다 (SSR 하이드레이션 불일치 방지)
  useEffect(() => {
    setHistory(loadHistory());
    setMounted(true);
  }, []);

  const handleDraw = () => {
    if (flipped) {
      setFlipped(false);
      return;
    }
    const fortune = drawFortune();
    setResult(fortune);
    setFlipped(true);

    const entry: HistoryEntry = { ...fortune, drawnAt: Date.now() };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY); // 최신순, 최대 50개
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // 저장 실패는 무시 (용량 초과 등)
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // 무시
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center gap-10 overflow-hidden px-4 py-16">
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
        <p className="text-xs tracking-[0.3em] text-purple-300/80 uppercase">
          Today&apos;s Fortune
        </p>
        <h1 className="mt-2 bg-gradient-to-r from-amber-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-4xl font-bold text-transparent">
          오늘의 운세
        </h1>
        <p className="mt-3 text-sm text-indigo-200/70">
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
          <div className="flip-card-face flex flex-col items-center justify-center gap-4 rounded-2xl border border-amber-200/30 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <span className="text-6xl">🔮</span>
            <span className="text-lg font-semibold text-amber-100">
              운세 뽑기
            </span>
            <span className="text-xs text-indigo-200/60">
              탭하여 카드를 뒤집으세요
            </span>
          </div>

          <div className="flip-card-face flip-card-back flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-50 via-white to-indigo-50 p-6 text-center shadow-[0_0_40px_rgba(251,191,36,0.35)]">
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
        className="relative z-10 rounded-full border border-amber-200/40 bg-white/5 px-6 py-2 text-sm font-medium text-amber-100 backdrop-blur transition hover:bg-white/10"
      >
        {flipped ? "다시 뽑기" : "오늘의 운세 보기"}
      </button>

      <section className="relative z-10 w-full max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-100">
            📜 내 운세 기록
          </h2>
          {mounted && history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-indigo-200/70 transition hover:bg-white/10"
            >
              기록 지우기
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          {!mounted ? (
            <p className="px-4 py-8 text-center text-sm text-indigo-200/50">
              기록을 불러오는 중…
            </p>
          ) : history.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-indigo-200/60">
              아직 기록이 없어요. 카드를 뒤집어 운세를 뽑아보세요!
            </p>
          ) : (
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs tracking-wide text-purple-200/70 uppercase">
                  <th className="px-4 py-3 font-medium">뽑은 시각</th>
                  <th className="px-4 py-3 font-medium">운세</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    행운의 아이템 · 색 · 숫자
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr
                    key={entry.drawnAt}
                    className="border-b border-white/5 last:border-0 text-indigo-100/90"
                  >
                    <td className="px-4 py-3 align-top whitespace-nowrap text-indigo-200/70">
                      {formatTime(entry.drawnAt)}
                    </td>
                    <td className="px-4 py-3 align-top">{entry.message}</td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-indigo-200/80">
                      {entry.item} · {entry.color} · {entry.number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
