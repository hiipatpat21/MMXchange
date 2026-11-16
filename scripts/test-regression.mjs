// Run repository-only checks. No hosted credentials, migrations or deployment.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files=readdirSync('scripts').filter(name=>/^test-.*\.mjs$/.test(name)
 && !['test-regression.mjs','test-availability-sql.mjs'].includes(name)).sort();
for(const file of files) {
 console.log(`\nChecking ${file}`);
 const result=spawnSync(process.execPath,[`scripts/${file}`],{stdio:'inherit'});
 if(result.error || result.status!==0) {
  console.error(`FAILED: ${file}${result.error ? ` (${result.error.message})` : ''}`);
  process.exit(1);
 }
}
console.log(`\nPASS: ${files.length} local regression scripts. Hosted scenarios remain unverified.`);
