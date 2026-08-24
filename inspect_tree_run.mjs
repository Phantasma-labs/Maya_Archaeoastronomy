import { execSync } from 'child_process';
import fs from 'fs';

try {
  const out = execSync('node inspect_tree.mjs', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  fs.writeFileSync('inspect_tree_output.txt', out, 'utf8');
} catch (e) {
  const msg = 'STDOUT:\n' + (e.stdout || '') + '\n\nSTDERR:\n' + (e.stderr || '') + '\n\nERROR:\n' + (e.message || '');
  fs.writeFileSync('inspect_tree_output.txt', msg, 'utf8');
}
