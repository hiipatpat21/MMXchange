// Run with: node scripts/test-messaging.mjs
// Server Action regression checks with a mocked Supabase client; no network or real accounts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const id = "11111111-1111-4111-8111-111111111111";
const actor = "22222222-2222-4222-8222-222222222222";
let loggedIn = true;
let denied = false;
const writes = [];
const invalidated = [];
const client = {
  auth: { getUser: async () => ({ data: { user: loggedIn ? { id: actor } : null } }) },
  from: table => ({ insert: async row => { writes.push({ table, row }); return { error: denied ? { code: "42501" } : null }; } }),
  rpc: async (name, args) => { writes.push({ name, args }); return { data: denied ? "not_allowed" : "ok", error: null }; },
};
function load(path, imports) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, FormData, require: name => {
    if (name in imports) return imports[name];
    if (name === "zod") return require(name);
    throw new Error(`Unexpected dependency: ${name}`);
  } }, { filename: path });
  return exports;
}
const actions = load("app/(app)/messages/actions.ts", {
  "next/cache": { revalidatePath: (...args) => invalidated.push(args) },
  "@/lib/supabase/server": { createClient: async () => client },
});
function form(body, target = id) {
  const data = new FormData();
  data.set("id", target); data.set("body", body);
  data.set("sender_id", "attacker-supplied-id"); data.set("author_id", "attacker-supplied-id");
  return data;
}
for (const data of [form("x".repeat(3000)), form(" \n\t "), form("hello", "not-a-uuid")]) {
  assert.ok((await actions.sendMessage(null, data))?.error);
}
assert.equal(writes.length, 0, "Invalid input must not reach the database");
loggedIn = false;
assert.ok((await actions.sendMessage(null, form("hello")))?.error);
assert.equal(writes.length, 0, "Anonymous requests must not write");
loggedIn = true;
assert.ok((await actions.sendMessage(null, form("  hello  ")))?.message);
assert.equal(writes[0].table, "exchange_messages");
assert.equal(writes[0].row.body, "hello");
assert.equal(writes[0].row.sender_id, actor, "Sender must come from server authentication");
assert.equal(writes[0].row.exchange_id, id);
assert.ok(invalidated.some(args => args[0] === `/messages/${id}`));
assert.ok(invalidated.some(args => args[0] === "/messages"));
assert.ok((await actions.postAnnouncement(null, form("x".repeat(1001))))?.error);
assert.ok((await actions.postAnnouncement(null, form("Bring your notes")))?.message);
assert.equal(writes.at(-1).table, "session_announcements");
assert.equal(writes.at(-1).row.author_id, actor, "Author must come from server authentication");
denied = true;
assert.ok((await actions.sendMessage(null, form("not allowed")))?.error);
assert.ok((await actions.postAnnouncement(null, form("not allowed")))?.error);
assert.ok((await actions.markThreadRead(id, "2026-01-01T00:00:00Z"))?.error);
denied = false;
const before = writes.length;
assert.ok((await actions.markThreadRead(id, "malformed-time"))?.error);
assert.equal(writes.length, before);
assert.equal(await actions.markThreadRead(id, "2026-01-01T00:00:00Z"), null);
assert.equal(writes.at(-1).name, "mark_exchange_read");
assert.equal(writes.at(-1).args.p_through, "2026-01-01T00:00:00Z");
const { canMessage } = load("lib/messages.ts", {});
for (const status of ["pending", "accepted", "scheduled", "completed"]) assert.equal(canMessage(status), true);
for (const status of ["declined", "cancelled"]) assert.equal(canMessage(status), false);
console.log("Messaging regression checks passed (validation, server-derived identity, denied writes, read receipts, statuses).");
