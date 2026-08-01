// OpenRouter로 오늘의 운세를 생성하는 서버 라우트.
// OPENROUTER_API_KEY 는 비밀 키이므로 반드시 서버에서만 사용한다(브라우저 노출 금지).
export const dynamic = "force-dynamic";

const MODEL = "openai/gpt-4o-mini";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const ZODIAC = [
  "염소자리",
  "물병자리",
  "물고기자리",
  "양자리",
  "황소자리",
  "쌍둥이자리",
  "게자리",
  "사자자리",
  "처녀자리",
  "천칭자리",
  "전갈자리",
  "사수자리",
];
// 각 별자리가 끝나는 날 (index 0 = 1월의 염소자리는 1/19까지)
const ZODIAC_LAST_DAY = [19, 18, 20, 19, 20, 20, 22, 22, 22, 22, 21, 21];

// "YYYY-MM-DD" → 별자리 이름 (유효하지 않으면 null)
function zodiacSign(birthdate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return day <= ZODIAC_LAST_DAY[month - 1]
    ? ZODIAC[month - 1]
    : ZODIAC[month % 12];
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENROUTER_API_KEY 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const birthdate =
    typeof body?.birthdate === "string" ? body.birthdate : "";
  const sign = zodiacSign(birthdate);

  const personalize = sign
    ? `이 사람은 ${birthdate}생, 별자리는 ${sign}야. 별자리 특성을 은근히 녹여서 이 사람만을 위한 운세로 써줘. `
    : "";

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "너는 다정한 친구처럼 '오늘의 운세'를 써 주는 한국어 운세 작가야. 항상 따뜻하고 다정한 반말로, 매번 새롭고 구체적으로 써.",
          },
          {
            role: "user",
            content:
              personalize +
              "오늘의 운세를 다정한 반말로 정확히 세 줄로 써줘. 각 줄은 줄바꿈(\\n)으로 구분하고, 따옴표·번호·접두어 없이 문장만. 각 줄은 너무 길지 않게.",
          },
        ],
        max_tokens: 200,
        temperature: 1.1,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: `OpenRouter 오류 (${res.status}): ${detail.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const json = await res.json();
    const message: string | undefined = json?.choices?.[0]?.message?.content
      ?.trim()
      .replace(/^["'"]|["'"]$/g, "");

    if (!message) {
      return Response.json({ error: "AI 응답이 비었습니다." }, { status: 502 });
    }

    return Response.json({ message });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
