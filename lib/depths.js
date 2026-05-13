// lib/depths.js
// Loads multi-part series articles from /depths at build time.
// Each .md has YAML frontmatter (slug, title, sub, parts[]) + markdown body
// with ## Part N: ... headings that become anchor targets (#part-1 etc.).

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const DEPTHS_DIR = path.join(process.cwd(), 'depths');

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false,
  mangle: false,
});

// Inject id="part-N" into ## Part N: headings so the wave-fan chips can
// deep-link into individual sections (e.g. /depths/layered-places#part-3).
function withAnchors(html) {
  return html.replace(
    /<h2>Part (\d+):([^<]+)<\/h2>/g,
    (_m, num, rest) => `<h2 id="part-${num}" class="depth-part-heading">Part ${num}:${rest}</h2>`
  );
}

function readDepthFile(filename) {
  const full = path.join(DEPTHS_DIR, filename);
  const raw = fs.readFileSync(full, 'utf8');
  const { data, content } = matter(raw);
  const slug = data.slug || filename.replace(/\.md$/, '');
  return { data, content, slug };
}

export function getAllDepthsMeta() {
  if (!fs.existsSync(DEPTHS_DIR)) return [];
  return fs.readdirSync(DEPTHS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { data, slug } = readDepthFile(f);
      return {
        slug,
        title: data.title || slug,
        sub: data.sub || '',
        parts: data.parts || [],
        date: data.date || '',
      };
    });
}

export function getDepthBySlug(slug) {
  const filename = `${slug}.md`;
  const full = path.join(DEPTHS_DIR, filename);
  if (!fs.existsSync(full)) return null;
  const { data, content } = readDepthFile(filename);
  let html = marked.parse(content);
  html = withAnchors(html);
  return {
    slug: data.slug || slug,
    title: data.title || slug,
    sub: data.sub || '',
    parts: data.parts || [],
    date: data.date || '',
    html,
  };
}
