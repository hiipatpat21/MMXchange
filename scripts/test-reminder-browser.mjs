// Deterministic browser/timer simulation for polling and cross-tab behavior. No network.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require=createRequire(import.meta.url);
function module(file,imports={},globals={}) {
 const exports={};const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(js,{exports,Intl,...globals,require:name=>name in imports?imports[name]:require(name)},{filename:file});return exports;
}
const lib=module('lib/meeting-reminders.ts'),storageLib=module('lib/reminder-storage.ts',{'@/lib/meeting-reminders':lib});
const datetime=module('lib/datetime.ts');
const user='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
const base=Date.parse('2026-11-13T00:00:00Z');
const meeting={kind:'exchange',id,title:'Python',startsAt:new Date(base+300000).toISOString(),format:'online',venue:'https://meet.example.com/room',href:`/exchanges/${id}#sessions-heading`};
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
function environment({locks=true,storageBlocked=false}={}) {
 let mono=1000,wall=base,timerId=0,tabId=0;
 const timers=new Map(),values=new Map(),tabs=[],held=new Map();
 const lockManager={request:async(name,_options,callback)=>{
  if(held.has(name))return callback(null);
  held.set(name,true);try{return await callback({name});}finally{held.delete(name);}
 }};
 function timer(fn,delay,interval=false){const id=++timerId;timers.set(id,{fn,at:mono+delay,delay,interval});return id;}
 function tab(load) {
  const document=new EventTarget();document.visibilityState='visible';
  const window=new EventTarget(),owner='tab-'+(++tabId),snapshots=[],announcements=[];
  window.localStorage={getItem:key=>{if(storageBlocked)throw Error('blocked');return values.get(key)??null;},setItem:(key,value)=>{
   if(storageBlocked)throw Error('blocked');values.set(key,value);
   queueMicrotask(()=>{for(const t of tabs)if(t.window!==window){const e=new Event('storage');Object.defineProperty(e,'key',{value:key});t.window.dispatchEvent(e);}});
  },removeItem:key=>{values.delete(key);queueMicrotask(()=>{for(const t of tabs)if(t.window!==window){const e=new Event('storage');Object.defineProperty(e,'key',{value:key});t.window.dispatchEvent(e);}});}};
  class Clock extends Date {static now(){return wall;}}
  const runtime=module('lib/reminder-browser.ts',{'@/lib/meeting-reminders':lib,'@/lib/reminder-storage':storageLib,'@/lib/datetime':datetime},{
   window,document,navigator:locks?{locks:lockManager}:{},performance:{now:()=>mono},crypto:{randomUUID:()=>owner},Date:Clock,
   setTimeout:(fn,ms)=>timer(fn,ms),clearTimeout:n=>timers.delete(n),setInterval:(fn,ms)=>timer(fn,ms,true),clearInterval:n=>timers.delete(n),
  });
  const t={window,document,snapshots,announcements,calls:0,
   start(){this.control=runtime.startMeetingReminders(user,async()=>{this.calls++;return load();},value=>snapshots.push(value),value=>announcements.push(value));},
   hide(){document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));},
   show(){document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));},
   get latest(){return snapshots.at(-1);},get spoken(){return announcements.filter(Boolean);},
  };
  tabs.push(t);return t;
 }
 async function advance(ms) {
  const end=mono+ms;let steps=0;
  while(true){
   const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;
   assert.ok(++steps<10000,'Timer loop/request storm');
   const [id,t]=next,delta=t.at-mono;mono=t.at;wall+=delta;
   if(t.interval)t.at+=t.delay;else timers.delete(id);
   t.fn();await flush();
  }
  wall+=end-mono;mono=end;await flush();
 }
 return {tab,advance,flush,values,serverNow:()=>base+mono-1000,skew:ms=>{wall+=ms;},timerCount:()=>timers.size};
}

// Two visible tabs: one poller/banner, one durable announcement, dismissal survives reload.
{
 const e=environment();let meetings=[meeting];
 const response=()=>({status:'ok',userId:user,serverNow:e.serverNow(),meetings});
 const a=e.tab(response),b=e.tab(response);a.start();b.start();await flush();
 assert.equal(a.calls+b.calls,1);assert.equal(a.latest.meetings.length,1);assert.equal(b.latest?.meetings.length??0,0);assert.equal(a.spoken.length,1);
 await e.advance(30000);assert.equal(a.calls,2);assert.equal(a.spoken.length,1);
 e.skew(7*3600000);await e.advance(1000);assert.ok(Math.abs(a.latest.now-e.serverNow())<10,'Countdown used the local wall clock');
 a.control.dismiss(meeting);await flush();assert.equal(a.latest.meetings.length,0);
 a.control.stop();await flush();b.control.stop();await flush();
 const reload=e.tab(response);reload.start();await flush();assert.equal(reload.latest.meetings.length,0);assert.equal(reload.spoken.length,0);
 meetings=[{...meeting,startsAt:new Date(e.serverNow()+180000).toISOString()}];
 await e.advance(30000);assert.equal(reload.latest.meetings.length,1);assert.equal(reload.spoken.length,1,'Reschedule did not create a new occurrence');
 meetings=[];await e.advance(30000);assert.equal(reload.latest.meetings.length,0,'Cancellation did not reconcile');
 reload.control.stop();assert.equal(e.timerCount(),0);
}

// Hidden tabs release leadership and stop polling; the new visible owner does not reannounce.
{
 const e=environment(),response=()=>({status:'ok',userId:user,serverNow:e.serverNow(),meetings:[meeting]});
 const a=e.tab(response),b=e.tab(response);a.start();b.start();await flush();a.hide();await flush();
 await e.advance(5000);assert.equal(a.latest.meetings.length,0);assert.equal(a.calls,1);assert.equal(b.latest.meetings.length,1);assert.equal(b.spoken.length,0);
 b.hide();await e.advance(60000);assert.equal(a.calls,1);assert.equal(b.calls,1);
 a.show();await flush();assert.equal(a.calls,2);assert.equal(a.latest.meetings.length,1);assert.equal(a.spoken.length,1);
 a.control.stop();b.control.stop();
}

// Six minutes -> five minutes -> started -> one hour; multiple due meetings share a snapshot.
{
 const e=environment(),start=base+360000;
 const items=[{...meeting,startsAt:new Date(start).toISOString()},{...meeting,kind:'paid',id:user,title:'Design',startsAt:new Date(start).toISOString()}];
 const a=e.tab(()=>({status:'ok',userId:user,serverNow:e.serverNow(),meetings:items.filter(m=>lib.reminderTiming(m.startsAt,e.serverNow()))}));
 a.start();await flush();assert.equal(a.latest.meetings.length,0);
 await e.advance(60000);assert.equal(a.latest.meetings.length,2);assert.equal(a.spoken.length,1);
 await e.advance(300000);assert.equal(lib.reminderTiming(items[0].startsAt,a.latest.now).phase,'started');assert.equal(a.spoken.length,1);
 await e.advance(3600000);assert.equal(a.latest.meetings.length,0);a.control.stop();
}

// Network failures clear links, back off and do not reannounce on recovery; expiry stops requests.
{
 const e=environment();let status='ok';
 const a=e.tab(()=>{if(status==='network')throw Error('offline');return status==='ok'?{status:'ok',userId:user,serverNow:e.serverNow(),meetings:[meeting]}:{status};});
 a.start();await flush();status='network';await e.advance(30000);assert.equal(a.latest.meetings.length,0);assert.match(a.latest.error,/Could not refresh/);
 await e.advance(30000);assert.equal(a.calls,2);assert.match(a.latest.error,/Could not refresh/);
 await e.advance(30000);assert.equal(a.calls,3);status='ok';a.window.dispatchEvent(new Event('online'));await flush();assert.equal(a.latest.meetings.length,1);assert.equal(a.spoken.length,1);
 status='unauthenticated';await e.advance(30000);const calls=a.calls;assert.equal(a.latest.meetings.length,0);await e.advance(300000);assert.equal(a.calls,calls);a.control.stop();
}

// Late/stale results and a different signed-in account never render the old user's links.
{
 const e=environment();let resolve;
 const a=e.tab(()=>new Promise(done=>{resolve=done;}));a.start();await flush();a.hide();
 resolve({status:'ok',userId:user,serverNow:e.serverNow(),meetings:[meeting]});await flush();assert.equal(a.latest.meetings.length,0);a.control.stop();
 const b=e.tab(()=>({status:'ok',userId:id,serverNow:e.serverNow(),meetings:[meeting]}));b.start();await flush();assert.equal(b.latest.meetings.length,0);assert.match(b.latest.error,/Sign in again/);b.control.stop();
}

// A hanging request cannot keep stale join links visible or start overlapping requests.
{
 const e=environment();let resolve,hang=false;
 const a=e.tab(()=>hang?new Promise(done=>{resolve=done;}):{status:'ok',userId:user,serverNow:e.serverNow(),meetings:[meeting]});
 a.start();await flush();hang=true;await e.advance(90000);assert.equal(a.calls,2);assert.equal(a.latest.meetings.length,0);
 resolve({status:'ok',userId:user,serverNow:e.serverNow(),meetings:[meeting]});await flush();assert.equal(a.latest.meetings.length,0);assert.match(a.latest.error,/Could not refresh/);a.control.stop();
}

// No Web Locks: the storage lease elects one tab; blocked storage disables polling safely.
{
 const e=environment({locks:false}),response=()=>({status:'ok',userId:user,serverNow:e.serverNow(),meetings:[meeting]});
 const a=e.tab(response),b=e.tab(response);a.start();b.start();await e.advance(200);assert.equal(a.calls+b.calls,1);
 a.hide();await flush();await e.advance(200);assert.equal(b.calls,1);assert.equal(b.spoken.length,0);a.control.stop();b.control.stop();
 const blocked=environment({storageBlocked:true}),c=blocked.tab(response);c.start();await flush();assert.equal(c.calls,0);assert.match(c.latest.error,/unavailable/);c.control.stop();
}
console.log('Reminder browser simulation passed: one tab owner, reload/dismissal/reschedule, visibility/resume, skew, boundaries, batching, network backoff, expiry, stale/account-mismatched results and storage fallback.');
