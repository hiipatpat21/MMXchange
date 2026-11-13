// Local boundary, query/privacy, action and accessible-render checks. No hosted access.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const require=createRequire(import.meta.url);
function load(file,imports={}) {
 const exports={};const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,URL,Intl,require:name=>name in imports?imports[name]:require(name)},{filename:file});return exports;
}
const lib=load('lib/meeting-reminders.ts'),now=Date.parse('2026-11-13T00:00:00Z');
const id='11111111-1111-4111-8111-111111111111',partner='22222222-2222-4222-8222-222222222222',outsider='33333333-3333-4333-8333-333333333333';
const iso=delta=>new Date(now+delta).toISOString();
for(const [delta,phase] of [[360000,null],[300001,null],[300000,'upcoming'],[1,'upcoming'],[0,'started'],[-1,'started'],[-3599999,'started'],[-3600000,null]])assert.equal(lib.reminderTiming(iso(delta),now)?.phase??null,phase);
assert.equal(lib.reminderCountdown(iso(299000),now),'Starts in 4m 59s');assert.match(lib.reminderCountdown(iso(-1000),now),/Meeting started.*0m 01s ago/);
const meeting={kind:'exchange',id,title:'Python',startsAt:iso(300000),format:'online',venue:'https://meet.example.com/room',href:`/exchanges/${id}#sessions-heading`};
const occurrence=lib.reminderOccurrence(meeting),records={[occurrence]:{announced:true,dismissed:true,expiresAt:now+3900000}};
assert.equal(lib.reminderOccurrence({...meeting,startsAt:'2026-11-13T08:05:00+08:00'}),occurrence);
assert.equal(lib.visibleReminders([meeting],now,records).length,0);
assert.equal(lib.visibleReminders([{...meeting,startsAt:iso(240000)}],now,records).length,1);
assert.equal(Object.keys(lib.pruneReminderRecords(records,now+3900000)).length,0);
assert.equal(Object.keys(lib.pruneReminderRecords({bad:{expiresAt:Infinity}},now)).length,0);
const storageLib=load('lib/reminder-storage.ts',{'@/lib/meeting-reminders':lib});
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
assert.notEqual(storageLib.reminderStorageKeys(id).records,storageLib.reminderStorageKeys(partner).records);
assert.equal(storageLib.claimReminderLease(storage,'lease','tab-a',now),true);
assert.equal(storageLib.claimReminderLease(storage,'lease','tab-b',now),false);
storageLib.releaseReminderLease(storage,'lease','tab-b');assert.equal(JSON.parse(storage.getItem('lease')).owner,'tab-a');
assert.equal(storageLib.claimReminderLease(storage,'lease','tab-b',now+15001),true);
map.set('records','broken-json');assert.equal(Object.keys(storageLib.readReminderRecords(storage,'records',now)).length,0);

const free={id,exchange_id:partner,starts_at:iso(240000),format:'online',venue:meeting.venue,status:'scheduled',skills:[{name:'Python'}],exchange:[{status:'scheduled',requester_id:id,recipient_id:partner}]};
const paid={request_id:partner,starts_at:iso(-60000),format:'in_person',venue:'Agreed public meeting place',status:'confirmed',request:{status:'accepted',learner_id:id,tutor_id:partner,skill_name:'Design',agreed_price_centavos:10000,payment:[{status:'confirmed',amount_centavos:10000}]}};
let failed=false;const queries=[];
const client={from:table=>{const record={table,filters:[]};queries.push(record);const q={select:s=>{record.select=s;return q;},eq:(...args)=>{record.filters.push(args);return q;},or:(...args)=>{record.actor=args;return q;},gte:()=>q,lte:()=>q,order:()=>q,range:async()=>({error:failed?{}:null,data:table==='exchange_sessions'?[free,{...free,id:outsider,exchange:{status:'scheduled',requester_id:partner,recipient_id:outsider}},{...free,id:outsider,status:'cancelled'},{...free,id:outsider,starts_at:iso(-3600000)}]:[paid,{...paid,status:'reserved'},{...paid,request:{...paid.request,payment:{status:'submitted',amount_centavos:10000}}},{...paid,request:{...paid.request,payment:{status:'confirmed',amount_centavos:1}}}]})};return q;}};
const {loadMeetingReminders}=load('lib/meeting-reminders-data.ts',{'@/lib/relations':load('lib/relations.ts'),'@/lib/meeting-reminders':lib});
let snapshot=await loadMeetingReminders(client,id,()=>now);
assert.equal(snapshot.meetings.length,2);assert.equal(snapshot.serverNow,now);
assert.ok(snapshot.meetings.some(m=>m.kind==='paid'));assert.ok(snapshot.meetings.every(m=>!('payment' in m)&&!('learner_id' in m)));
assert.ok(queries.every(q=>q.actor[0].includes(id)));assert.ok(queries.every(q=>q.actor[1].referencedTable));
assert.ok(queries.find(q=>q.table==='paid_lesson_bookings').filters.some(([key,value])=>key==='request.payment.status'&&value==='confirmed'));
failed=true;await assert.rejects(loadMeetingReminders(client,id,()=>now));failed=false;
let signedIn=true,authFails=false,loadedFor;
const actions=load('app/(app)/reminders/actions.ts',{'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:signedIn?{id}:null},error:authFails?{}:null})}})},'@/lib/meeting-reminders-data':{loadMeetingReminders:async(_client,user)=>{loadedFor=user;return snapshot;}}});
assert.equal((await actions.getMeetingReminders({userId:outsider})).userId,id);assert.equal(loadedFor,id);
signedIn=false;loadedFor=null;assert.equal((await actions.getMeetingReminders()).status,'unauthenticated');assert.equal(loadedFor,null);
authFails=true;assert.equal((await actions.getMeetingReminders()).status,'error');
const expired=load('app/(app)/reminders/actions.ts',{'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:null},error:{status:401}})}})},'@/lib/meeting-reminders-data':{loadMeetingReminders:async()=>{throw new Error('Must not query expired sessions');}}});
assert.equal((await expired.getMeetingReminders()).status,'unauthenticated');
const imports={
 '@/app/(app)/reminders/actions':{},'@/lib/reminder-browser':{},'@/lib/meeting-reminders':lib,
 '@/lib/datetime':load('lib/datetime.ts'),'@/components/ui/button':{Button:({children,...props})=>{delete props.variant;delete props.size;return React.createElement('button',props,children);}},
 'next/link':{__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)},
};
imports['@/components/meetings/meeting-location']=load('components/meetings/meeting-location.tsx',{'@/lib/meeting-links':load('lib/meeting-links.ts'),'next/link':imports['next/link']});
const {MeetingReminderBanner}=load('components/meetings/meeting-reminders.tsx',imports);
const html=renderToStaticMarkup(React.createElement(MeetingReminderBanner,{snapshot:{meetings:[meeting,{...meeting,kind:'paid',id:partner,title:'Design',format:'in_person'}],now},announcement:'Two meetings are due.',onDismiss:()=>{}}));
assert.equal((html.match(/role="alert"/g)??[]).length,1);assert.equal((html.match(/aria-live="off"/g)??[]).length,2);
assert.equal((html.match(/aria-label="Dismiss reminder/g)??[]).length,2);assert.equal((html.match(/target="_blank"/g)??[]).length,1);
assert.match(html,/Philippine time/);assert.match(html,/View meeting details/);
console.log('Reminder checks passed: five-minute/one-hour boundaries, occurrence dismissal, lease ownership, participant/payment filters, auth-derived identity and one accessible announcement.');
