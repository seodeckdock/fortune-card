// OpenRouter로 오늘의 운세를 생성하는 서버 라우트.
// OPENROUTER_API_KEY 는 비밀 키이므로 반드시 서버에서만 사용한다(브라우저 노출 금지).
import { zodiacSign } from "@/lib/zodiac";

export const dynamic = "force-dynamic";

const MODEL = "openai/gpt-4o-mini";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

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
              "너는 위트 있는 '오늘의 운세' 작가야. '좋은 일이 생길 거야', '행운이 함께해' 같은 뻔하고 상투적인 덕담은 절대 쓰지 마. 예상 밖의 발상, 일상의 구체적인 디테일, 재치 있는 비유나 살짝 웃긴 반전을 넣어서 써. 톤은 다정한 반말이지만 유쾌하고 능청스럽게.",
          },
          {
            role: "user",
            content:
              personalize +
              "오늘의 운세를 위트 있고 재치 있게 딱 세 줄로 써줘. 진부한 표현과 교과서적인 덕담은 금지, 구체적인 상황이나 유머러스한 이미지를 넣어. 다정한 반말로, 각 줄은 줄바꿈(\\n)으로 구분하고 따옴표·번호·접두어 없이 문장만. 각 줄은 너무 길지 않게.",
          },
        ],
        max_tokens: 200,
        temperature: 1.0,
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
