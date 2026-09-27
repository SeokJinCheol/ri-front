import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as prettier from 'prettier';

const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
        cwd: root,
        encoding: 'utf8',
    },
)
    .split('\0')
    .filter(Boolean);
let changed = 0;
for (const file of [...new Set(files)].sort()) {
    if (file === 'package-lock.json' || /\.(xlsx|lock)$/.test(file)) continue;
    const filepath = path.join(root, file);
    const info = await prettier.getFileInfo(filepath);
    if (!info.inferredParser) continue;
    const source = await readFile(filepath, 'utf8');
    const config = await prettier.resolveConfig(filepath);
    const formatted = await prettier.format(source, { ...config, filepath });
    if (formatted === source) continue;
    changed += 1;
    console.log(`${check ? 'Needs formatting' : 'Formatted'}: ${file}`);
    if (!check) await writeFile(filepath, formatted);
}
console.log(`${changed} file(s) ${check ? 'need formatting' : 'formatted'}.`);
if (check && changed) process.exitCode = 1;
