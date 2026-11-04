// Run: node scripts/test-security.mjs. Mocked checks; never contacts Supabase.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const env = { NODE_ENV: "development" };
function load(path, imports = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, URL, process: { env }, require: name => {
    if (name in imports) return imports[name];
    if (name === "zod") return require(name);
    throw new Error(`Unexpected import ${name}`);
  } }, { filename: path });
  return exports;
}
const actor = "11111111-1111-4111-8111-111111111111";
const redirects = load("lib/auth-redirects.ts");
for (const route of ["/dashboard", `/forum/${actor}`, `/messages/${actor}`]) assert.equal(redirects.safeAuthNext(route), route);
for (const route of ["https://evil.example", "//evil.example", "/%2fexample", "/%252fexample", "/\\evil.example", "/%0aevil", "/%zz"]) assert.equal(redirects.safeAuthNext(route), "/dashboard");
assert.equal(redirects.emailDomainAllowed("a@EXAMPLE.EDU", "example.edu"), true);
assert.equal(redirects.emailDomainAllowed("a@fakeexample.edu", "example.edu"), false);
assert.equal(redirects.getSiteUrl(), "http://localhost:3000");
env.NODE_ENV = "production";
assert.throws(() => redirects.getSiteUrl());
env.NEXT_PUBLIC_SITE_URL = "http://example.test";
assert.throws(() => redirects.getSiteUrl());
env.NEXT_PUBLIC_SITE_URL = "https://example.test";
assert.equal(redirects.getSiteUrl(), "https://example.test");
for (const invalid of ["https://localhost", "https://127.0.0.1", "https://[::1]", "https://example.test/auth/callback", "https://example.test?next=/dashboard", "https://user:password@example.test"]) {
  env.NEXT_PUBLIC_SITE_URL = invalid;
  assert.throws(() => redirects.getSiteUrl());
}
env.NEXT_PUBLIC_SITE_URL = "https://example.test/";
assert.equal(redirects.getSiteUrl(), "https://example.test");
const { notificationDestination } = load("lib/notifications.ts", { "@/lib/supabase/server": {} });
for (const section of ["exchanges", "sessions", "messages", "forum"]) assert.equal(notificationDestination(`/${section}/${actor}`), `/${section}/${actor}`);
for (const route of [null, "//evil.example", "https://evil.example", `/forum/${actor}/../login`, "/forum/not-a-uuid", `/forum/${actor}?next=https://evil.example`]) assert.equal(notificationDestination(route), "/notifications");
env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.example";
const avatars = load("lib/avatars.ts");
const ownPath = `${actor}/avatar-1793577600000-${actor}.png`;
assert.equal(avatars.isOwnAvatarPath(ownPath, actor), true);
assert.equal(avatars.isOwnAvatarPath(`other/${ownPath}`, actor), false);
assert.equal(avatars.isOwnAvatarPath(`${actor}/../other.png`, actor), false);
assert.equal(avatars.trustedAvatarUrl("https://evil.example/pixel.png"), undefined);
assert.ok(avatars.avatarFileError({ type: "image/svg+xml", size: 100 }));
assert.ok(avatars.avatarFileError({ type: "image/png", size: 2097153 }));

let signedIn = false, error = null, missing = false;
const writes = [], invalidated = [];
const client = {
  auth: { getUser: async () => ({ data: { user: signedIn ? { id: actor } : null } }) },
  from: table => ({
    insert: async row => { writes.push({ table, row }); return { error }; },
    delete: () => {
      const item = { table, filters: [] }; writes.push(item);
      const builder = { eq: (key, value) => { item.filters.push([key, value]); return builder; }, select: async () => ({ data: missing ? [] : [{ skill_id: 1 }], error }) };
      return builder;
    },
  }),
};
const skills = load("app/(app)/skills/actions.ts", { "@/lib/supabase/server": { createClient: async () => client }, "next/cache": { revalidatePath: path => invalidated.push(path) } });
const form = fields => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
assert.ok((await skills.addSkill(null, form({ skillId: "bad", kind: "teach" })))?.error);
assert.ok((await skills.addSkill(null, form({ skillId: "1", kind: "teach" })))?.error);
assert.equal(writes.length, 0);
signedIn = true;
assert.ok((await skills.addSkill(null, form({ skillId: "1", kind: "teach", profile_id: "forged" })))?.message);
assert.equal(writes.at(-1).row.profile_id, actor);
error = { code: "23505", message: "provider internals" };
assert.match((await skills.addSkill(null, form({ skillId: "1", kind: "teach" }))).error, /already/);
error = null; missing = true;
assert.ok((await skills.removeSkill(null, form({ skillId: "1" })))?.error);
missing = false;
assert.ok((await skills.removeSkill(null, form({ skillId: "1", profile_id: "forged" })))?.message);
assert.ok(writes.at(-1).filters.some(([key, value]) => key === "profile_id" && value === actor));
assert.ok(invalidated.includes(`/students/${actor}`));

const { proxy } = load("proxy.ts", {
  "@supabase/ssr": { createServerClient: () => client },
  "next/server": { NextResponse: { next: () => ({ kind: "next" }), redirect: url => ({ kind: "redirect", url: String(url) }) } },
});
const request = pathname => ({ url: `https://app.example${pathname}`, nextUrl: { pathname }, cookies: { getAll: () => [], set: () => {} } });
signedIn = false;
for (const root of ["dashboard", "discover", "students", "sessions", "exchanges", "messages", "forum", "notifications", "profile", "skills"]) {
  assert.equal((await proxy(request(`/${root}`))).url, "https://app.example/login");
  assert.equal((await proxy(request(`/${root}/${actor}`))).kind, "redirect");
}
for (const route of ["/", "/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"]) assert.equal((await proxy(request(route))).kind, "next");
signedIn = true;
assert.equal((await proxy(request("/login"))).url, "https://app.example/dashboard");
assert.equal((await proxy(request("/reset-password"))).kind, "next");
let signupPayload;
const auth = load("app/(auth)/actions.ts", {
  "@/lib/supabase/server": { createClient: async () => ({ auth: { signUp: async payload => { signupPayload = payload; return { data: null, error: { message: "private provider diagnostic" } }; } } }) },
  "@/lib/auth-redirects": redirects, "@/lib/recovery": { recoveryCookieName: "test" },
  "next/headers": {}, "next/navigation": {},
});
assert.equal((await auth.register(null, form({ email: "a@example.test", displayName: "Student", password: "test-password-123" }))).error.includes("private provider"), false);
assert.equal(signupPayload.options.emailRedirectTo, "https://example.test/auth/callback");
signupPayload = undefined;
env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
assert.match((await auth.register(null, form({ email: "a@example.test", displayName: "Student", password: "test-password-123" }))).error, /not configured/);
assert.equal(signupPayload, undefined);
console.log("Security regression checks passed: redirect allowlists, avatars, skill identities/errors, route protection, and signup errors.");
