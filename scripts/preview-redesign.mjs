// Isolated visual fixture; never imported by the app and never connects to Supabase.
// Run after npm run build: node scripts/preview-redesign.mjs [empty|error]
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const mode = process.argv[2] ?? "populated";
const empty = mode === "empty", failed = mode === "error";
const id = "11111111-1111-4111-8111-111111111111";
const partnerId = "22222222-2222-4222-8222-222222222222";
const when = new Date(Date.now() + 86400000).toISOString();
const matches = { hasSkills: !empty, matches: empty ? [] : [{
  profile: { id: partnerId, display_name: "Ren Santos", college: "", program: "", year_level: null, avatar_url: null },
  mutual: true, teachesMe: [{ id: 1, name: "Python" }], iTeachThem: [{ id: 2, name: "Graphic Design" }], overlapCount: 2,
  explanation: "Ren can teach Python, and you can share Graphic Design.",
}] };
const client = { from: table => {
  let filters = [], head = false;
  const result = () => {
    let data = [];
    if (table === "profiles") data = [{ display_name: "Lia Cruz", college: "", program: "", bio: "Learning together" }];
    if (!empty && table === "profile_skills") data = [{ skill_id: 1 }];
    if (!empty && table === "group_session_registrations") data = [{ session_id: id }];
    if (!empty && table === "exchange_requests") {
      const accepted = filters.some(([key, value]) => key === "status" && value === "accepted");
      data = [{ id: accepted ? id : partnerId, requester_id: partnerId, recipient_id: id, status: accepted ? "accepted" : "pending", requester: { display_name: "Ren Santos" }, recipient: { display_name: "Lia Cruz" }, teach_skill: { name: "Python" }, learn_skill: { name: "Graphic Design" } }];
    }
    if (!empty && table === "exchange_sessions") data = [{ id, exchange_id: id, starts_at: when, skills: { name: "Python" } }];
    return { data: head ? null : data, count: data.length, error: failed ? { message: "Fixture error" } : null };
  };
  const builder = {
    select: (_columns, options) => { head = !!options?.head; return builder; },
    eq: (key, value) => { filters.push([key, value]); return builder; },
    gt: () => builder, order: () => builder, limit: () => builder,
    maybeSingle: async () => { const value = result(); return { ...value, data: value.data?.[0] ?? null }; },
    then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
  };
  return builder;
} };
const imports = {
  "next/image": { __esModule: true, default: ({ src, alt, width, height, className }) => React.createElement("img", { src: `/public${src}`, alt, width, height, className }) },
  "next/link": { __esModule: true, default: ({ href, children, ...props }) => { delete props.prefetch; return React.createElement("a", { ...props, href: typeof href === "string" ? href : href.pathname }, children); } },
  "next/navigation": { usePathname: () => "/dashboard", redirect: () => { throw new Error("Unexpected redirect in fixture"); } },
  "@/lib/dashboard": {
    getDashboardContext: async () => ({ supabase: client, user: { id } }),
    getDashboardMatches: async () => { if (failed) throw new Error("Fixture error"); return matches; },
    chooseDashboardSuggestion: () => ({ title: empty ? "Add a skill you can teach" : "Schedule your first exchange session", reason: empty ? "A skill you share could start a great exchange." : "You have an accepted exchange that is ready for a teaching session.", href: empty ? "/skills" : `/exchanges/${id}`, label: empty ? "Add your skills" : "Schedule a session" }),
  },
  "@/lib/group-sessions": { loadSessionCards: async (_client, options) => {
    if (failed) throw new Error("Fixture error");
    return { sessions: empty || options.organizerId ? [] : [{ id: partnerId, title: "An introduction to photography", starts_at: when }], capped: false };
  } },
};
const cache = new Map();
function load(file) {
  const resolved = path.resolve(file);
  if (cache.has(resolved)) return cache.get(resolved);
  const exports = {};
  cache.set(resolved, exports);
  const code = ts.transpileModule(readFileSync(resolved, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, process: { env: {} }, require: name => {
    if (name in imports) return imports[name];
    if (name.startsWith("@/")) {
      const stem = name.slice(2);
      const target = [stem + ".tsx", stem + ".ts"].find(existsSync);
      if (!target) throw new Error(`Unresolved fixture import: ${name}`);
      return load(target);
    }
    return require(name);
  } }, { filename: resolved });
  return exports;
}
const h = React.createElement;
const panels = [];
for (const [file, name, span] of [
  ["suggested-next-step", "SuggestedNextStep", "dashboard-main"], ["pending-requests", "PendingRequests", "dashboard-side"],
  ["learning-agenda", "LearningAgenda", "dashboard-half"], ["recommended-matches", "RecommendedMatches", "dashboard-half"],
]) panels.push(h("div", { key: name, className: span }, await load(`components/dashboard/${file}.tsx`)[name]()));
const greeting = await load("components/dashboard/greeting.tsx").DashboardGreeting();
const checklist = await load("components/dashboard/profile-checklist.tsx").ProfileChecklist();
const { Sidebar } = load("components/layout/sidebar.tsx");
const tree = h("div", { className: "flex min-h-screen bg-background" }, h(Sidebar), h("div", { className: "min-w-0 flex-1" },
  h("header", { className: "flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8" }, h("span", { className: "text-sm text-muted-foreground" }, "MMXchange / Your learning space")),
  h("main", { className: "app-content mx-auto w-full max-w-[1164px] px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pt-6" },
    h("div", { className: "space-y-6" }, h("header", { className: "space-y-2" }, greeting, h("p", { className: "text-sm text-muted-foreground" }, "A little learning, a little sharing. What's next for you?")), checklist, h("div", { className: "dashboard-grid" }, panels))),
  h("p", { className: "px-8 pb-4 text-xs text-muted-foreground" }, "Visual fixture only. Fictional sample data; not an authenticated session.")));
const css = readdirSync(".next/static", { recursive: true }).filter(file => file.endsWith(".css")).map(file => `<link rel="stylesheet" href="/.next/static/${file.replaceAll(path.sep, "/")}">`).join("");
mkdirSync(".taste-skill/preview", { recursive: true });
const output = `.taste-skill/preview/dashboard-${mode}.html`;
writeFileSync(output, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMXchange layout fixture</title>${css}</head><body>${renderToStaticMarkup(tree)}</body></html>`);
console.log(`Wrote isolated ${mode} dashboard fixture: ${output}`);
