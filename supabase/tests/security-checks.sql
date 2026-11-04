-- Prompt 12: run AFTER all schema SQL, including the Prompt 12 hardening block.
-- Use three DISPOSABLE existing accounts. Only A and B are simulated callers;
-- C holds the private exchange/session so A is genuinely a non-participant.
-- Replace the three account placeholders. No emails or credentials are needed.
-- Session/exchange IDs are generated below; optional unused UUID replacements
-- are marked at their definitions. Do not use IDs of real activities.
-- Run the WHOLE script in the Supabase SQL Editor. All fixtures and writes roll back.
begin;
select set_config('mmx.user_a','<USER_A_UUID>',true);
select set_config('mmx.user_b','<USER_B_UUID>',true);
select set_config('mmx.user_c','<USER_C_UUID>',true);

do $$
declare v_id text; v_count integer;
begin
  foreach v_id in array array[current_setting('mmx.user_a'),current_setting('mmx.user_b'),current_setting('mmx.user_c')] loop
    if v_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Replace USER_A_UUID, USER_B_UUID, and USER_C_UUID with real test profile UUIDs.';
    end if;
    if not exists (select 1 from public.profiles where id = v_id::uuid) then raise exception 'A test profile does not exist.'; end if;
  end loop;
  select count(distinct x) into v_count from unnest(array[current_setting('mmx.user_a'),current_setting('mmx.user_b'),current_setting('mmx.user_c')]) x;
  if v_count <> 3 then raise exception 'Use three distinct accounts.'; end if;
  if not exists (select 1 from public.skills) then raise exception 'Seed at least one real skill first.'; end if;
end $$;

-- Optional fixture UUID placeholders: replace gen_random_uuid() with an UNUSED
-- '<PRIVATE_EXCHANGE_UUID>' / '<INCOMPLETE_EXCHANGE_UUID>' / '<SESSION_UUID>'.
select set_config('mmx.private_exchange',gen_random_uuid()::text,true);
select set_config('mmx.incomplete_exchange',gen_random_uuid()::text,true);
select set_config('mmx.other_session',gen_random_uuid()::text,true);
select set_config('mmx.duplicate_session',gen_random_uuid()::text,true);
select set_config('mmx.last_seat_session',gen_random_uuid()::text,true);
select set_config('mmx.completed_session',gen_random_uuid()::text,true);
select set_config('mmx.private_notification',gen_random_uuid()::text,true);
select set_config('mmx.private_report',gen_random_uuid()::text,true);
select set_config('mmx.forum_post',gen_random_uuid()::text,true);
select set_config('mmx.forum_comment',gen_random_uuid()::text,true);

-- Fixture setup uses the SQL Editor role. Test calls below explicitly switch roles.
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mmx.user_b'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',current_setting('mmx.user_b'),true);
insert into public.exchange_requests(id,requester_id,recipient_id,learn_skill_id,teach_skill_id,message,format,status)
select current_setting('mmx.private_exchange')::uuid,current_setting('mmx.user_b')::uuid,current_setting('mmx.user_c')::uuid,id,id,'Security test exchange','online','completed' from public.skills order by id limit 1;
-- Declined is deliberately incomplete and avoids collisions with existing active pairs.
insert into public.exchange_requests(id,requester_id,recipient_id,learn_skill_id,teach_skill_id,message,format,status)
select current_setting('mmx.incomplete_exchange')::uuid,current_setting('mmx.user_a')::uuid,current_setting('mmx.user_b')::uuid,id,id,'Incomplete security test','online','declined' from public.skills order by id limit 1;
insert into public.exchange_messages(exchange_id,sender_id,body)
values (current_setting('mmx.private_exchange')::uuid,current_setting('mmx.user_b')::uuid,'Private fixture message');
insert into public.notifications(id,recipient_id,type,title)
values (current_setting('mmx.private_notification')::uuid,current_setting('mmx.user_b')::uuid,'security_test','Private fixture notification');

insert into public.group_sessions(id,organizer_id,skill_id,title,description,starts_at,duration_minutes,format,venue,capacity,status)
select current_setting('mmx.other_session')::uuid,current_setting('mmx.user_b')::uuid,id,'Other organizer test','Temporary security test fixture',now()+interval '2 days',30,'online','Security test only',null,'published' from public.skills order by id limit 1;
insert into public.group_sessions(id,organizer_id,skill_id,title,description,starts_at,duration_minutes,format,venue,capacity,status)
select current_setting('mmx.duplicate_session')::uuid,current_setting('mmx.user_c')::uuid,id,'Duplicate test','Temporary security test fixture',now()+interval '2 days',30,'online','Security test only',null,'published' from public.skills order by id limit 1;
insert into public.group_sessions(id,organizer_id,skill_id,title,description,starts_at,duration_minutes,format,venue,capacity,status)
select current_setting('mmx.last_seat_session')::uuid,current_setting('mmx.user_c')::uuid,id,'Last seat test','Temporary security test fixture',now()+interval '2 days',30,'online','Security test only',1,'published' from public.skills order by id limit 1;
insert into public.group_sessions(id,organizer_id,skill_id,title,description,starts_at,duration_minutes,format,venue,capacity,status)
select current_setting('mmx.completed_session')::uuid,current_setting('mmx.user_c')::uuid,id,'Completed test','Temporary security test fixture',now()-interval '2 days',30,'online','Security test only',null,'completed' from public.skills order by id limit 1;
insert into public.session_announcements(session_id,author_id,body)
values (current_setting('mmx.other_session')::uuid,current_setting('mmx.user_b')::uuid,'Private organizer announcement');
insert into public.forum_posts(id,author_id,category,title,body)
values (current_setting('mmx.forum_post')::uuid,current_setting('mmx.user_b')::uuid,'general','Security test discussion','Temporary security test fixture');
insert into public.forum_comments(id,post_id,author_id,body)
values (current_setting('mmx.forum_comment')::uuid,current_setting('mmx.forum_post')::uuid,current_setting('mmx.user_b')::uuid,'Temporary test reply');
insert into public.reports(id,reporter_id,target_type,target_id,reason)
values (current_setting('mmx.private_report')::uuid,current_setting('mmx.user_b')::uuid,'forum_post',current_setting('mmx.forum_post'),'Temporary security test report');

create temporary table security_results(test text, result text, detail text) on commit drop;
do $$ begin
  execute format('grant usage on schema %I to authenticated',(select nspname from pg_namespace where oid = pg_my_temp_schema()));
end $$;
grant select, insert on pg_temp.security_results to authenticated;
create function pg_temp.expect_count(p_test text,p_sql text,p_expected bigint)
returns void language plpgsql set search_path = '' as $$
declare v_count bigint;
begin
  execute p_sql into v_count;
  insert into pg_temp.security_results values (p_test,case when v_count = p_expected then 'PASS' else 'FAIL' end,'Expected '||p_expected||', got '||coalesce(v_count::text,'NULL'));
exception when others then
  insert into pg_temp.security_results values (p_test,'FAIL','Unexpected SQLSTATE '||sqlstate);
end $$;
create function pg_temp.expect_denied_write(p_test text,p_sql text)
returns void language plpgsql set search_path = '' as $$
declare v_count bigint;
begin
  execute p_sql;
  get diagnostics v_count = row_count;
  insert into pg_temp.security_results values (p_test,case when v_count = 0 then 'PASS' else 'FAIL' end,'Rows changed: '||v_count);
exception when insufficient_privilege then
  insert into pg_temp.security_results values (p_test,'PASS','Permission/RLS denial');
when others then
  insert into pg_temp.security_results values (p_test,'FAIL','Unexpected SQLSTATE '||sqlstate);
end $$;
create function pg_temp.expect_code(p_test text,p_sql text,p_expected text)
returns void language plpgsql set search_path = '' as $$
declare v_code text;
begin
  execute p_sql into v_code;
  insert into pg_temp.security_results values (p_test,case when v_code = p_expected then 'PASS' else 'FAIL' end,'Expected '||p_expected||', got '||coalesce(v_code,'NULL'));
exception when others then
  insert into pg_temp.security_results values (p_test,'FAIL','Unexpected SQLSTATE '||sqlstate);
end $$;
grant execute on function pg_temp.expect_count(text,text,bigint), pg_temp.expect_denied_write(text,text), pg_temp.expect_code(text,text,text) to authenticated;

set local role authenticated;
-- This is the same claim format Supabase uses; auth.uid() reads the sub claim.
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mmx.user_a'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',current_setting('mmx.user_a'),true);

select pg_temp.expect_count('A identity positive control','select (auth.uid() = current_setting(''mmx.user_a'')::uuid)::int',1);
select pg_temp.expect_count('A reads own profile','select count(*) from public.profiles where id = auth.uid()',1);
select pg_temp.expect_denied_write('A cannot update B profile',format('update public.profiles set bio = ''unauthorized test'' where id = %L::uuid',current_setting('mmx.user_b')));
select pg_temp.expect_denied_write('A cannot forge own creation timestamp','update public.profiles set created_at = now() where id = auth.uid()');
select pg_temp.expect_count('A cannot read B/C exchange',format('select count(*) from public.exchange_requests where id = %L::uuid',current_setting('mmx.private_exchange')),0);
select pg_temp.expect_count('A cannot read B/C conversation',format('select count(*) from public.exchange_messages where exchange_id = %L::uuid',current_setting('mmx.private_exchange')),0);
select pg_temp.expect_count('A cannot read B notification',format('select count(*) from public.notifications where id = %L::uuid',current_setting('mmx.private_notification')),0);
select pg_temp.expect_count('A cannot read B report',format('select count(*) from public.reports where id = %L::uuid',current_setting('mmx.private_report')),0);
select pg_temp.expect_count('Unregistered A cannot read announcements',format('select count(*) from public.session_announcements where session_id = %L::uuid',current_setting('mmx.other_session')),0);
select pg_temp.expect_denied_write('A cannot update B session directly',format('update public.group_sessions set title = ''Unauthorized change'' where id = %L::uuid',current_setting('mmx.other_session')));
select pg_temp.expect_code('A cannot edit B session through RPC',format('select public.update_group_session(%L::uuid,''Changed title'',(select min(id) from public.skills),''Security test description'',null,null,now()+interval ''3 days'',30,''online'',''Security test'',null,null)',current_setting('mmx.other_session')),'not_organizer');
select pg_temp.expect_denied_write('No direct registration insert',format('insert into public.group_session_registrations(session_id,profile_id) values (%L::uuid,auth.uid())',current_setting('mmx.other_session')));
select pg_temp.expect_code('First registration succeeds',format('select public.register_for_session(%L::uuid)',current_setting('mmx.duplicate_session')),'ok');
select pg_temp.expect_code('Duplicate registration rejected',format('select public.register_for_session(%L::uuid)',current_setting('mmx.duplicate_session')),'already_registered');
select pg_temp.expect_code('A takes last seat',format('select public.register_for_session(%L::uuid)',current_setting('mmx.last_seat_session')),'ok');
select pg_temp.expect_code('Nonparticipant cannot respond',format('select public.respond_to_exchange(%L::uuid,''accept'')',current_setting('mmx.private_exchange')),'not_allowed');
select pg_temp.expect_code('Nonparticipant cannot mark thread read',format('select public.mark_exchange_read(%L::uuid,now())',current_setting('mmx.private_exchange')),'not_allowed');
select pg_temp.expect_code('Unregistered student cannot give feedback',format('select public.submit_session_feedback(%L::uuid,5,true,null)',current_setting('mmx.completed_session')),'not_registered');
select pg_temp.expect_code('Cannot review incomplete exchange',format('select public.submit_exchange_review(%L::uuid,5,null)',current_setting('mmx.incomplete_exchange')),'not_completed');
select pg_temp.expect_denied_write('A cannot delete B forum post',format('delete from public.forum_posts where id = %L::uuid',current_setting('mmx.forum_post')));
select pg_temp.expect_denied_write('A cannot delete B forum reply',format('delete from public.forum_comments where id = %L::uuid',current_setting('mmx.forum_comment')));
select pg_temp.expect_denied_write('A cannot forge report author',format('insert into public.reports(reporter_id,target_type,target_id,reason) values (%L::uuid,''forum_post'',%L,''Unauthorized report author'')',current_setting('mmx.user_b'),current_setting('mmx.forum_post')));
select pg_temp.expect_denied_write('No direct read-receipt writes',format('insert into public.exchange_message_reads(exchange_id,profile_id) values (%L::uuid,auth.uid())',current_setting('mmx.incomplete_exchange')));

-- Switch identity inside the SAME rollback-only transaction.
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mmx.user_b'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',current_setting('mmx.user_b'),true);
select pg_temp.expect_count('B identity positive control','select (auth.uid() = current_setting(''mmx.user_b'')::uuid)::int',1);
select pg_temp.expect_count('B reads private exchange positive control',format('select count(*) from public.exchange_requests where id = %L::uuid',current_setting('mmx.private_exchange')),1);
select pg_temp.expect_count('B reads private message positive control',format('select count(*) from public.exchange_messages where exchange_id = %L::uuid',current_setting('mmx.private_exchange')),1);
select pg_temp.expect_count('B reads own report positive control',format('select count(*) from public.reports where id = %L::uuid',current_setting('mmx.private_report')),1);
select pg_temp.expect_code('Participant receipt RPC still works',format('select public.mark_exchange_read(%L::uuid,clock_timestamp())',current_setting('mmx.private_exchange')),'ok');
select pg_temp.expect_code('Full session rejects B',format('select public.register_for_session(%L::uuid)',current_setting('mmx.last_seat_session')),'full');

-- Live catalog checks: source files alone cannot prove deployed RLS/grants.
insert into pg_temp.security_results
select 'RLS: '||c.relname,case when c.relrowsecurity then 'PASS' else 'FAIL' end,'RLS must be enabled'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('skills','profiles','profile_skills','group_sessions','group_session_registrations','exchange_requests','exchange_sessions','notifications','exchange_messages','exchange_message_reads','session_announcements','exchange_reviews','group_session_feedback','reports','forum_posts','forum_comments');
insert into pg_temp.security_results
select 'Anonymous SELECT: '||c.relname,case when has_table_privilege('anon',c.oid,'SELECT') = (c.relname = 'skills') then 'PASS' else 'FAIL' end,'Only skills is an anonymous public table'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname in ('skills','profiles','profile_skills','group_sessions','group_session_registrations','exchange_requests','exchange_sessions','notifications','exchange_messages','exchange_message_reads','session_announcements','exchange_reviews','group_session_feedback','reports','forum_posts','forum_comments');
insert into pg_temp.security_results
select 'Anonymous writes: '||c.relname,
  case when not (has_table_privilege('anon',c.oid,'INSERT') or has_table_privilege('anon',c.oid,'UPDATE') or has_table_privilege('anon',c.oid,'DELETE') or has_table_privilege('anon',c.oid,'TRUNCATE')) then 'PASS' else 'FAIL' end,
  'No anonymous application table writes'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname in ('skills','profiles','profile_skills','group_sessions','group_session_registrations','exchange_requests','exchange_sessions','notifications','exchange_messages','exchange_message_reads','session_announcements','exchange_reviews','group_session_feedback','reports','forum_posts','forum_comments');
insert into pg_temp.security_results
select 'FK index: '||c.conrelid::regclass||'.'||c.conname,
  case when exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indisvalid and i.indpred is null and i.indkey[0] = c.conkey[1]) then 'PASS' else 'FAIL' end,
  'Single-column FK should have a nonpartial leading index'
from pg_constraint c join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public' and c.contype = 'f' and cardinality(c.conkey) = 1;
insert into pg_temp.security_results
select 'Definer permissions: '||p.proname,
  case when not has_function_privilege('anon',p.oid,'EXECUTE') and exists (select 1 from unnest(p.proconfig) s where s in ('search_path=""','search_path=')) then 'PASS' else 'FAIL' end,
  'No anonymous/PUBLIC execute and empty search_path required'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef;

select test,result,detail from pg_temp.security_results order by result,test;
select case when count(*) filter (where result = 'FAIL') = 0 then 'PASS: all checks passed' else 'FAIL: inspect failed checks above' end as summary,
  count(*) filter (where result = 'PASS') as passed, count(*) filter (where result = 'FAIL') as failed
from pg_temp.security_results;
rollback;
