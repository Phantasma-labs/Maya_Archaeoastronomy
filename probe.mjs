import fs from 'fs';
import { execSync } from 'child_process';

try {
  const out = execSync('node inspect_tree.mjs', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: process.cwd() });
  fs.writeFileSync('probe_output.txt', 'EXIT=0\nLEN=' + out.length + '\n---OUT---\n' + out, 'utf8');
} catch (e) {
  const so = e.stdout || '';
  const se = e.stderr || '';
  fs.writeFileSync('probe_output.txt', 'EXIT=NONZERO\nSTDOUT_LEN=' + so.length + '\nSTDERR_LEN=' + se.length + '\n---STDOUT---\n' + so + '\n---STDERR---\n' + se + '\n---MSG---\n' + (e.message || ''), 'utf8');
}
