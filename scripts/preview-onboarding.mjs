// Isolated visual fixtures; no Supabase credentials, writes or authenticated sessions.
// Run after npm run build: node scripts/preview-onboarding.mjs [--serve]
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
  "next/image": { default: props => { const imageProps = { ...props }; delete imageProps.priority; delete imageProps.unoptimized; return h("img", { ...imageProps, src: `/public${props.src}` }); } },
  "@/app/onboarding/actions": { saveSetupProfile: noAction, finishSetup: noAction },
  "@/app/(app)/profile/actions": { updateProfile: noAction },
  "@/app/(app)/skills/actions": { addSkill: noAction, removeSkill: noAction },
};
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(js, { exports, require: name => {
    if (name in imports) return imports[name];
    if (name.startsWith("@/")) { const stem = name.slice(2); return load([stem + ".tsx", stem + ".ts"].find(existsSync)); }
    return require(name);
  } }, { filename: file });
  return exports;
}
const { SetupScreen } = load("components/onboarding/setup-screen.tsx");
const { ProfileForm } = load("components/profile/profile-form.tsx");
const { FinishForm } = load("components/onboarding/finish-form.tsx");
const { SkillSection } = load("components/skills/skill-section.tsx");
const { Logo } = load("components/layout/logo.tsx");
const { Button } = load("components/ui/button.tsx");
const css = readdirSync(".next/static", { recursive: true }).filter(file => file.endsWith(".css")).map(file => `<link rel="stylesheet" href="/.next/static/${file.replaceAll(path.sep, "/")}">`).join("") + `<style>@font-face{font-family:"Plus Jakarta Sans";src:url("/public/fonts/plus-jakarta-sans-variable.ttf") format("truetype");font-weight:200 800}html{--font-jakarta:"Plus Jakarta Sans"}</style>`;
mkdirSync(".taste-skill/preview", { recursive: true });
for (const step of ["profile", "skills"]) {
  const children = step === "profile" ? h(ProfileForm, { onboarding: true, profile: { display_name: "Lia Cruz", college: null, program: null, year_level: null, bio: "" } }) : h(React.Fragment, null, h(FinishForm),
    h("div", { className: "grid gap-6 md:grid-cols-2" }, ...["teach", "learn"].map(kind => h(SkillSection, { key: kind, kind, title: kind === "teach" ? "Skills I can teach" : "Skills I want to learn", description: "Choose what feels right for you.", chosen: [], available: [{ id: 1, name: "Python", category: "Programming" }, { id: 2, name: "Graphic Design", category: "Design" }] }))));
  const tree = h("div", { className: "min-h-screen bg-background" },
    h("header", { className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-8" }, h(Logo), h(Button, { variant: "ghost" }, "Log out")),
    h("main", { className: "mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-8" }, h(SetupScreen, { step }, children)),
    h("p", { className: "px-4 pb-4 text-sm text-muted-foreground" }, "Visual fixture only. Fictional student; controls do not save."));
  writeFileSync(`.taste-skill/preview/onboarding-${step}.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange setup preview</title>${css}</head><body>${renderToStaticMarkup(tree)}</body></html>`);
}
console.log("Wrote isolated profile and skills onboarding fixtures.");
if (process.argv.includes("--serve")) {
  const root = process.cwd();
  createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    const filename = path.resolve(root, "." + decodeURIComponent(url.pathname));
    const allowed = ["public", ".next/static", ".taste-skill/preview"].some(prefix => filename.startsWith(path.resolve(root, prefix) + path.sep));
    if (!allowed || !existsSync(filename)) { response.writeHead(404); response.end(); return; }
    const type = { ".html": "text/html", ".css": "text/css", ".webp": "image/webp", ".ttf": "font/ttf" }[path.extname(filename)] ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": type }); response.end(readFileSync(filename));
  }).listen(4179, "127.0.0.1", () => console.log("Preview: http://127.0.0.1:4179/.taste-skill/preview/onboarding-profile.html"));
}
