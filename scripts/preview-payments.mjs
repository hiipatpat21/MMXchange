// Isolated real-component fixture. No credentials, transfers, Storage calls or writes.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToReadableStream } from "react-dom/server";
const require=createRequire(import.meta.url),h=React.createElement,cache=new Map();
const id="11111111-1111-4111-8111-111111111111",tutor="22222222-2222-4222-8222-222222222222",asset="33333333-3333-4333-8333-333333333333";
const starts=new Date(Date.now()+86400000).toISOString(),submitted=new Date().toISOString();
const result=data=>({data,error:null});
const client={auth:{getUser:async()=>({data:{user:{id:tutor}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>result({qr_asset_id:asset,instructions:"Please check the recipient name before sending."})})})})};
const imports={
 "@/app/(app)/lessons/payment-actions":{uploadPaymentImage:async()=>null,changeLessonPayment:async()=>null},
 "@/lib/supabase/server":{createClient:async()=>client},
 "@/lib/payment-images":{paymentImageUrl:async()=>null},
};
function load(file){
 file=file.replaceAll(path.sep,"/");
 if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
 const js=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,Intl,require:name=>{
  if(name in imports)return imports[name];
  if(name.startsWith("@/")){const stem=name.slice(2);return load([stem+".tsx",stem+".ts"].find(existsSync));}
  if(name.startsWith("./")){const stem=path.join(path.dirname(file),name);return load([stem+".tsx",stem+".ts"].find(existsSync));}
  return require(name);
 }},{filename:file});return exports;
}
imports["@/lib/lesson-payments"]={...load("lib/lesson-payments.ts"),loadLessonPaymentDetails:async()=>({
 request:result({learner_id:id,tutor_id:tutor,status:"accepted"}),
 payment:result({status:"submitted",amount_centavos:15000,qr_asset_id:asset,instructions_snapshot:"Check the recipient name before sending. Include this lesson topic in your transfer note.",latest_receipt_id:id}),
 booking:result({starts_at:starts,status:"reserved"}),
 history:result([{id,asset_id:asset,status:"submitted",created_at:submitted,reviewed_at:null,rejection_reason:null}]),now:Date.now(),
})};
// An explicitly labelled, non-payable fixture replaces images, never a fake bank receipt.
imports["@/components/lessons/payment-image"]={PaymentImage:({label})=>h("div",{className:"flex h-40 w-40 items-center justify-center rounded-lg border bg-white p-4 text-center text-sm text-muted-foreground",role:"img","aria-label":`${label} visual fixture`},`${label} · non-payable sample`)};
// Relative imports used by the composed components resolve to the same fixture.
cache.set("components/lessons/payment-image.tsx",imports["@/components/lessons/payment-image"]);
const {PaymentPanel}=load("components/lessons/payment-panel.tsx"),{PaymentSetup}=load("components/lessons/payment-setup.tsx"),{PaymentUploadForm}=load("components/lessons/payment-forms.tsx");
const css=readdirSync(".next/static",{recursive:true}).filter(file=>file.endsWith(".css")).map(file=>`<link rel="stylesheet" href="/.next/static/${file.replaceAll(path.sep,"/")}">`).join("")+`<style>@font-face{font-family:"Plus Jakarta Sans";src:url("/public/fonts/plus-jakarta-sans-variable.ttf") format("truetype");font-weight:200 800}html{--font-jakarta:"Plus Jakarta Sans"}</style>`;
const tree=h("main",{className:"mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6"},h("header",{className:"space-y-2"},h("p",{className:"font-semibold text-primary"},"MMXchange"),h("h1",{className:"text-2xl font-semibold"},"Lesson payment"),h("p",{className:"text-sm"},"Isolated visual fixture. Controls do not save and sample images cannot receive payment.")),await PaymentPanel({id}),h("section",{className:"space-y-4 rounded-xl border bg-card p-5"},h("h2",{className:"text-xl font-semibold"},"Learner receipt upload"),h(PaymentUploadForm,{kind:"receipt",id})),await PaymentSetup());
const stream=await renderToReadableStream(tree);await stream.allReady;
mkdirSync(".taste-skill/preview",{recursive:true});
writeFileSync(".taste-skill/preview/payments.html",`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange payment fixture</title>${css}</head><body>${await new Response(stream).text()}</body></html>`);
console.log("Wrote isolated payment component fixture.");
if(process.argv.includes("--serve")){
 const root=process.cwd();createServer((request,response)=>{
  const url=new URL(request.url,"http://localhost"),filename=path.resolve(root,"."+decodeURIComponent(url.pathname));
  const allowed=["public",".next/static",".taste-skill/preview"].some(prefix=>filename.startsWith(path.resolve(root,prefix)+path.sep));
  if(!allowed||!existsSync(filename)){response.writeHead(404);response.end();return;}
  const type={".html":"text/html",".css":"text/css",".ttf":"font/ttf"}[path.extname(filename)]??"application/octet-stream";
  response.writeHead(200,{"Content-Type":type});response.end(readFileSync(filename));
 }).listen(4179,"127.0.0.1",()=>console.log("Preview: http://127.0.0.1:4179/.taste-skill/preview/payments.html"));
}
