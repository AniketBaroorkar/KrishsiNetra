-- KrishiNetra Supabase schema
-- Run this in the Supabase SQL editor (Project -> SQL -> New query).
-- Safe to re-run: uses IF NOT EXISTS.

create extension if not exists "pgcrypto";

-- 1. farmers ---------------------------------------------------------------
create table if not exists public.farmers (
  id                   uuid primary key default gen_random_uuid(),
  farmer_id            text,
  farmer_name          text,
  mobile_number        text,
  aadhaar_or_farmer_id text,
  village              text,
  taluka               text,
  district             text,
  state                text,
  created_at           timestamptz default now()
);

create index if not exists farmers_farmer_id_idx     on public.farmers (farmer_id);
create index if not exists farmers_mobile_number_idx on public.farmers (mobile_number);

-- 2. farms -----------------------------------------------------------------
create table if not exists public.farms (
  id            uuid primary key default gen_random_uuid(),
  farmer_id     text,
  survey_number text,
  farm_area     numeric,
  season        text,
  village       text,
  taluka        text,
  district      text,
  main_crop     text,
  gps_latitude  numeric,
  gps_longitude numeric,
  gps_accuracy  numeric,
  created_at    timestamptz default now()
);

create index if not exists farms_farmer_id_idx on public.farms (farmer_id);

-- 3. claims ----------------------------------------------------------------
create table if not exists public.claims (
  id                 uuid primary key default gen_random_uuid(),
  claim_id           text,
  farmer_id          text,
  farmer_name        text,
  mobile_number      text,
  village            text,
  taluka             text,
  district           text,
  crop_type          text,
  farm_area          numeric,
  survey_number      text,
  gps_latitude       numeric,
  gps_longitude      numeric,
  gps_accuracy       numeric,
  gps_trust_status   text,
  location_risk      text,
  photo_url          text,
  photo_source       text,
  submission_date    timestamptz,
  claim_status       text,
  risk_score         numeric,
  ai_predicted_crop  text,
  ai_confidence      numeric,
  ndvi_value         numeric,
  sync_status        text,
  created_at         timestamptz default now()
);

create index if not exists claims_farmer_id_idx     on public.claims (farmer_id);
create index if not exists claims_mobile_number_idx on public.claims (mobile_number);
create index if not exists claims_claim_status_idx  on public.claims (claim_status);
create index if not exists claims_district_idx      on public.claims (district);
create index if not exists claims_risk_score_idx    on public.claims (risk_score);

-- 4. admin_chat ------------------------------------------------------------
create table if not exists public.admin_chat (
  id            uuid primary key default gen_random_uuid(),
  farmer_id     text,
  farmer_name   text,
  mobile_number text,
  issue_type    text,
  message       text,
  sender        text,
  status        text,
  created_at    timestamptz default now()
);

create index if not exists admin_chat_farmer_id_idx on public.admin_chat (farmer_id);

-- 5. disaster_alerts -------------------------------------------------------
create table if not exists public.disaster_alerts (
  id              uuid primary key default gen_random_uuid(),
  title           text,
  body            text,
  disaster_type   text,
  severity        text,
  district        text,
  taluka          text,
  crop_type       text,
  action_required text,
  created_at      timestamptz default now()
);

create index if not exists disaster_alerts_district_idx on public.disaster_alerts (district);
