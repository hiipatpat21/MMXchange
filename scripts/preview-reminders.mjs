// Actual reminder banner components, static fictional snapshots, no hosted data or timers.
import {readFileSync,readdirSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const require=createRequire(import.meta.url),h=React.createElement,cache=new Map();
const imports={
 'next/link':{__esModule:true,default:({href,children,...props})=>{delete props.prefetch;return h('a',{href,...props},children);}},
 'next/image':{__esModule:true,default:({src,alt,width,height,className})=>h('img',{src:`/public${src}`,alt,width,height,className})},
 'next/navigation':{usePathname:()=>'/dashboard'},
 '@/app/(app)/reminders/actions':{},'@/lib/reminder-browser':{},
};
function load(file){
 file=file.replaceAll(path.sep,'/');if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
 const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,Intl,URL,require:name=>{if(name in imports)return imports[name];if(name.startsWith('@/')){const stem=name.slice(2);return load([stem+'.tsx',stem+'.ts'].find(existsSync));}return require(name);}},{filename:file});return exports;
}
const {Sidebar}=load('components/layout/sidebar.tsx'),{NavLinks}=load('components/layout/nav-links.tsx'),{MeetingReminderBanner}=load('components/meetings/meeting-reminders.tsx');
const css=readdirSync('.next/static',{recursive:true}).filter(f=>f.endsWith('.css')).map(f=>`<link rel="stylesheet" href="/.next/static/${f.replaceAll(path.sep,'/')}">`).join('')+`<style>@font-face{font-family:"Plus Jakarta Sans";src:url("/public/fonts/plus-jakarta-sans-variable.ttf") format("truetype");font-weight:200 800}html{--font-jakarta:"Plus Jakarta Sans"}</style>`;
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',now=Date.now();
const first={kind:'exchange',id,title:'Python with Ren Santos',startsAt:new Date(now+299000).toISOString(),format:'online',venue:'https://meet.google.com/visual-preview',href:`/exchanges/${id}`};
const second={...first,kind:'paid',id:other,title:'Graphic design with Lia Cruz',format:'in_person',venue:'A public meeting place agreed by both students',startsAt:new Date(now+120000).toISOString(),href:`/lessons/${other}`};
mkdirSync('.taste-skill/preview',{recursive:true});
for(const mode of ['upcoming','two','started','long','error','empty']) {
 let meetings=mode==='two'?[first,second]:mode==='started'?[{...first,startsAt:new Date(now-65000).toISOString()}]:mode==='long'?[{...first,title:'Digital illustration and creative storytelling with Maria Alexandra de los Santos',venue:'https://'+'a'.repeat(63)+'.'+'b'.repeat(63)+'.invalid/room'}]:mode==='error'||mode==='empty'?[]:[first];
 const banner=h(MeetingReminderBanner,{snapshot:{meetings,now,error:mode==='error'?'Could not refresh reminders. Check Home for your meetings.':undefined},announcement:meetings.length?'Fictional reminder for layout inspection.':'',onDismiss:()=>{}});
 const tree=h('div',{className:'flex min-h-screen bg-background'},h(Sidebar),h('div',{className:'min-w-0 flex-1'},
  h('header',{className:'px-4 pt-4 lg:hidden'},h('p',{className:'font-semibold text-primary'},'MMXchange'),h('details',null,h('summary',{className:'min-h-11 py-3'},'Menu'),h(NavLinks))),
  h('main',{className:'app-content mx-auto w-full max-w-[1164px] px-4 py-6 sm:px-6 lg:px-8'},banner,h('section',{className:'mx-auto max-w-3xl space-y-3'},h('h1',{className:'page-heading'},'Home'),h('p',{className:'text-sm text-muted-foreground'},'Isolated visual fixture. Fictional meetings; controls do not save.'),h('p',null,'Your upcoming confirmed meeting remains available here as a fallback.')))));
 writeFileSync(`.taste-skill/preview/reminders-${mode}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange reminder fixture</title>${css}</head><body>${renderToStaticMarkup(tree)}</body></html>`);
}
console.log('Wrote upcoming, simultaneous, started, long, error and empty reminder fixtures.');
if(process.argv.includes('--serve')){
 const root=process.cwd();createServer((req,res)=>{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!['public','.next/static','.taste-skill/preview'].some(prefix=>filename.startsWith(path.resolve(root,prefix)+path.sep))||!existsSync(filename)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.css':'text/css','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(filename)]??'application/octet-stream'});res.end(readFileSync(filename));
 }).listen(4182,'127.0.0.1',()=>console.log('Reminder previews: http://127.0.0.1:4182/.taste-skill/preview/reminders-two.html'));
}
