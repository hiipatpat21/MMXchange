// Isolated visual fixtures; no Supabase credentials, writes or authenticated sessions.
// Run after npm run build: node scripts/preview-availability.mjs --serve
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url), h = React.createElement, cache = new Map();
const noAction = async () => null;
const fixtureNow=Date.now();
const fixtureTime=new Date(Math.ceil((fixtureNow+86400000)/1800000)*1800000).toISOString();
const fixtureDay=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(fixtureTime));
let pickerState=0;
const pickerValues=[fixtureDay,{slots:[fixtureTime],code:"ok"},fixtureTime,false];
const imports = {
  "react": {...React,useState:initial=>typeof initial === "string" && ["online","in_person"].includes(initial) ? [initial,()=>{}] : [pickerValues[pickerState++%4],()=>{}]},
  "@/app/(app)/profile/availability-actions": { changeAvailability: noAction },
  "@/app/(app)/exchanges/actions": { scheduleSession: noAction, rescheduleSession: noAction },
  "@/app/(app)/exchanges/slot-actions": { getSharedSlots: async()=>({slots:[fixtureTime],code:"ok"}) },
  "@/lib/supabase/server": { createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"11111111-1111-4111-8111-111111111111"}}})}}) },
  "@/lib/availability-data": { loadOwnAvailability:async()=>({windows:[{id:"a",weekday:1,start_minute:540,end_minute:720},{id:"b",weekday:3,start_minute:780,end_minute:1020}],dates:[{day:fixtureDay}],error:false,now:fixtureNow}) },
  "@/app/(app)/lessons/actions": { savePaidOffer: noAction, requestPaidLesson: noAction, changePaidLesson: noAction, submitLessonContent: noAction },
  "next/image": { default: props => { const imageProps = { ...props }; delete imageProps.priority; delete imageProps.unoptimized; return h("img", { ...imageProps, src: `/public${props.src}` }); } },
  "@/app/onboarding/actions": { saveSetupProfile: noAction, finishSetup: noAction },
  "@/app/(app)/profile/actions": { updateProfile: noAction },
  "@/app/(app)/skills/actions": { addSkill: noAction, removeSkill: noAction },
};
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(js, { exports, Intl, process: { env: {} }, require: name => {
    if (name in imports) return imports[name];
    if (name.startsWith("@/")) { const stem = name.slice(2); return load([stem + ".tsx", stem + ".ts"].find(existsSync)); }
    return require(name);
  } }, { filename: file });
  return exports;
}
const { ProfileAvailability }=load("components/availability/profile-availability.tsx");
const { ExchangeSessionForm }=load("components/exchanges/exchange-session-form.tsx");
const css = readdirSync(".next/static", { recursive: true }).filter(file => file.endsWith(".css")).map(file => `<link rel="stylesheet" href="/.next/static/${file.replaceAll(path.sep, "/")}">`).join("") + `<style>@font-face{font-family:"Plus Jakarta Sans";src:url("/public/fonts/plus-jakarta-sans-variable.ttf") format("truetype");font-weight:200 800}html{--font-jakarta:"Plus Jakarta Sans"}</style>`;
const id="11111111-1111-4111-8111-111111111111";
const tree=h("main",{className:"mx-auto max-w-2xl space-y-7 px-4 py-8 sm:px-6"},h("header",{className:"space-y-2"},h("p",{className:"font-semibold text-primary"},"MMXchange"),h("h1",{className:"text-2xl font-semibold"},"Shared hours and meetings"),h("p",{className:"text-sm"},"Isolated visual fixture with fictional hours. Controls do not save; the slot result is a static sample.")),
 await ProfileAvailability(),
 h("section",{className:"space-y-4 rounded-xl border bg-card p-5"},h("h2",{className:"text-xl font-semibold"},"Choose a shared hour"),h(ExchangeSessionForm,{exchangeId:id,teachers:[{id,name:"Lia Cruz",skillName:"Graphic Design"},{id:"22222222-2222-4222-8222-222222222222",name:"Ren Santos",skillName:"Python"}],now:fixtureNow})));
mkdirSync(".taste-skill/preview",{recursive:true});
writeFileSync(".taste-skill/preview/availability.html",`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange availability fixture</title>${css}</head><body>${renderToStaticMarkup(tree)}</body></html>`);
console.log("Wrote isolated availability and shared-slot fixtures.");
if (process.argv.includes("--serve")) {
  const root = process.cwd();
  createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    const filename = path.resolve(root, "." + decodeURIComponent(url.pathname));
    const allowed = ["public", ".next/static", ".taste-skill/preview"].some(prefix => filename.startsWith(path.resolve(root, prefix) + path.sep));
    if (!allowed || !existsSync(filename)) { response.writeHead(404); response.end(); return; }
    const type = { ".html": "text/html", ".css": "text/css", ".webp": "image/webp", ".ttf": "font/ttf" }[path.extname(filename)] ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": type }); response.end(readFileSync(filename));
  }).listen(4177, "127.0.0.1", () => console.log("Preview: http://127.0.0.1:4177/.taste-skill/preview/availability.html"));
}
