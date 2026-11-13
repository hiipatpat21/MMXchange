import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const read=path=>readFileSync(path,"utf8");
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
for(const file of files('app/(app)/sessions').filter(p=>p.endsWith('page.tsx'))) {
 assert.match(read(file),/redirect\("\/exchanges\?notice=groups-retired"\)/);
 assert.doesNotMatch(read(file),/createClient|\.from\(|\.rpc\(/);
}
for(const file of [...files('app'),...files('components'),...files('lib')].filter(p=>/\.(ts|tsx)$/.test(p))) {
 assert.doesNotMatch(read(file),/\.from\(["'](?:group_sessions|group_session_registrations|session_announcements|group_session_feedback)["']\)/,file);
 assert.doesNotMatch(read(file),/\.rpc\(["'](?:register_for_session|registration_counts|submit_session_feedback|complete_group_session|cancel_group_session|update_group_session|get_session_feedback_summary)["']/,file);
}
assert.doesNotMatch(read('components/layout/nav-links.tsx'),/\/sessions/);
assert.match(read('proxy.ts'),/"\/sessions"/);
const migration=read('supabase/migrations/20261113_teacher_prompt_6_delete_empty_groups.sql').replace(/^--.*$/gm,'');
assert.doesNotMatch(migration,/\bcascade\b/i);
assert.doesNotMatch(migration,/\bdelete\s+from\b/i);
for(const name of ['profiles','skills','exchange_sessions','exchange_requests','paid_lesson_requests','paid_lesson_payments','paid_lesson_receipts','exchange_messages','exchange_reviews','reports','forum_posts'])assert.doesNotMatch(migration,new RegExp(`drop table(?: if exists)? (?:public\\.)?${name}\\b`,'i'));
console.log('Group retirement source checks passed: protected redirects, no live group queries/RPCs, no group navigation, no row deletion or unrelated table drops.');
