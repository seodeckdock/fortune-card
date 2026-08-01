-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run 하세요.
-- (여러 번 실행해도 안전합니다.)

-- 1) 테이블
create table if not exists public.fortunes (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),  -- 날짜 (저장 시각 자동 기록)
  name       text        not null default '익명',   -- 이름
  content    text        not null                   -- 운세 내용
);

create index if not exists fortunes_created_at_idx
  on public.fortunes (created_at desc);

-- 2) 로그인 사용자 연결용 컬럼 (저장 시 현재 로그인 사용자로 자동 채움)
alter table public.fortunes
  add column if not exists user_id uuid
  references auth.users (id) on delete cascade
  default auth.uid();

create index if not exists fortunes_user_id_idx
  on public.fortunes (user_id);

-- 3) RLS: 로그인한 사용자는 '자기 것'만 읽기/쓰기/삭제
alter table public.fortunes enable row level security;

-- (이전 공개 정책이 있다면 제거)
drop policy if exists "Public can read fortunes"   on public.fortunes;
drop policy if exists "Public can insert fortunes" on public.fortunes;
drop policy if exists "Public can delete fortunes" on public.fortunes;

drop policy if exists "Users read own fortunes"   on public.fortunes;
create policy "Users read own fortunes"
  on public.fortunes for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own fortunes" on public.fortunes;
create policy "Users insert own fortunes"
  on public.fortunes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own fortunes" on public.fortunes;
create policy "Users delete own fortunes"
  on public.fortunes for delete
  using (auth.uid() = user_id);
