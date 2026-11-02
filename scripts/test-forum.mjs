// Run: node scripts/test-forum.mjs. Mocks Supabase; no network or database writes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, URLSearchParams, require: name => {
    if (name in imports) return imports[name];
    if (name === "zod") return require(name);
    throw new Error(`Unexpected import: ${name}`);
  } }, { filename: path });
  return exports;
}
const id = "11111111-1111-4111-8111-111111111111";
const actor = "22222222-2222-4222-8222-222222222222";
const parentId = "33333333-3333-4333-8333-333333333333";
let signedIn = true, denied = false, absent = false;
const calls = [], invalidated = [];
const client = {
  auth: { getUser: async () => ({ data: { user: signedIn ? { id: actor } : null } }) },
  from: table => ({
    insert: row => {
      calls.push({ operation: "insert", table, row });
      return { error: denied ? {} : null, select: () => ({ single: async () => ({ data: denied ? null : { id }, error: denied ? {} : null }) }) };
    },
    delete: () => {
      const call = { operation: "delete", table, filters: [] };
      calls.push(call);
      const builder = {
        eq: (key, value) => { call.filters.push([key, value]); return builder; }, select: () => builder,
        maybeSingle: async () => ({ data: absent ? null : { id, post_id: parentId }, error: denied ? {} : null }),
      };
      return builder;
    },
  }),
};
const forum = load("lib/forum.ts");
const actions = load("app/(app)/forum/actions.ts", {
  "@/lib/forum": forum,
  "@/lib/supabase/server": { createClient: async () => client },
  "next/cache": { revalidatePath: path => invalidated.push(path) },
  "next/navigation": { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
});
const form = fields => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ author_id: "forged", ...fields })) data.set(key, value);
  return data;
};
const post = { title: "  Learning Python  ", category: "programming", body: "  How should I practise Python?  " };
for (const bad of [{ title: "tiny" }, { title: "x".repeat(121) }, { body: "short" }, { body: "x".repeat(5001) }, { category: "unknown" }]) {
  assert.ok((await actions.createPost(null, form({ ...post, ...bad })))?.error);
}
for (const body of [" \n\t ", "x".repeat(2001)]) assert.ok((await actions.addComment(null, form({ postId: id, body })))?.error);
assert.ok((await actions.deleteForumItem(null, form({ id: "invalid", kind: "post" })))?.error);
assert.equal(calls.length, 0);
signedIn = false;
assert.ok((await actions.createPost(null, form(post)))?.error);
assert.ok((await actions.addComment(null, form({ postId: id, body: "Helpful reply" })))?.error);
assert.ok((await actions.deleteForumItem(null, form({ id, kind: "post" })))?.error);
assert.equal(calls.length, 0, "Anonymous users cannot write");
signedIn = true;
await assert.rejects(actions.createPost(null, form(post)), new RegExp(`REDIRECT:/forum/${id}`));
assert.equal(calls.at(-1).row.author_id, actor);
assert.equal(calls.at(-1).row.title, "Learning Python");
assert.ok(invalidated.includes("/forum"));
assert.ok((await actions.addComment(null, form({ postId: id, body: "  Helpful reply  " })))?.message);
assert.equal(calls.at(-1).row.body, "Helpful reply");
assert.equal(calls.at(-1).row.author_id, actor);
assert.equal(calls.at(-1).row.post_id, id);
assert.ok(invalidated.includes(`/forum/${id}`));
denied = true;
assert.ok((await actions.createPost(null, form(post)))?.error);
assert.ok((await actions.addComment(null, form({ postId: id, body: "Reply" })))?.error);
assert.ok((await actions.deleteForumItem(null, form({ id, kind: "post" })))?.error);
denied = false; absent = true;
assert.ok((await actions.deleteForumItem(null, form({ id, kind: "comment" })))?.error, "An RLS-filtered no-op is not success");
absent = false;
assert.ok((await actions.deleteForumItem(null, form({ id, kind: "comment", postId: "forged" })))?.message);
assert.ok(calls.at(-1).filters.some(([key, value]) => key === "author_id" && value === actor));
assert.ok(invalidated.includes(`/forum/${parentId}`), "Parent route comes from the deleted row, not form data");
await assert.rejects(actions.deleteForumItem(null, form({ id, kind: "post" })), /REDIRECT:\/forum$/);
assert.ok(calls.at(-1).filters.some(([key, value]) => key === "author_id" && value === actor));
assert.equal(forum.forumFilterSchema.parse({}).page, 1);
for (const bad of [{ page: "0" }, { page: "-1" }, { page: "1.5" }, { category: "bad" }, { q: "x".repeat(101) }, { mine: ["1", "1"] }]) assert.equal(forum.forumFilterSchema.safeParse(bad).success, false);
assert.equal(forum.forumUrl({ q: "C++", category: "programming", mine: true, page: 2 }), "/forum?q=C%2B%2B&category=programming&mine=1&page=2");
for (const query of ['a,b(c)."d"', "100%_done", "C++", "back\\slash"]) {
  const filter = forum.forumSearchFilter(query);
  const [titlePattern, bodyPattern] = filter.slice("title.ilike.".length).split(",body.ilike.");
  assert.equal(JSON.parse(titlePattern), `%${query.replace(/[\\%_]/g, "\\$&")}%`);
  assert.equal(titlePattern, bodyPattern);
}
console.log("Forum checks passed: validation, authentication, authorship, deletes, filters, pagination URLs, and search escaping.");
