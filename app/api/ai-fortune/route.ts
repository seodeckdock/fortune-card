// OpenRouter로 오늘의 운세를 생성하는 서버 라우트.
// OPENROUTER_API_KEY 는 비밀 키이므로 반드시 서버에서만 사용한다(브라우저 노출 금지).
export const dynamic = "force-dynamic";

const MODEL = "openai/gpt-4o-mini";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function POST() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENROUTER_API_KEY 가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

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
