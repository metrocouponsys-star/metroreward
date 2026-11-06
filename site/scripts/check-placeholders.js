#!/usr/bin/env node

/**
 * check-placeholders.js
 * Scans site/src for [[FILL markers and fails the build unless
 * ALLOW_PLACEHOLDERS=1 is set in the environment.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = join(__dirname, '..', 'src');
const MARKER = /\[\[FILL[:\s]/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (/\.(ts|tsx|astro|md|mdx|css|html)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  if (process.env.ALLOW_PLACEHOLDERS === '1') {
    console.log('⚠  ALLOW_PLACEHOLDERS=1 — skipping placeholder check.');
    process.exit(0);
  }

  const files = await walk(srcDir);
  const hits = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].matchAll(MARKER);
      for (const m of matches) {
        hits.push({
          file: relative(join(__dirname, '..'), file),
          line: i + 1,
          text: lines[i].trim().slice(0, 120),
        });
      }
    }
  }

  if (hits.length === 0) {
    console.log('✓  No [[FILL markers found. Ready to ship.');
    process.exit(0);
  }

  console.error(`\n✗  Found ${hits.length} [[FILL marker(s) that must be filled before launch:\n`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}`);
    console.error(`    ${h.text}\n`);
  }
  console.error('Set ALLOW_PLACEHOLDERS=1 to build anyway (dev only).\n');
  process.exit(1);
}

main();

