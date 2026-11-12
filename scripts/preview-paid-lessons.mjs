// Isolated visual fixtures; no Supabase credentials, writes or authenticated sessions.
// Run after npm run build: node scripts/preview-paid-lessons.mjs --serve
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
const imports = {
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
const { StudentCard } = load("components/students/student-card.tsx");
const { LearningOptions } = load("components/lessons/learning-options.tsx");
const { OfferForm } = load("components/lessons/offer-form.tsx");
const { LessonComposer } = load("components/lessons/lesson-composer.tsx");
const css = readdirSync(".next/static", { recursive: true }).filter(file => file.endsWith(".css")).map(file => `<link rel="stylesheet" href="/.next/static/${file.replaceAll(path.sep, "/")}">`).join("") + `<style>@font-face{font-family:"Plus Jakarta Sans";src:url("/public/fonts/plus-jakarta-sans-variable.ttf") format("truetype");font-weight:200 800}html{--font-jakarta:"Plus Jakarta Sans"}</style>`;
const tutor="22222222-2222-4222-8222-222222222222";
const student={id:tutor,display_name:"Ren Santos",college:"College of Computing and Information Sciences (CCIS)",program:"BS in Computer Science",year_level:2,bio:"I enjoy helping others understand Python.",avatar_url:null,created_at:"2026-11-13T00:00:00Z"};
const offer={id:tutor,tutor_id:tutor,skill_id:2,price_centavos:15000,enabled:true,skill_name:"Python"};
const pair={mutual:true,teachesMe:[{id:2,name:"Python"}],iTeachThem:[{id:1,name:"Graphic Design"}],offers:[offer],ready:false};
const tree=h("main",{className:"mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8"},
 h("header",{className:"space-y-2"},h("p",{className:"font-semibold text-primary"},"MMXchange"),h("h1",{className:"text-2xl font-semibold"},"Your learning options"),h("p",null,"Visual fixtures with fictional students. These controls do not save.")),
 h("div",{className:"grid items-start gap-5 md:grid-cols-2"},
 h("section",{className:"space-y-3"},h("h2",{className:"text-lg font-semibold"},"Complementary skills"),h(StudentCard,{student},h(LearningOptions,{tutorId:tutor,options:pair,skillNames:{2:"Python"}}))),
 h("section",{className:"space-y-3"},h("h2",{className:"text-lg font-semibold"},"Learner with no return skill"),h(StudentCard,{student},h(LearningOptions,{tutorId:tutor,options:{...pair,mutual:false,teachesMe:[],iTeachThem:[]},skillNames:{2:"Python"}})))),
 h("section",{className:"max-w-xl space-y-3"},h("h2",{className:"text-xl font-semibold"},"Optional teaching offer"),h(OfferForm,{skill:2,name:"Python",price:15000,enabled:true})),
 h("section",{className:"max-w-xl space-y-3"},h("h2",{className:"text-xl font-semibold"},"Accepted lesson conversation"),h("p",null,"Accepted only. Meeting not reserved. Payment not requested."),h(LessonComposer,{id:tutor,kind:"message"})));
mkdirSync(".taste-skill/preview",{recursive:true});
writeFileSync(".taste-skill/preview/paid-lessons.html",`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange lesson fixture</title>${css}</head><body>${renderToStaticMarkup(tree)}</body></html>`);
console.log("Wrote isolated paid-lesson visual fixtures.");
if (process.argv.includes("--serve")) {
  const root = process.cwd();
  createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    const filename = path.resolve(root, "." + decodeURIComponent(url.pathname));
    const allowed = ["public", ".next/static", ".taste-skill/preview"].some(prefix => filename.startsWith(path.resolve(root, prefix) + path.sep));
    if (!allowed || !existsSync(filename)) { response.writeHead(404); response.end(); return; }
    const type = { ".html": "text/html", ".css": "text/css", ".webp": "image/webp", ".ttf": "font/ttf" }[path.extname(filename)] ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": type }); response.end(readFileSync(filename));
  }).listen(4178, "127.0.0.1", () => console.log("Preview: http://127.0.0.1:4178/.taste-skill/preview/paid-lessons.html"));
}
