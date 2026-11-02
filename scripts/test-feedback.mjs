// Run: node scripts/test-feedback.mjs (mocked actions; no network or database writes).
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
  vm.runInNewContext(js, { exports, require: name => {
    if (name in imports) return imports[name];
    if (name === "zod") return require(name);
    throw new Error(`Unexpected import ${name}`);
  } }, { filename: path });
  return exports;
}
const id = "11111111-1111-4111-8111-111111111111";
const actor = "22222222-2222-4222-8222-222222222222";
const calls = [], invalidated = [];
let signedIn = true, code = "ok", failed = false, targetExists = true;
const client = {
  auth: { getUser: async () => ({ data: { user: signedIn ? { id: actor } : null } }) },
  rpc: async (name, args) => { calls.push({ name, args }); return { data: code, error: failed ? {} : null }; },
  from: table => ({
    select: () => {
      calls.push({ selectTable: table });
      const builder = { eq: () => builder, maybeSingle: async () => ({ data: targetExists ? { id } : null, error: null }) };
      return builder;
    },
    insert: async row => { calls.push({ table, row }); return { error: failed ? {} : null }; },
  }),
};
const feedback = load("lib/feedback.ts");
const actions = load("app/(app)/feedback/actions.ts", {
  "@/lib/feedback": feedback,
  "@/lib/supabase/server": { createClient: async () => client },
  "next/cache": { revalidatePath: (...args) => invalidated.push(args) },
});
const form = (fields = {}) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id, rating: "5", comment: "  Clear explanation  ", reviewer_id: "forged", reviewee_id: "forged", reporter_id: "forged", ...fields })) data.set(key, value);
  return data;
};
for (const fields of [{ rating: "0" }, { rating: "6" }, { rating: "2.5" }, { rating: "" }, { comment: "x".repeat(501) }, { id: "bad-id" }]) {
  assert.ok((await actions.submitExchangeReview(null, form(fields)))?.error);
}
assert.equal(calls.length, 0, "Bad input must not reach RPC");
signedIn = false;
assert.ok((await actions.submitExchangeReview(null, form()))?.error);
assert.ok((await actions.submitSessionFeedback(null, form({ helpful: "yes" })))?.error);
assert.equal(calls.length, 0);
signedIn = true;
assert.ok((await actions.submitExchangeReview(null, form()))?.message);
assert.equal(calls.at(-1).name, "submit_exchange_review");
assert.equal(calls.at(-1).args.p_comment, "Clear explanation");
assert.equal(calls.at(-1).args.p_rating, 5);
assert.equal(Object.keys(calls.at(-1).args).length, 3, "Review identity must be derived in SQL, never forwarded from forms");
assert.ok(invalidated.some(args => args[0] === `/exchanges/${id}`));
assert.ok(invalidated.some(args => args[0] === "/students/[id]"));
assert.ok((await actions.submitSessionFeedback(null, form({ helpful: "maybe" })))?.error);
assert.ok((await actions.submitSessionFeedback(null, form({ helpful: "no", comment: "  " })))?.message);
assert.equal(calls.at(-1).args.p_helpful, false);
assert.equal(calls.at(-1).args.p_comment, null);
assert.ok(invalidated.some(args => args[0] === `/sessions/${id}`));
for (const rejected of ["not_allowed", "not_completed", "already_reviewed", "not_registered", "is_organizer", "already_submitted"]) {
  code = rejected;
  assert.ok((await actions.submitExchangeReview(null, form()))?.error);
  assert.ok((await actions.submitSessionFeedback(null, form({ helpful: "yes" })))?.error);
}
code = "ok"; failed = true;
assert.ok((await actions.submitExchangeReview(null, form()))?.error);
failed = false;
const report = fields => form({ targetType: "exchange_review", targetId: id, reason: "Inappropriate comment", ...fields });
for (const fields of [{ targetId: "bad" }, { targetType: "other" }, { reason: "no" }, { reason: "x".repeat(501) }, { targetType: "session_feedback", targetId: id }]) {
  assert.ok((await actions.submitReport(null, report(fields)))?.error);
}
signedIn = false;
assert.ok((await actions.submitReport(null, report()))?.error);
signedIn = true; targetExists = false;
assert.ok((await actions.submitReport(null, report()))?.error);
targetExists = true;
assert.ok((await actions.submitReport(null, report({ targetType: "session_feedback", targetId: `${id}:${actor}` })))?.message);
assert.equal(calls.at(-1).table, "reports");
assert.equal(calls.at(-1).row.reporter_id, actor);
assert.equal(calls.at(-1).row.target_id, `${id}:${actor}`);
assert.equal(calls.at(-1).row.status, undefined, "Report status uses the database's open default");
for (const [targetType, table] of [["forum_post", "forum_posts"], ["forum_comment", "forum_comments"]]) {
  assert.ok((await actions.submitReport(null, report({ targetType })))?.message);
  assert.equal(calls.at(-2).selectTable, table);
  assert.equal(calls.at(-1).row.target_type, targetType);
  assert.equal(calls.at(-1).row.reporter_id, actor);
}
assert.equal(feedback.ratingSummaryText({ average: 4.3333, review_count: "3" }), "4.3 out of 5 · 3 reviews");
assert.equal(feedback.ratingSummaryText({ average: null, review_count: 0 }), "No reviews yet.");
const { getExchangeProgress } = load("lib/exchange-sessions.ts");
const exchange = { status: "completed", requester_id: actor, requester_completed_at: "2026-01-01T00:00:00Z" };
assert.equal(getExchangeProgress(exchange, [], actor, "Partner", Date.now(), false).currentStep, 4);
assert.equal(getExchangeProgress(exchange, [], actor, "Partner", Date.now(), true).currentStep, 5);
assert.match(getExchangeProgress(exchange, [], actor, "Partner", Date.now(), null).nextAction, /Reload/);
console.log("Feedback action checks passed: validation, identities, error codes, reports, summaries, and progress.");
