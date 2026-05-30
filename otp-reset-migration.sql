-- Enable pgcrypto for crypt() and gen_salt()
create extension if not exists pgcrypto;

-- OTP password reset table
create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookup by email
create index if not exists idx_password_reset_otps_email on public.password_reset_otps(email);

-- RLS: no direct access from client (all access via RPC only)
alter table public.password_reset_otps enable row level security;

-- No RLS policies — table is only accessible via security definer functions below

-- Function: create_password_reset_otp
-- Inserts a hashed OTP for the given email (expires in 10 min)
-- Returns true if user exists, false if not (without revealing which)
create or replace function public.create_password_reset_otp(
  p_email text,
  p_otp_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_exists boolean;
begin
  -- Check user exists in auth.users
  select exists(
    select 1 from auth.users where email = p_email
  ) into v_user_exists;

  if not v_user_exists then
    return false;
  end if;

  -- Invalidate any previous unused OTPs for this email
  update public.password_reset_otps
    set used = true
  where email = p_email and used = false;

  -- Insert new OTP (expires in 10 minutes)
  insert into public.password_reset_otps (email, otp_hash, expires_at)
  values (p_email, p_otp_hash, now() + interval '10 minutes');

  return true;
end;
$$;

-- Function: verify_and_reset_password
-- Verifies the OTP hash and updates the user's password atomically
-- Returns: 'ok' | 'invalid_otp' | 'expired' | 'user_not_found'
create or replace function public.verify_and_reset_password(
  p_email text,
  p_otp_hash text,
  p_new_password text
)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_otp_record record;
  v_user_id uuid;
begin
  -- Find the latest valid unused OTP for this email
  select * into v_otp_record
  from public.password_reset_otps
  where email = p_email
    and otp_hash = p_otp_hash
    and used = false
  order by created_at desc
  limit 1;

  if not found then
    return 'invalid_otp';
  end if;

  if v_otp_record.expires_at < now() then
    update public.password_reset_otps set used = true where id = v_otp_record.id;
    return 'expired';
  end if;

  -- Get user id
  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    return 'user_not_found';
  end if;

  -- Update password using Supabase's built-in auth helper
  update auth.users
  set
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  where id = v_user_id;

  -- Mark OTP as used
  update public.password_reset_otps set used = true where id = v_otp_record.id;

  return 'ok';
end;
$$;

-- Grant execute to anon and authenticated roles
grant execute on function public.create_password_reset_otp(text, text) to anon, authenticated;
grant execute on function public.verify_and_reset_password(text, text, text) to anon, authenticated;
