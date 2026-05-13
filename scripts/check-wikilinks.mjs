#!/usr/bin/env node
// check-wikilinks.mjs — Validates that every [[slug]] in posts/*.md resolves
// to an actual shipped memo. Run before shipping (or as part of a pre-commit
// hook) so broken cross-links don't reach the live site.
//
// Usage:  node scripts/check-wikilinks.mjs
//         npm run check-wikilinks
//
// Exits 0 on clean, non-zero on any unresolved wikilink, with a list of
// offending files, lines, and missing targets.
//
// Zero-dependency: parses frontmatter with a regex so it can run anywhere
// Node is installed, without requiring `npm install`.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, '..', 'posts');

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`❌ posts/ folder not found at ${POSTS_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

// Split frontmatter from body. Returns { frontmatter: string, body: string }.
function splitFrontmatter(contents) {
  const m = contents.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: '', body: contents };
  return { frontmatter: m[1], body: m[2] };
}

// Extract the slug field from frontmatter, falls back to filename basename.
function extractSlug(frontmatter, filename) {
  const m = frontmatter.match(/^slug:\s*["']?([^"'\n]+?)["']?\s*$/m);
  if (m) return m[1].trim();
  return filename.replace(/\.md$/, '');
}

// Build the slug set from frontmatter (falls back to filename basename).
const slugs = new Set();
for (const f of files) {
  const contents = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
  const { frontmatter } = splitFrontmatter(contents);
  slugs.add(extractSlug(frontmatter, f));
}

// Scan every post body for [[...]] patterns and validate each target.
const wikiRe = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
const failures = [];
let totalLinks = 0;

for (const f of files) {
  const fullPath = path.join(POSTS_DIR, f);
  const contents = fs.readFileSync(fullPath, 'utf8');
  const { body } = splitFrontmatter(contents);
  const lines = body.split('\n');

  lines.forEach((line, idx) => {
    let match;
    wikiRe.lastIndex = 0;
    while ((match = wikiRe.exec(line)) !== null) {
      totalLinks += 1;
      const target = match[1].trim();
      if (!slugs.has(target)) {
        failures.push({
          file: f,
          line: idx + 1,
          target,
          context: line.trim().slice(0, 100),
        });
      }
    }
  });
}

if (failures.length === 0) {
  console.log(`✅ ${totalLinks} wikilink${totalLinks === 1 ? '' : 's'} checked across ${files.length} posts. All resolve.`);
  process.exit(0);
}

console.error(`❌ ${failures.length} unresolved wikilink${failures.length === 1 ? '' : 's'} found:\n`);
for (const fail of failures) {
  console.error(`  ${fail.file}:${fail.line}  [[${fail.target}]]`);
  console.error(`    ${fail.context}`);
}
console.error(`\nFix: either ship the target memo as posts/${failures[0].target}.md, correct the slug, or remove the link.`);
process.exit(1);
