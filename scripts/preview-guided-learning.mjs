// Actual components with isolated, explicitly fictional data. No credentials or writes.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require=createRequire(import.meta.url),h=React.createElement,cache=new Map();
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
let mode='home';
const at=new Date(Date.now()+86400000).toISOString();
const rows=[{id,learner_id:id,tutor_id:other,skill_id:1,skill_name:'Python',status:'accepted',agreed_price_centavos:15000,quoted_price_centavos:15000,tutor:{display_name:'Ren Santos'},learner:{display_name:'Lia Cruz'},learner_completed_at:null,tutor_completed_at:null},
 {id:other,learner_id:other,tutor_id:id,skill_id:2,skill_name:'Graphic design',status:'accepted',agreed_price_centavos:1000000,quoted_price_centavos:1000000,tutor:{display_name:'Lia Cruz'},learner:{display_name:'Ren Santos'},learner_completed_at:null,tutor_completed_at:null}];
const client={auth:{getUser:async()=>({data:{user:{id}}})},from:()=>{const q={select:()=>q,not:()=>q,order:()=>q,range:async()=>({data:rows,error:null})};return q;}};
const imports={
 'next/link':{__esModule:true,default:({href,children,...props})=>{delete props.prefetch;return h('a',{...props,href},children);}},
 'next/image':{__esModule:true,default:({src,alt,width,height,className})=>h('img',{src:`/public${src}`,alt,width,height,className})},
 'next/navigation':{usePathname:()=>'/dashboard',redirect:()=>{throw Error('Unexpected preview redirect');}},
 '@/lib/dashboard':{getDashboardContext:async()=>({supabase:client,user:{id}})},
 '@/lib/supabase/server':{createClient:async()=>client},
 '@/components/messages/refresh-button':{RefreshButton:()=>h('button',{type:'button',className:'min-h-11 rounded-xl border px-4'},'Refresh')},
 '@/lib/home':{loadHome:async()=>({
  meetings:mode==='empty'||mode==='error'?[]:[{id,title:mode==='long'?'Advanced illustration and digital storytelling with an exceptionally long workshop topic':'Python',at,kind:'Paid lesson',format:'online',venue:'https://meet.google.com/visual-preview',href:`/lessons/${id}#meeting`}],
  tasks:mode==='empty'||mode==='error'?[]:[{id,title:mode==='long'?'Graphic design with Maria Alexandra de los Santos and a very long learning goal':'Graphic design',label:'Review payment',href:`/lessons/${id}#payment`},{id:other,title:'Skill swap with Ren Santos',label:'Review request',href:`/exchanges/${other}`}],
  meetingError:mode==='error',taskError:mode==='error',hasAvailability:mode!=='empty',availabilityError:false,
 })},
 '@/lib/lesson-list-state':{loadLessonListState:async()=>({bookings:rows.map(r=>({request_id:r.id,status:'reserved',starts_at:at})),payments:[{request_id:id,status:'rejected'},{request_id:other,status:'submitted'}],error:false,now:Date.now()})},
};
function load(file){
 file=file.replaceAll(path.sep,'/');if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
 const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,Intl,URL,require:name=>{if(name in imports)return imports[name];if(name.startsWith('@/')){const stem=name.slice(2);return load([stem+'.tsx',stem+'.ts'].find(existsSync));}return require(name);}},{filename:file});return exports;
}
const {Sidebar}=load('components/layout/sidebar.tsx'),{NavLinks}=load('components/layout/nav-links.tsx'),{HomeOverview}=load('components/dashboard/home-overview.tsx');
const {LearningOptions}=load('components/lessons/learning-options.tsx'),{StudentFiltersForm}=load('components/students/student-filters.tsx'),{PaidLessonList}=load('components/lessons/lesson-list.tsx');
const {MeetingLocation}=load('components/meetings/meeting-location.tsx');
const {DashboardSkeleton}=load('components/dashboard/dashboard-section.tsx');
const css=readdirSync('.next/static',{recursive:true}).filter(f=>f.endsWith('.css')).map(f=>`<link rel="stylesheet" href="/.next/static/${f.replaceAll(path.sep,'/')}">`).join('')+`<style>@font-face{font-family:"Plus Jakarta Sans";src:url("/public/fonts/plus-jakarta-sans-variable.ttf") format("truetype");font-weight:200 800}html{--font-jakarta:"Plus Jakarta Sans"}</style>`;
mkdirSync('.taste-skill/preview',{recursive:true});
for(mode of ['home','empty','error','long','loading','discovery','lessons','meeting-links']) {
 let content;
 if(mode==='meeting-links')content=h('div',{className:'space-y-4'},...[
  {title:'Confirmed online meeting',format:'online',venue:'https://meet.google.com/visual-preview',state:'confirmed'},
  {title:'Reserved paid lesson',format:'online',venue:'https://meet.google.com/visual-preview',state:'reserved'},
  {title:'In-person meeting',format:'in_person',venue:'A public place agreed by both participants',state:'confirmed'},
  {title:'Legacy text to update',format:'online',venue:'Message me for the link <script>not HTML</script>',state:'confirmed',editHref:'#edit-fixture'},
  {title:'Long host',format:'online',venue:'https://'+ 'a'.repeat(63)+'.'+ 'b'.repeat(63)+'.invalid/room',state:'confirmed'},
 ].map(({title,...props})=>h('section',{key:title,className:'space-y-2 rounded-xl border bg-card p-5'},h('h2',{className:'text-lg font-semibold'},title),h(MeetingLocation,props))));
 else if(mode==='discovery')content=h('div',{className:'space-y-5'},h(StudentFiltersForm,{filters:{q:'',skill:'',category:'',college:''},skills:[{id:1,name:'Python',category:'Technology'},{id:2,name:'Graphic design',category:'Creative'}]}),h('div',{className:'grid items-start gap-4 md:grid-cols-2'},...[true,false].map(mutual=>h('section',{key:String(mutual),className:'space-y-3 rounded-xl border bg-card p-5'},h('h2',{className:'text-lg font-semibold'},'Ren Santos'),h(LearningOptions,{tutorId:other,options:{mutual,teachesMe:[{id:1,name:'Python'}],iTeachThem:[{id:2,name:'Design'}],ready:true,offers:[{id,tutor_id:other,skill_id:1,price_centavos:15000,enabled:true,skill_name:'Python'}]}})))));
 else if(mode==='lessons')content=await PaidLessonList({});
 else if(mode==='loading')content=h(React.Fragment,null,h(DashboardSkeleton,{title:'Your next meeting'}),h(DashboardSkeleton,{title:'Needs your attention'}));
 else content=await HomeOverview();
 const title=mode==='meeting-links'?'Meeting details':mode==='discovery'?'Find a tutor':mode==='lessons'?'My learning':'Home';
 const tree=h('div',{className:'flex min-h-screen bg-background'},h(Sidebar),h('div',{className:'min-w-0 flex-1'},
  h('header',{className:'px-4 pt-4 lg:hidden'},h('p',{className:'font-semibold text-primary'},'MMXchange'),h('details',null,h('summary',{className:'min-h-11 py-3'},'Menu'),h(NavLinks))),
  h('main',{className:'mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6'},h('header',{className:'space-y-2'},h('h1',{className:'page-heading'},title),h('p',{className:'text-sm text-muted-foreground'},'Isolated visual fixture. Fictional records; controls do not save.')),content)));
 writeFileSync(`.taste-skill/preview/guided-${mode}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange ${title} preview</title>${css}</head><body>${renderToStaticMarkup(tree)}</body></html>`);
}
console.log('Wrote Home, empty, error, long, loading, discovery and paid-lesson fixtures.');
if(process.argv.includes('--serve')){
 const root=process.cwd();createServer((request,response)=>{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!['public','.next/static','.taste-skill/preview'].some(prefix=>filename.startsWith(path.resolve(root,prefix)+path.sep))||!existsSync(filename)){response.writeHead(404);response.end();return;}
  response.writeHead(200,{'Content-Type':({'.html':'text/html','.css':'text/css','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(filename)]??'application/octet-stream'});response.end(readFileSync(filename));
 }).listen(4181,'127.0.0.1',()=>console.log('Preview server: http://127.0.0.1:4181/.taste-skill/preview/guided-home.html'));
}
