// Local parser/render/action tests; no hosted calls or external meeting navigation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require=createRequire(import.meta.url);
function load(file,imports={}) {
 const exports={};const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,URL,Intl,require:name=>name in imports?imports[name]:require(name)},{filename:file});return exports;
}
const links=load('lib/meeting-links.ts');
for(const value of ['https://meet.example.com/room?code=abc&name=A%20B','http://example.com:8080/room',' https://EXAMPLE.COM/room ','https://[::1]/room'])assert.ok(links.parseMeetingUrl(value),value);
const unsafe=[null,{},'', 'meet.example.com/room','//example.com','https:example.com','javascript:alert(1)','data:text/html,<svg onload=alert(1)>','https://','https://bad..example','https://-bad.example','https://'+ 'a'.repeat(64)+'.com','https://user:password@example.com','https://example.com/<script>','https://example.com/" onclick="alert(1)','https://example.com/\\evil','https://example.com/a\nb','https://example.com/%0aevil','https://example.com:99999/room','https://example.com/'+ 'a'.repeat(201)];
for(const value of unsafe)assert.equal(links.parseMeetingUrl(value),null,String(value));
assert.equal(links.parseMeetingUrl('https://EXAMPLE.COM/room').host,'example.com');
const {MeetingLocation}=load('components/meetings/meeting-location.tsx',{
 '@/lib/meeting-links':links,'next/link':{__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)},
});
const render=props=>renderToStaticMarkup(React.createElement(MeetingLocation,{format:'online',venue:'https://meet.example.com/room',state:'confirmed',...props}));
let html=render({});assert.match(html,/href="https:\/\/meet.example.com\/room"/);assert.match(html,/target="_blank"/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/aria-label="Open meeting link on meet.example.com/);
for(const state of ['reserved','closed'])assert.doesNotMatch(render({state}),/<a\b/);
assert.match(render({state:'reserved'}),/still a reservation/);
assert.doesNotMatch(render({format:'in_person',venue:'https://example.com/a'}),/<a\b/);
html=render({venue:'<img src=x onerror=alert(1)>',editHref:'#edit'});assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/href="#edit"/);assert.match(html,/needs updating/);
assert.doesNotMatch(render({venue:'javascript:alert(1)'}),/<a\b/);
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
let signedIn=true,allowed=true,denied=false;const calls=[];
const client={auth:{getUser:async()=>({data:{user:signedIn?{id}:null}})},from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:allowed?{requester_id:id,recipient_id:other,teach_skill_id:1,learn_skill_id:2,exchange_id:id}:null,error:null})};return q;},rpc:async(name,args)=>{calls.push({name,args});return {data:denied?'not_allowed':'ok',error:null};}};
const datetime=load('lib/datetime.ts');
const common={'@/lib/meeting-links':links,'@/lib/supabase/server':{createClient:async()=>client},'next/cache':{revalidatePath:()=>{}},'@/lib/availability':load('lib/availability.ts',{'@/lib/datetime':datetime}),'@/lib/datetime':datetime,'next/navigation':{redirect:()=>{}}};
const free=load('app/(app)/exchanges/actions.ts',common),paid=load('app/(app)/lessons/booking-actions.ts',{...common,'@/lib/paid-lessons':{PAID_BOOKING_READY:true}});
const start=new Date(Math.ceil((Date.now()+86400000)/1800000)*1800000).toISOString();
const form=values=>{const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,v);return f;};
const fields={exchangeId:id,sessionId:id,teacherId:id,id,startsAt:start,duration:60,format:'online',venue:'https://meet.example.com/room'};
for(const fn of [free.scheduleSession,free.rescheduleSession,paid.reservePaidBooking]){
 for(const venue of unsafe.filter(v=>typeof v==='string')){const before=calls.length;assert.ok((await fn(null,form({...fields,venue}))).error,venue);assert.equal(calls.length,before);}
 signedIn=false;let before=calls.length;assert.ok((await fn(null,form(fields))).error);assert.equal(calls.length,before);signedIn=true;
 assert.ok((await fn(null,form(fields))).message);assert.equal(calls.at(-1).args.p_venue,fields.venue);
 assert.ok((await fn(null,form({...fields,format:'in_person',venue:'Public meeting area'}))).message);
 denied=true;assert.ok((await fn(null,form(fields))).error);denied=false;
}
allowed=false;let before=calls.length;assert.ok((await free.scheduleSession(null,form(fields))).error);assert.equal(calls.length,before);
assert.ok((await free.rescheduleSession(null,form(fields))).error);assert.equal(calls.length,before);
console.log('Meeting-link tests passed: safe parsing/escaped legacy text, HTTP(S)-only new-tab anchors, state gating, server validation for free/paid/rescheduling, and denied/anonymous writes.');
