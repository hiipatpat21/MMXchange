// Local guidance/data-query tests; no hosted account or network access.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require=createRequire(import.meta.url);
function load(file,imports={}) {
 const exports={};const js=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,require:name=>name in imports?imports[name]:require(name)},{filename:file});return exports;
}
const {lessonGuide,homePreview}=load('lib/learning-guidance.ts');
const id='11111111-1111-4111-8111-111111111111',now=Date.parse('2026-11-13T00:00:00Z');
const base={id,status:'accepted',isTutor:false,now};
const booking={status:'reserved',starts_at:'2026-11-14T00:00:00Z'};
assert.equal(lessonGuide({...base,status:'pending',isTutor:true}).label,'Review request');
assert.equal(lessonGuide(base).href,`/lessons/${id}#schedule`);
assert.equal(lessonGuide({...base,booking,payment:{status:'awaiting_receipt'}}).label,'Upload receipt');
assert.match(lessonGuide({...base,booking,payment:{status:'rejected'}}).text,/replacement/);
assert.equal(lessonGuide({...base,booking,payment:{status:'submitted'}}).label,'View submitted receipt');
assert.equal(lessonGuide({...base,isTutor:true,booking,payment:{status:'submitted'}}).label,'Review payment');
assert.equal(lessonGuide({...base,status:'cancelled',booking,payment:{status:'submitted'}}).label,'View lesson');
assert.equal(lessonGuide({...base,booking:{...booking,starts_at:'2026-11-12T00:00:00Z'},payment:{status:'submitted'},isTutor:true}).label,'Resolve reservation');
assert.equal(lessonGuide({...base,booking:{...booking,status:'confirmed'}}).label,'View meeting');
assert.match(lessonGuide({...base,ownConfirmed:true,booking:{...booking,status:'confirmed',starts_at:'2026-11-12T00:00:00Z'}}).text,/Waiting/);
const preview=homePreview([4,2,3,1].map(n=>({id:String(n),title:'Meeting',kind:'Free swap',href:'/exchanges/'+id,at:`2026-11-${String(13+n).padStart(2,'0')}T00:00:00Z`})),[3,2,1,0].map(n=>({id:String(n),title:'Task',href:'/lessons/'+id,label:'Review',at:'2026-11-14T00:00:00Z',priority:n===3?0:1})));
assert.deepEqual(Array.from(preview.meetings,r=>r.id),['1','2','3']);assert.equal(preview.tasks.length,3);assert.equal(preview.tasks[0].id,'3');
let failedTable='',empty=false;const queries=[];
const reader={from:table=>{
 const q={table,filters:[],selection:''};queries.push(q);
 const b={select:s=>{q.selection=s;return b;},eq:(k,v)=>{q.filters.push([k,v]);return b;},in:(k,v)=>{q.filters.push([k,v]);return b;},gt:(k,v)=>{q.filters.push([k,v]);return b;},order:()=>b,limit:()=>b,then:(resolve,reject)=>{
  let data=[];
  if(!empty && table==='exchange_sessions')data=[{id,exchange_id:id,starts_at:'2026-11-14T00:00:00Z',skills:{name:'Python'}}];
  if(!empty && table==='paid_lesson_payments')data=[{request_id:table+q.filters[0][1],request:[{skill_name:'Design',booking:[{starts_at:'2026-11-14T00:00:00Z'}]}]}];
  return Promise.resolve({data,error:table===failedTable?{}:null}).then(resolve,reject);
 }};return b;
}};
const {loadHome}=load('lib/home.ts',{'@/lib/relations':load('lib/relations.ts'),'@/lib/learning-guidance':{homePreview}});
let home=await loadHome(reader,id);assert.equal(home.meetings.length,1);assert.equal(home.tasks.length,2);assert.equal(home.hasAvailability,false);
assert.ok(home.tasks.some(t=>t.label==='Review payment'));assert.ok(home.tasks.some(t=>t.label==='Upload receipt'));
const paid=queries.find(q=>q.table==='paid_lesson_bookings');assert.ok(paid.filters.some(([k,v])=>k==='status'&&v==='confirmed'));
for(const q of queries.filter(q=>q.table==='paid_lesson_payments')) {
 assert.ok(q.filters.some(([k,v])=>k==='request.status'&&v==='accepted'));
 assert.ok(q.filters.some(([k,v])=>k==='request.booking.status'&&v==='reserved'));
 assert.ok(q.filters.some(([k,v])=>k.endsWith('_id')&&v===id));
 assert.match(q.selection,/request:paid_lesson_requests!request_id!inner.*booking:paid_lesson_bookings!request_id!inner/);
}
failedTable='paid_lesson_payments';home=await loadHome(reader,id);assert.equal(home.taskError,true);assert.equal(home.meetingError,false);
failedTable='exchange_sessions';home=await loadHome(reader,id);assert.equal(home.meetingError,true);
failedTable='';empty=true;home=await loadHome(reader,id);assert.equal(home.tasks.length,0);assert.equal(home.meetings.length,0);
const nav=readFileSync('components/layout/nav-links.tsx','utf8');
assert.match(nav,/label: "Home"/);assert.match(nav,/label: "Find a tutor"/);assert.doesNotMatch(nav,/href: "\/(skills|profile|notifications|forum)"/);
assert.match(readFileSync('components/layout/topbar.tsx','utf8'),/\/profile#availability/);
assert.doesNotMatch(readFileSync('app/(app)/dashboard/page.tsx','utf8'),/ProfileChecklist|RecommendedMatches|PendingRequests|SuggestedNextStep/);
const {LearningOptions}=load('components/lessons/learning-options.tsx',{
 'next/link':{__esModule:true,default:({href,children})=>React.createElement('a',{href},children)},
 '@/components/ui/button':{Button:({children})=>React.createElement(React.Fragment,null,children)},
 '@/lib/paid-lessons':{formatPhp:amount=>`PHP ${(amount/100).toFixed(2)}`},
});
const pair={mutual:true,teachesMe:[{id:1}],iTeachThem:[{id:2}],ready:true,offers:[{id,tutor_id:id,skill_id:1,price_centavos:10000}]};
function optionsHtml(options){return renderToStaticMarkup(React.createElement(LearningOptions,{tutorId:id,options}));}
assert.match(optionsHtml(pair),/Request free swap/);assert.doesNotMatch(optionsHtml(pair),/Request paid lesson/);
const skillLess={...pair,mutual:false,teachesMe:[],iTeachThem:[]};
assert.match(optionsHtml(skillLess),/Request paid lesson/);assert.doesNotMatch(optionsHtml(skillLess),/Request free swap/);
assert.doesNotMatch(optionsHtml({...skillLess,ready:false}),/Request paid lesson/);
assert.match(optionsHtml({...skillLess,offers:[]}),/No paid lesson is available/);
console.log('Guided navigation checks passed: role/state-specific actions, confirmed-only Home, bounded previews, explicit errors, optional skills, and retained account destinations.');
