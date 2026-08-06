// OpenRouter Images API로 운세 카드에 넣을 그림을 생성하는 서버 라우트.
// 채팅과는 다른 엔드포인트(/api/v1/images)를 쓰고, 이미지는 base64로 돌아온다.
// OPENROUTER_API_KEY 는 비밀 키이므로 반드시 서버에서만 사용한다(브라우저 노출 금지).
import { zodiacSign } from "@/lib/zodiac";

export const dynamic = "force-dynamic";
// 이미지 생성은 수 초~수십 초가 걸리므로 기본 타임아웃을 넉넉히 잡는다.
export const maxDuration = 60;

// 모델별 실측 (1:1, 1장 기준):
//   google/gemini-3.1-flash-lite-image  $0.034 / 약 170KB  ← 전송량이 가장 작아 기본값
//   black-forest-labs/flux.2-klein-4b   $0.014 / 약 1.2MB  ← 가장 저렴하지만 응답이 큼
//   openai/gpt-image-1-mini             $0.033 / 약 2.1MB
const MODEL = "google/gemini-3.1-flash-lite-image";
const ENDPOINT = "https://openrouter.ai/api/v1/images";

// 프롬프트는 영어일 때 반영이 잘 되므로 한국어 값들을 영어로 옮겨서 넣는다.
const COLOR_EN: Record<string, string> = {
  빨간색: "crimson red",
  주황색: "warm orange",
  노란색: "golden yellow",
  초록색: "fresh green",
  하늘색: "sky blue",
  파란색: "deep blue",
  보라색: "violet purple",
  분홍색: "soft pink",
  하얀색: "pearl white",
  검정색: "ink black",
  금색: "shimmering gold",
  은색: "silver",
};

const SIGN_EN: Record<string, string> = {
  염소자리: "Capricorn",
  물병자리: "Aquarius",
  물고기자리: "Pisces",
  양자리: "Aries",
  황소자리: "Taurus",
  쌍둥이자리: "Gemini",
  게자리: "Cancer",
  사자자리: "Leo",
  처녀자리: "Virgo",
  천칭자리: "Libra",
  전갈자리: "Scorpio",
  사수자리: "Sagittarius",
};

function buildPrompt(message: string, color: string, sign: string | null) {
  const palette = COLOR_EN[color] ?? "iridescent pastel";
  const motif = sign ? `${SIGN_EN[sign]} constellation motif, ` : "";
  // 이미지 모델은 한글 글자를 제대로 못 그리므로 글자는 넣지 않도록 못박는다.
  return (
    `A dreamy mystical tarot-card illustration for a daily fortune. ` +
    `${motif}dominant color ${palette}, soft glowing stars, celestial night sky, ` +
    `delicate art nouveau linework, ethereal and hopeful mood, centered composition. ` +
    `Mood inspired by this Korean fortune: "${message}". ` +
    `Absolutely no text, no letters, no words, no numbers anywhere in the image.`
  );
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
  const message = typeof body?.message === "string" ? body.message.slice(0, 300) : "";
  const color = typeof body?.color === "string" ? body.color : "";
  const birthdate = typeof body?.birthdate === "string" ? body.birthdate : "";

  if (!message) {
    return Response.json({ error: "운세 내용이 없습니다." }, { status: 400 });
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
        prompt: buildPrompt(message, color, zodiacSign(birthdate)),
        n: 1,
        aspect_ratio: "1:1",
        // resolution 은 넘기지 않는다. 이 모델은 "1K" 만 받아들이는데(512·2K 는 provider 가 거부)
        // 그 값이 기본값과 같아서 효과가 없다. 결과는 항상 1024x1024 JPEG, 그림 복잡도에 따라 400KB~1MB.
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
    const first = json?.data?.[0];
    const b64: string | undefined = first?.b64_json;

    if (!b64) {
      return Response.json({ error: "이미지 응답이 비었습니다." }, { status: 502 });
    }

    // 브라우저에서 <img src> 로 바로 쓸 수 있게 data URL 로 감싸서 돌려준다.
    const mediaType: string = first?.media_type ?? "image/png";
    return Response.json({ image: `data:${mediaType};base64,${b64}` });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
