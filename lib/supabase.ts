import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// 브라우저 전용 Supabase 클라이언트 (publishable/anon 키 사용).
// SSR(Node)에서 실행되지 않도록, useEffect·이벤트 핸들러 등 브라우저 컨텍스트에서만 호출할 것.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase 환경변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인하세요.",
      );
    }
    client = createClient(url, key);
  }
  return client;
}
