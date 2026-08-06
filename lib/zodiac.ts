// 생년월일 → 별자리 변환. AI 운세 문구와 운세 이미지 라우트가 함께 사용한다.

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

/** "YYYY-MM-DD" → 별자리 이름 (유효하지 않으면 null) */
export function zodiacSign(birthdate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return day <= ZODIAC_LAST_DAY[month - 1]
    ? ZODIAC[month - 1]
    : ZODIAC[month % 12];
}
