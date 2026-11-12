// Mocked checks only. Hosted RLS/SQL/concurrency checks are separate.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require=createRequire(import.meta.url);
function load(file,imports={}) {
 const exports={}; const js=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(js,{exports,Intl,require:name=>name in imports?imports[name]:require(name)},{filename:file}); return exports;
}
const relations=load("lib/relations.ts");
const lib=load("lib/paid-lessons.ts",{"@/lib/relations":relations});
for(const [php,expected] of [["0.01",1],["1.1",110],["10000.00",1000000],[" 250.50 ",25050]]) assert.equal(lib.parsePhp(php),expected);
for(const php of ["0","-1","1.001","1e2","10000.01","Infinity","1,000","", "01.00"]) assert.equal(lib.parsePhp(php),null);
assert.ok(lib.formatPhp(1050).includes("10.50"));
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222",c="33333333-3333-4333-8333-333333333333",offer="44444444-4444-4444-8444-444444444444";
let skillRows=[{profile_id:a,skill_id:1,kind:"teach",skills:{name:"Design"}},{profile_id:a,skill_id:2,kind:"learn",skills:{name:"Python"}},{profile_id:b,skill_id:2,kind:"teach",skills:{name:"Python"}},{profile_id:b,skill_id:1,kind:"learn",skills:{name:"Design"}}];
let queryFailed=false;
const reader={from:table=>{const query={select:()=>query,in:()=>query,eq:()=>query,order:()=>query,range:async()=>({data:table==="profile_skills"?skillRows:[{id:offer,tutor_id:b,skill_id:2,price_centavos:10000,enabled:true}],error:queryFailed?{}:null}),single:async()=>({data:{paid_requests_enabled:true},error:queryFailed?{}:null})};return query;}};
let options=(await lib.loadLearningOptions(reader,a,[b])).get(b);
assert.equal(options.mutual,true);assert.equal(options.teachesMe[0].id,2);assert.equal(options.iTeachThem[0].id,1);
options=(await lib.loadLearningOptions(reader,c,[b])).get(b);
assert.equal(options.mutual,false);assert.equal(options.offers.length,1);assert.equal(options.ready,false);
skillRows.push({profile_id:c,skill_id:3,kind:"teach",skills:{name:"Guitar"}});
assert.equal((await lib.loadLearningOptions(reader,c,[b])).get(b).mutual,false);
queryFailed=true;await assert.rejects(lib.loadLearningOptions(reader,a,[b]));queryFailed=false;
let signedIn=true,code="ok",failed=false;
const calls=[],invalidated=[];
const client={auth:{getUser:async()=>({data:{user:signedIn?{id:a}:null}})},rpc:async(name,args)=>{calls.push({name,args});return {data:code,error:failed?{}:null};}};
function actions(ready=lib.PAID_BOOKING_READY) {return load("app/(app)/lessons/actions.ts",{"@/lib/paid-lessons":{...lib,PAID_BOOKING_READY:ready},"@/lib/supabase/server":{createClient:async()=>client},"next/cache":{revalidatePath:(...args)=>invalidated.push(args)},"next/navigation":{redirect:route=>{throw new Error(`REDIRECT:${route}`)}}});}
const form=values=>{const data=new FormData();for(const[key,value]of Object.entries(values))data.set(key,value);return data;};
const act=actions();
assert.ok((await act.savePaidOffer(null,form({skill:2,price:"1.001",enabled:"on"}))).error);assert.equal(calls.length,0);
assert.ok((await act.savePaidOffer(null,form({skill:2,price:"250.50",enabled:"on",tutor_id:b}))).message);
assert.equal(calls.at(-1).args.p_price,25050);assert.equal("tutor_id" in calls.at(-1).args,false);
assert.ok((await act.requestPaidLesson(null,form({offer,price:10000,message:"Please teach Python"}))).error);assert.equal(calls.at(-1).name,"save_paid_lesson_offer");
signedIn=false;const count=calls.length;assert.ok((await act.changePaidLesson(null,form({id:offer,action:"accept",price:10000}))).error);assert.equal(calls.length,count);signedIn=true;
for(code of ["price_changed","not_teaching","not_allowed","invalid_transition","meeting_not_ready"]) {
 const before=invalidated.length;assert.ok((await act.changePaidLesson(null,form({id:offer,action:"accept",price:10000}))).error);assert.equal(invalidated.length,before);
}
code="ok";
assert.ok((await act.changePaidLesson(null,form({id:offer,action:"confirm_payment",price:10000}))).error);
await act.changePaidLesson(null,form({id:offer,action:"complete",learner_id:b}));assert.equal(calls.at(-1).name,"complete_paid_lesson");assert.deepEqual(Object.keys(calls.at(-1).args),["p_request"]);
await act.submitLessonContent(null,form({id:offer,kind:"message",body:"Hello",sender_id:b}));assert.equal(calls.at(-1).name,"send_paid_lesson_message");assert.equal("sender_id"in calls.at(-1).args,false);
assert.ok((await act.submitLessonContent(null,form({id:offer,kind:"review",body:"",rating:6}))).error);
await act.submitLessonContent(null,form({id:offer,kind:"review",body:"Helpful",rating:5}));assert.equal(calls.at(-1).name,"submit_paid_lesson_review");
// Future UI-ready branch still sends expected price only; SQL owns the actual price/identity.
const future=actions(true);code="price_changed";assert.ok((await future.requestPaidLesson(null,form({offer,price:1,message:"Please teach Python"}))).error);
code=`ok:${offer}`;await assert.rejects(future.requestPaidLesson(null,form({offer,price:10000,message:"Please teach Python",learner_id:b})),/REDIRECT:/);
assert.equal("learner_id" in calls.at(-1).args,false);
failed=true;assert.ok((await act.savePaidOffer(null,form({skill:2,price:"100",enabled:"on"}))).error);
failed=false;code="not_complementary";
const swaps=load("app/(app)/exchanges/actions.ts",{"@/lib/supabase/server":{createClient:async()=>client},"@/lib/datetime":load("lib/datetime.ts"),"next/cache":{revalidatePath:(...args)=>invalidated.push(args)},"next/navigation":{redirect:route=>{throw new Error(`REDIRECT:${route}`)}}});
const before=invalidated.length;
const rejected=await swaps.createExchangeRequest(null,form({recipientId:b,learnSkillId:2,teachSkillId:3,message:"Please swap skills with me",format:"online",mode:"free",requester_id:c,amount:0}));
assert.match(rejected.error,/no longer match/);
assert.equal(invalidated.length,before);
assert.equal(calls.at(-1).name,"create_exchange_request");
assert.equal("requester_id"in calls.at(-1).args,false);
assert.equal("amount"in calls.at(-1).args,false);
console.log("Paid lesson mocked checks passed: exact centavos, complementary pairs, skill-less browsing, rollout gate, auth identity, stale/denied actions, messaging and review validation.");
