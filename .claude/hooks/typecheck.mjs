#!/usr/bin/env node
// PostToolUse: depois de editar um .ts/.tsx em src/, roda o tsc e devolve os erros ao Claude (exit 2).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path ?? '';
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd;
if (!/\/src\/.*\.tsx?$/.test(file)) process.exit(0);

const tsc = join(root, 'node_modules/.bin/tsc');
if (!existsSync(tsc)) process.exit(0);

try {
  execFileSync(tsc, ['-b', '--pretty', 'false'], { cwd: root, stdio: 'pipe' });
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  process.stderr.write(`tsc encontrou erros depois desta edição:\n${out.split('\n').slice(0, 30).join('\n')}\n`);
  process.exit(2);
}
