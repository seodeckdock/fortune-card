-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run 하세요.
-- (테이블을 이미 만드셨다면, 아래는 다시 실행해도 안전합니다.)

create table if not exists public.fortunes (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),  -- 날짜 (저장 시각 자동 기록)
  name       text        not null default '익명',   -- 이름
  content    text        not null                   -- 운세 내용
);

create index if not exists fortunes_created_at_idx
  on public.fortunes (created_at desc);

-- RLS 활성화
alter table public.fortunes enable row level security;

-- anon(publishable) 키로 브라우저에서 직접 접근하므로, 아래 정책이 반드시 필요합니다.
-- 정책이 없으면 조회/저장/삭제가 모두 차단됩니다.
drop policy if exists "Public can read fortunes" on public.fortunes;
create policy "Public can read fortunes"
  on public.fortunes for select
  using (true);

drop policy if exists "Public can insert fortunes" on public.fortunes;
create policy "Public can insert fortunes"
  on public.fortunes for insert
  with check (true);

drop policy if exists "Public can delete fortunes" on public.fortunes;
create policy "Public can delete fortunes"
  on public.fortunes for delete
  using (true);
