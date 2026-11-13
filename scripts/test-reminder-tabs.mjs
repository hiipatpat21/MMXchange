// Optional real-browser integration check using the installed design-taste browser helper.
// Serves fictional data on loopback only. Never contacts hosted Supabase or an external meeting.
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createServer} from "node:http";
import {resolve,join} from "node:path";
import {pathToFileURL} from "node:url";
import ts from "typescript";
const helper=join(process.env.USERPROFILE??process.env.HOME??'','.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs');
if(!existsSync(helper))throw Error('Optional browser check needs the installed design-taste skill. Run the deterministic reminder tests on other machines.');
const {Browser}=await import(pathToFileURL(helper).href);
const modules=new Map();
for(const name of ['meeting-reminders','reminder-storage','reminder-browser','datetime']) {
 let code=ts.transpileModule(readFileSync(resolve(`lib/${name}.ts`),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
 code=code.replaceAll(/@\/lib\/([a-z-]+)/g,'./$1.js');modules.set(`/${name}.js`,code);
}
const user='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
let start=new Date(Date.now()+180000).toISOString(),cancelled=false;
const html=`<!doctype html><html lang="en"><body><h1>Isolated reminder controller test</h1><p>Fictional records. No external navigation.</p><script type="module">
 import {startMeetingReminders} from './reminder-browser.js';
 window.snapshots=[];window.announcements=[];
 window.controller=startMeetingReminders('${user}',()=>fetch('/feed',{cache:'no-store'}).then(r=>r.json()),v=>{window.snapshot=v;window.snapshots.push(v);},v=>{if(v)window.announcements.push(v);});
 </script></body></html>`;
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;res.setHeader('Cache-Control','no-store');
 if(path==='/feed'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'ok',userId:user,serverNow:Date.now(),meetings:cancelled?[]:[{kind:'exchange',id,title:'Python',startsAt:start,format:'online',venue:'https://meet.example.com/fixture',href:`/exchanges/${id}`}]}));}
 else if(modules.has(path)){res.setHeader('Content-Type','text/javascript');res.end(modules.get(path));}
 else if(path==='/'){res.setHeader('Content-Type','text/html');res.end(html);}
 else{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}/`,browser=await Browser.launch();
async function until(test,message){for(let i=0;i<60;i++){if(await test())return;await new Promise(done=>setTimeout(done,100));}throw Error(message);}
try {
 const a=await browser.newPage(),b=await browser.newPage();await a.goto(url);await b.goto(url);
 await until(async()=>((await a.eval(()=>window.snapshot?.meetings.length??0))+(await b.eval(()=>window.snapshot?.meetings.length??0)))===1,'Two tabs failed to elect one visible banner');
 const leader=(await a.eval(()=>window.snapshot?.meetings.length??0))?a:b,other=leader===a?b:a;
 assert.equal(await leader.eval(()=>window.announcements.length),1);assert.equal(await other.eval(()=>window.announcements.length),0);
 await leader.eval(()=>window.controller.dismiss(window.snapshot.meetings[0]));
 await until(async()=>(await leader.eval(()=>window.snapshot.meetings.length))===0,'Dismissal did not hide the banner');
 await a.eval(()=>window.controller.stop());await b.eval(()=>window.controller.stop());
 await a.goto(url);
 await until(async()=>await a.eval(()=>!!window.snapshot),'Reload never refreshed');
 assert.equal(await a.eval(()=>window.snapshot.meetings.length),0);assert.equal(await a.eval(()=>window.announcements.length),0);
 start=new Date(Date.now()+240000).toISOString();await a.eval(()=>window.dispatchEvent(new Event('online')));
 await until(async()=>(await a.eval(()=>window.snapshot.meetings.length))===1,'Rescheduled occurrence did not show');
 assert.equal(await a.eval(()=>window.announcements.length),1);
 await a.eval(()=>{const real=Date.now;Date.now=()=>real()+7*3600000;});
 assert.ok(Math.abs((await a.eval(()=>window.snapshot.now))-Date.now())<4000,'Countdown followed skewed browser wall time');
 cancelled=true;await a.eval(()=>window.dispatchEvent(new Event('online')));
 await until(async()=>(await a.eval(()=>window.snapshot.meetings.length))===0,'Cancellation did not clear the banner');
 await a.eval(()=>window.controller.stop());
 console.log('Real Chrome tab checks passed: one owner/banner, reload dismissal, rescheduled occurrence, wall-clock skew and cancellation reconciliation.');
} finally {await browser.close();await new Promise(done=>server.close(done));}
