// Local heuristic scan. Reports locations/counts, never matched credential values.
// Run: node scripts/audit-security.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const git = args => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
const files = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0").filter(file => file && existsSync(file));
const patterns = [
  ["privileged Supabase key", /sb_secret_[a-zA-Z0-9_-]{12,}/g],
  ["private key block", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["GitHub token", /(?:ghp_|github_pat_)[a-zA-Z0-9_]{30,}/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
];
function detect(source) {
  const hits = patterns.filter(([, regex]) => { regex.lastIndex = 0; return regex.test(source); }).map(([name]) => name);
  for (const token of source.matchAll(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g)) {
    try {
      if (JSON.parse(Buffer.from(token[0].split(".")[1], "base64url").toString()).role === "service_role") hits.push("privileged JWT");
    } catch { /* Non-JWT text is not a credential finding. */ }
  }
  return [...new Set(hits)];
}
const workingFindings = [], publicNames = new Set();
for (const file of files) {
  if (!/\.(?:[cm]?[jt]sx?|json|sql|md|ya?ml|toml|txt)$/.test(file) && !path.basename(file).startsWith(".env")) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\bNEXT_PUBLIC_[A-Z0-9_]+\b/g)) publicNames.add(match[0]);
  const findings = detect(source);
  if (findings.length) workingFindings.push({ file, findings });
}
// Capture the full reachable Git patch history in memory; never print its lines.
const history = git(["log", "--all", "--format=", "--patch", "--no-ext-diff", "--no-textconv"]);
const historyFindings = detect(history);
// Inspect local public environment assignments without printing their values.
const localPublicFindings = [];
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const assignment = line.match(/^\s*(NEXT_PUBLIC_[A-Z0-9_]+)\s*=([\s\S]*)$/);
    if (!assignment) continue;
    publicNames.add(assignment[1]);
    const findings = detect(assignment[2]);
    if (findings.length) localPublicFindings.push({ variable: assignment[1], findings });
  }
}
const envIgnored = spawnSync("git", ["check-ignore", "--quiet", ".env.local"]).status === 0;
const envTracked = spawnSync("git", ["ls-files", "--error-unmatch", ".env.local"], { stdio: "ignore" }).status === 0;
const envHistory = git(["log", "--all", "--format=%h", "--", ".env.local"]).trim().split("\n").filter(Boolean).length;
const proxy = readFileSync("proxy.ts", "utf8");
const protectedText = proxy.match(/const protectedPaths = \[([\s\S]*?)\]/)?.[1] ?? "";
const protectedPaths = [...protectedText.matchAll(/"(\/[a-z]+)"/g)].map(match => match[1]);
const routes = files.filter(file => file.startsWith("app/(app)/") && file.endsWith("/page.tsx"))
  .map(file => "/" + file.slice("app/(app)/".length, -"/page.tsx".length));
const unprotected = routes.filter(route => !protectedPaths.some(prefix => route === prefix || route.startsWith(prefix + "/")));
console.log(JSON.stringify({
  scannedFiles: files.length, reachableCommits: Number(git(["rev-list", "--all", "--count"]).trim()),
  workingFindings, historyFindings, localPublicFindings, envIgnored, envTracked, envLocalHistoryCommits: envHistory,
  publicVariableNames: [...publicNames].sort(), protectedPaths, unprotectedAuthenticatedRoutes: unprotected,
  scope: "Recognizable privileged key/token patterns in non-ignored text files, reachable Git patches, and local NEXT_PUBLIC assignments; values are never printed. Not proof that no arbitrary secret exists. Does not inspect live Supabase grants.",
}, null, 2));
if (workingFindings.length || historyFindings.length || localPublicFindings.length || !envIgnored || envTracked || envHistory || unprotected.length) process.exitCode = 1;
