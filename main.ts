// Hand-in program for the GTA 6 trophy guide (competition gta6-trophy-guide-01).
//
// The guide itself is a set of plain static files in app/ — an index page, a
// stylesheet, a small module and the trophy data — that any static server can
// host and that works with the network off. This program's only job is to
// assemble the submission: it clears the destination folder, copies app/ and
// screenshots/ into it, and writes dossier.json there. The dossier is built
// with the vendored make.fun helper (vendor/makefun-frontend.ts, untouched),
// which is also what the scorer uses, so the file we write must match the
// scorer's own rebuild byte for byte.
//
// Runs on Node 22 with the standard library only. In the grading container
// the destination is /output; anywhere else, MAKEFUN_OUTPUT_DIR overrides it:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Run it twice and the two outputs must be identical.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const targetDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function copyTree(sourceName: string): void {
  const source = join(repoDir, sourceName);
  if (!existsSync(source)) return;
  cpSync(source, join(targetDir, sourceName), { recursive: true });
}

// Start from a clean destination so a stale file from an earlier build can
// never leak into the submission.
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
copyTree('app');
mkdirSync(join(targetDir, 'screenshots'), { recursive: true });
copyTree('screenshots');

// The caps mirror the scorer's gate: at most 4 screenshots of 256 KiB each,
// app/ at most 993 entries and 48 MiB, and the dossier text capped so the
// judge's view stays within its token budget.
const dossierText = buildDossier(targetDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(targetDir, 'dossier.json'), dossierText);
console.log(`Wrote ${join(targetDir, 'dossier.json')}`);
