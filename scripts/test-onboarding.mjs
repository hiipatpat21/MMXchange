// Mocked regressions: no hosted SQL, accounts or network calls.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, imports = {}) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(js, { exports, Object, URL, process: { env: {} }, require: name => name in imports ? imports[name] : require(name) }, { filename: file });
  return exports;
}
const { colleges } = load("lib/mmsu-programs.ts");
const validation = load("lib/profile-validation.ts", { "@/lib/mmsu-programs": { colleges } });
const valid = { displayName: "Lia Cruz", college: colleges[4].name, program: colleges[4].programs[0], yearLevel: "6", bio: "" };
assert.equal(validation.profileSchema.safeParse(valid).success, true);
for (const change of [{ college: "" }, { program: "" }, { program: colleges[0].programs[0] }, { yearLevel: "" }, { yearLevel: "7" }, { yearLevel: "1.5" }, { displayName: "a" }, { bio: "x".repeat(301) }]) {
  assert.equal(validation.profileSchema.safeParse({ ...valid, ...change }).success, false);
}
const navigation = load("lib/onboarding.ts");
assert.equal(navigation.onboardingDestination("profile"), "/onboarding/profile");
assert.equal(navigation.onboardingDestination("skills"), "/onboarding/skills");
assert.equal(navigation.onboardingDestination("complete"), "/dashboard");
let step = "profile", readError = null, rowMissing = false;
const filters = [];
const reader = { from: table => { assert.equal(table, "profile_onboarding"); const q = {
  select: () => q, eq: (key, value) => { filters.push([key, value]); return q; },
  single: async () => ({ data: rowMissing ? null : { step }, error: readError }),
}; return q; } };
for (step of ["profile", "skills", "complete"]) assert.equal(await navigation.loadOnboardingStep(reader, "actor"), step);
assert.deepEqual(filters.at(-1), ["profile_id", "actor"]);
readError = { code: "missing_table" };
await assert.rejects(navigation.loadOnboardingStep(reader, "actor"));
readError = null; rowMissing = true;
await assert.rejects(navigation.loadOnboardingStep(reader, "actor"));
rowMissing = false; step = "forged";
await assert.rejects(navigation.loadOnboardingStep(reader, "actor"));

let signedIn = false, rpcResult = "ok", rpcError = null;
const calls = [], invalidated = [];
const client = { auth: { getUser: async () => ({ data: { user: signedIn ? { id: "server-actor" } : null } }) },
  rpc: async (name, params) => { calls.push({ name, params }); return { data: rpcResult, error: rpcError }; },
};
const actions = load("app/onboarding/actions.ts", {
  "@/lib/profile-validation": validation,
  "@/lib/supabase/server": { createClient: async () => client },
  "next/cache": { revalidatePath: (...args) => invalidated.push(args) },
  "next/navigation": { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
});
const form = fields => { const data = new FormData(); for (const [key, value] of Object.entries(fields)) data.set(key, value); return data; };
assert.ok((await actions.saveSetupProfile(null, form(valid))).error);
assert.equal(calls.length, 0);
signedIn = true;
assert.ok((await actions.saveSetupProfile(null, form({ ...valid, college: "" }))).error);
assert.equal(calls.length, 0);
for (rpcResult of ["invalid_profile", "already_complete", "not_found"]) {
  assert.ok((await actions.saveSetupProfile(null, form(valid))).error);
}
assert.equal(invalidated.length, 0);
rpcResult = "ok"; rpcError = { message: "offline" };
assert.ok((await actions.saveSetupProfile(null, form(valid))).error);
assert.equal(invalidated.length, 0);
rpcError = null;
await assert.rejects(actions.saveSetupProfile(null, form({ ...valid, profile_id: "forged" })), /REDIRECT:\/onboarding\/skills/);
assert.equal(calls.at(-1).name, "save_onboarding_profile");
assert.equal(calls.at(-1).params.p_year, 6);
assert.equal("profile_id" in calls.at(-1).params, false);
assert.equal(invalidated.length, 1);
assert.ok((await actions.finishSetup(null, form({ intent: "forged" }))).error);
rpcResult = "profile_required";
assert.ok((await actions.finishSetup(null, form({ intent: "skip" }))).error);
assert.equal(invalidated.length, 1);
rpcResult = "ok"; rpcError = { message: "offline" };
assert.ok((await actions.finishSetup(null, form({ intent: "skip" }))).error);
assert.equal(invalidated.length, 1);
rpcError = null;
for (const intent of ["skip", "continue"]) {
  await assert.rejects(actions.finishSetup(null, form({ intent })), /REDIRECT:\/dashboard/);
  assert.equal(calls.at(-1).name, "finish_onboarding");
  assert.equal(calls.at(-1).params, undefined); // No skill requirement or client-supplied identity.
}
signedIn = false;
const count = calls.length;
assert.ok((await actions.finishSetup(null, form({ intent: "skip" }))).error);
assert.equal(calls.length, count);
// Confirmation must gate unfinished users even when a safe public next URL is supplied.
let recovery = false, exchangeError = false, confirmationRequired = false;
const cookiesSet = [];
const cookieStore = { delete: () => {}, set: (...args) => cookiesSet.push(args) };
client.from = reader.from;
client.auth.exchangeCodeForSession = async () => ({ data: { session: {}, redirectType: recovery ? "recovery" : undefined }, error: exchangeError ? {} : null });
const redirects = load("lib/auth-redirects.ts");
const callback = load("app/auth/callback/route.ts", {
  "@/lib/onboarding": navigation,
  "@/lib/supabase/server": { createClient: async () => client },
  "@/lib/auth-redirects": { ...redirects, getSiteUrl: () => "https://app.example" },
  "@/lib/recovery": { getRecoveryBinding: async () => ({ value: "test-binding" }), recoveryCookieName: "recovery-test", recoveryCookieOptions: {} },
  "next/headers": { cookies: async () => cookieStore },
  "next/server": { NextResponse: { redirect: url => url.toString() } },
});
const request = query => ({ nextUrl: new URL(`https://app.example/auth/callback?${query}`), url: "https://app.example/auth/callback" });
signedIn = true; readError = null;
for (step of ["profile", "skills"]) {
  assert.equal(await callback.GET(request("code=test&next=/")), `https://app.example/onboarding/${step}`);
}
step = "complete";
assert.equal(await callback.GET(request("code=test&next=/forum")), "https://app.example/forum");
assert.equal(await callback.GET(request("code=test&next=/reset-password")), "https://app.example/dashboard");
readError = {};
assert.equal(await callback.GET(request("code=test")), "https://app.example/onboarding");
recovery = true;
assert.equal(await callback.GET(request("code=test")), "https://app.example/reset-password");
assert.equal(cookiesSet.at(-1)[0], "recovery-test");
recovery = false; exchangeError = true;
assert.equal(await callback.GET(request("code=test")), "https://app.example/login?error=auth_callback");
exchangeError = false;
client.auth.signInWithPassword = async () => ({ error: null });
client.auth.signUp = async () => ({ data: { session: confirmationRequired ? null : {} }, error: null });
const auth = load("app/(auth)/actions.ts", {
  "@/lib/supabase/server": { createClient: async () => client },
  "@/lib/auth-redirects": { getSiteUrl: () => "https://app.example", emailDomainAllowed: () => true },
  "@/lib/recovery": { recoveryCookieName: "recovery-test" },
  "next/headers": { cookies: async () => cookieStore },
  "next/navigation": { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
});
await assert.rejects(auth.login(null, form({ email: "student@example.test", password: "test-password" })), /REDIRECT:\/onboarding/);
const signup = form({ displayName: "Test Student", email: "student@example.test", password: "test-password" });
await assert.rejects(auth.register(null, signup), /REDIRECT:\/onboarding/);
confirmationRequired = true;
assert.match((await auth.register(null, signup)).message, /Check your email/);
const { AppGate } = load("components/onboarding/app-gate.tsx", {
  "@/lib/supabase/server": { createClient: async () => client },
  "@/lib/onboarding": navigation,
  "@/app/(auth)/actions": { logout: async () => {} },
  "@/components/ui/button": { Button: () => null },
  "next/navigation": { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
});
signedIn = true; readError = null;
for (step of ["profile", "skills"]) {
  await assert.rejects(AppGate({ children: "protected-app-content" }), new RegExp(`REDIRECT:/onboarding/${step}`));
}
step = "complete";
assert.equal(await AppGate({ children: "protected-app-content" }), "protected-app-content");
readError = {};
const { renderToStaticMarkup } = require("react-dom/server");
assert.equal(renderToStaticMarkup(await AppGate({ children: "protected-app-content" })).includes("protected-app-content"), false);
signedIn = false;
await assert.rejects(AppGate({ children: "protected-app-content" }), /REDIRECT:\/login/);
console.log("Onboarding mocked checks passed: validation, progress routing, identity, failed saves, skip/continue, sign-in/signup, confirmation and recovery callbacks.");
