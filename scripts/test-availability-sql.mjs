import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
// Optional scratch-only tool: npm install --prefix .taste-skill/sql-test --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
// Never reads .env or connects to hosted Supabase. PGlite does not prove multi-session races.
const require=createRequire(resolve(".taste-skill/sql-test/runner.cjs"));
const { PGlite }=require("@electric-sql/pglite");
const db=new PGlite();
try {
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;
 create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
 grant usage on schema storage to anon,authenticated;`);
 for(const file of ['lib/supabase/schema.sql','supabase/schema.sql']) { await db.exec(readFileSync(file,'utf8'));console.log('Applied locally: '+file); }
 await db.exec(readFileSync('supabase/migrations/20261113_teacher_prompt_4_availability.sql','utf8'));
 console.log('Prompt 4 rerun succeeded.');
 await db.exec(`insert into auth.users(id,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','{"display_name":"Test A"}'),
 ('22222222-2222-4222-8222-222222222222','{"display_name":"Test B"}'),
 ('33333333-3333-4333-8333-333333333333','{"display_name":"Test C"}');`);
 for(const file of ['supabase/tests/onboarding-checks.sql','supabase/tests/individual-lessons-checks.sql','supabase/tests/availability-checks.sql','supabase/tests/security-checks.sql']) {
   const sql=readFileSync(file,'utf8').replaceAll('<USER_A_UUID>','11111111-1111-4111-8111-111111111111').replaceAll('<USER_B_UUID>','22222222-2222-4222-8222-222222222222').replaceAll('<USER_C_UUID>','33333333-3333-4333-8333-333333333333');
   console.log('Testing locally: '+file); await db.exec(sql); console.log('Passed: '+file);
   if(file.endsWith('availability-checks.sql')) {
     await db.exec("set timezone='America/New_York'");
     await db.exec(sql);
     await db.exec("set timezone='UTC'");
     console.log('Availability SQL also passed with America/New_York session timezone.');
   }
 }

} catch(error) { console.error({message:error.message,detail:error.detail,context:error.where});process.exitCode=1; }
await db.close();
