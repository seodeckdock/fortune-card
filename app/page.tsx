"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

const TABLE = "fortunes";
const COLUMNS = "created_at, name, content";

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

/** 화면/DB에서 다루는 운세 기록 (fortunes 테이블: 날짜·이름·운세 내용) */
type FortuneRecord = {
  createdAt: number; // 날짜 (epoch ms)
  name: string; // 이름
  content: string; // 운세 내용
};

/** Supabase fortunes 테이블에서 내려오는 행 형태 */
type FortuneRow = {
  created_at: string;
  name: string;
  content: string;
};

function rowToRecord(r: FortuneRow): FortuneRecord {
  return {
    createdAt: Date.parse(r.created_at),
    name: r.name,
    content: r.content,
  };
}

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
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [records, setRecords] = useState<FortuneRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  // 인증 상태
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMsg, setAuthMsg] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // AI 운세 생성 상태
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // 내 운세 기록을 Supabase에서 조회한다 (RLS로 본인 것만 내려옴).
  const loadRecords = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setRecords((data as FortuneRow[]).map(rowToRecord));
    } catch (e) {
      console.error("운세 기록 조회 실패:", (e as Error).message);
    }
  }, []);

  // 마운트 후: 현재 세션 확인 + 인증 상태 변화 구독.
  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) void loadRecords();
      setMounted(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        void loadRecords();
      } else {
        setRecords([]);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadRecords]);

  const handleAuth = async () => {
    setAuthMsg("");
    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthMsg("이메일과 비밀번호를 입력하세요.");
      return;
    }
    setAuthBusy(true);
    try {
      const supabase = getSupabase();
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: authPassword,
        });
        if (error) {
          setAuthMsg("회원가입 실패: " + error.message);
        } else if (data.user && !data.session) {
          // 이메일 인증이 켜져 있는 경우
          setAuthMsg("확인 메일을 보냈어요. 메일의 링크로 인증 후 로그인하세요.");
        } else {
          setAuthPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: authPassword,
        });
        if (error) setAuthMsg("로그인 실패: " + error.message);
        else setAuthPassword("");
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    setAuthEmail("");
    setAuthPassword("");
  };

  // 뽑은 운세를 기록에 반영 + 로그인 시 Supabase 저장 (랜덤/AI 공통)
  const recordFortune = (fortune: FortuneResult) => {
    if (!user) return; // 로그인한 경우에만 저장

    const who = name.trim() || "익명";
    // 낙관적 업데이트 (화면에 즉시 반영)
    const optimistic: FortuneRecord = {
      createdAt: Date.now(),
      name: who,
      content: fortune.message,
    };
    setRecords((prev) => [optimistic, ...prev]);

    // Supabase에 저장 (user_id·created_at 은 DB에서 자동 기록)
    getSupabase()
      .from(TABLE)
      .insert({ name: who, content: fortune.message })
      .then(({ error }) => {
        if (error) console.error("운세 저장 실패:", error.message);
      });
  };

  const handleDraw = () => {
    if (flipped) {
      setFlipped(false);
      return;
    }
    const fortune = drawFortune();
    setResult(fortune);
    setFlipped(true);
    recordFortune(fortune);
  };

  // AI(OpenRouter)로 오늘의 운세를 새로 생성한다.
  const handleAiDraw = async () => {
    if (aiLoading) return;
    setAiError("");
    setAiLoading(true);
    setFlipped(false); // 생성 중에는 카드 앞면
    try {
      const res = await fetch("/api/ai-fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdate }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok || !json.message) {
        throw new Error(json.error || "AI 운세 생성에 실패했어요.");
      }
      // 메시지는 AI가, 행운의 아이템·색·숫자는 랜덤으로 채운다.
      const fortune: FortuneResult = { ...drawFortune(), message: json.message };
      setResult(fortune);
      setFlipped(true);
      recordFortune(fortune);
    } catch (e) {
      setAiError((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearHistory = () => {
    setRecords([]);
    getSupabase()
      .from(TABLE)
      .delete()
      .gte("created_at", "1970-01-01T00:00:00Z")
      .then(({ error }) => {
        if (error) console.error("기록 삭제 실패:", error.message);
      });
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

      {/* 인증 패널: 로그인 폼 또는 로그인 상태 표시 */}
      <div className="relative z-10 w-full max-w-xs">
        {!mounted ? null : user ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-amber-200/30 bg-white/5 px-4 py-3 text-sm backdrop-blur">
            <span className="truncate text-amber-100">
              <span className="text-indigo-200/70">로그인: </span>
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-indigo-200/80 transition hover:bg-white/10"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200/30 bg-white/5 p-4 backdrop-blur">
            <div className="mb-3 flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthMsg("");
                }}
                className={`flex-1 rounded-full px-3 py-1 transition ${
                  authMode === "signin"
                    ? "bg-amber-200/20 text-amber-100"
                    : "text-indigo-200/60 hover:text-indigo-100"
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthMsg("");
                }}
                className={`flex-1 rounded-full px-3 py-1 transition ${
                  authMode === "signup"
                    ? "bg-amber-200/20 text-amber-100"
                    : "text-indigo-200/60 hover:text-indigo-100"
                }`}
              >
                회원가입
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAuth();
              }}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="이메일"
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-amber-50 placeholder:text-indigo-200/40 focus:border-amber-200/50 focus:outline-none"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="비밀번호 (6자 이상)"
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-amber-50 placeholder:text-indigo-200/40 focus:border-amber-200/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={authBusy}
                className="rounded-full border border-amber-200/40 bg-amber-200/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-200/20 disabled:opacity-50"
              >
                {authBusy
                  ? "처리 중…"
                  : authMode === "signup"
                    ? "회원가입"
                    : "로그인"}
              </button>
            </form>
            {authMsg && (
              <p className="mt-2 text-center text-xs text-amber-200/90">
                {authMsg}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-xs">
        <label htmlFor="name" className="sr-only">
          이름
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요 (선택, 비우면 익명)"
          maxLength={20}
          className="w-full rounded-full border border-amber-200/30 bg-white/5 px-4 py-2 text-center text-sm text-amber-50 placeholder:text-indigo-200/50 backdrop-blur focus:border-amber-200/60 focus:outline-none"
        />
      </div>

      <div className="relative z-10 w-full max-w-xs">
        <label
          htmlFor="birthdate"
          className="mb-1 block text-center text-xs text-indigo-200/60"
        >
          생년월일 (AI 운세에 반영돼요)
        </label>
        <input
          id="birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max="9999-12-31"
          className="w-full rounded-full border border-amber-200/30 bg-white/5 px-4 py-2 text-center text-sm text-amber-50 placeholder:text-indigo-200/50 backdrop-blur focus:border-amber-200/60 focus:outline-none [color-scheme:dark]"
        />
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
                <p className="text-base leading-relaxed font-medium whitespace-pre-line text-indigo-950">
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

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleDraw}
            className="rounded-full border border-amber-200/40 bg-white/5 px-6 py-2 text-sm font-medium text-amber-100 backdrop-blur transition hover:bg-white/10"
          >
            {flipped ? "다시 뽑기" : "오늘의 운세 보기"}
          </button>
          <button
            type="button"
            onClick={handleAiDraw}
            disabled={aiLoading}
            className="rounded-full border border-fuchsia-300/50 bg-fuchsia-400/15 px-6 py-2 text-sm font-semibold text-fuchsia-100 backdrop-blur transition hover:bg-fuchsia-400/25 disabled:opacity-60"
          >
            {aiLoading ? "AI가 운세를 짓는 중… ✨" : "✨ AI 운세 받기"}
          </button>
        </div>
        {aiError && (
          <p className="text-xs text-rose-300/90">{aiError}</p>
        )}
      </div>

      <section className="relative z-10 w-full max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-100">
            📜 내 운세 기록
          </h2>
          {mounted && user && records.length > 0 && (
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
          ) : !user ? (
            <p className="px-4 py-8 text-center text-sm text-indigo-200/60">
              로그인하면 내가 뽑은 운세가 여기에 저장됩니다. ✨
            </p>
          ) : records.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-indigo-200/60">
              아직 기록이 없어요. 카드를 뒤집어 운세를 뽑아보세요!
            </p>
          ) : (
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs tracking-wide text-purple-200/70 uppercase">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    날짜
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    이름
                  </th>
                  <th className="px-4 py-3 font-medium">운세</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, i) => (
                  <tr
                    key={`${record.createdAt}-${i}`}
                    className="border-b border-white/5 text-indigo-100/90 last:border-0"
                  >
                    <td className="px-4 py-3 align-top whitespace-nowrap text-indigo-200/70">
                      {formatTime(record.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-amber-100/90">
                      {record.name}
                    </td>
                    <td className="px-4 py-3 align-top">{record.content}</td>
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
