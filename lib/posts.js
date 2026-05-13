// lib/posts.js
// Loads markdown articles from /posts at build time.
// Each .md has YAML frontmatter (title, sub, cats, etc.) + markdown body.
// Returns lightweight metadata for the homepage feed and full HTML for the modal viewer.

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const POSTS_DIR = path.join(process.cwd(), 'posts');

// Configure marked: allow raw HTML inside markdown (for pull-quote, ascii-chart, framework-grid).
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false,
  mangle: false,
});

function readPostFile(filename) {
  const fullPath = path.join(POSTS_DIR, filename);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const slug = data.slug || filename.replace(/\.md$/, '');
  return { data, content, slug, filename };
}

// First-paragraph styling: wrap the first <p>...</p> with class "lede".
// Matches the existing site convention (Memo1 etc. use <p className="lede">).
function applyLedeClass(html) {
  return html.replace(/<p>/, '<p class="lede">');
}

// ─── Wikilink pre-processor ──────────────────────────────────────────────────
// Transforms Obsidian-style [[slug]] and [[slug|display text]] into standard
// markdown links pointing at /posts/<slug>. Runs before marked.parse so the
// output is just a normal hyperlink in the rendered HTML.
//
// Authoring convention (see NAMING-CONVENTIONS.md):
//   - Wikilink targets must match a shipped memo's filename basename in
//     live-site/posts/ (which now equals the URL slug — they're the same string).
//   - Drafts are NOT linkable; the build hard-fails on unresolved targets.
//
// Why hard-fail: a silent broken link is worse than a loud one. If a target
// doesn't resolve, surface it so the source memo or the target's slug can be
// fixed before shipping.

let _slugSetCache = null;
function getSlugSet() {
  if (_slugSetCache) return _slugSetCache;
  const set = new Set();
  if (!fs.existsSync(POSTS_DIR)) {
    _slugSetCache = set;
    return set;
  }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const fileContents = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const { data } = matter(fileContents);
    const slug = data.slug || f.replace(/\.md$/, '');
    set.add(slug);
  }
  _slugSetCache = set;
  return set;
}

function transformWikilinks(content, sourceFile) {
  const slugs = getSlugSet();
  return content.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (match, target, alias) => {
    const slug = target.trim();
    if (!slugs.has(slug)) {
      throw new Error(
        `Unresolved wikilink [[${slug}]] in ${sourceFile || 'unknown'}. ` +
        `Either the target doesn't exist in live-site/posts/, or the slug is mistyped. ` +
        `Wikilinks must target shipped memos by their slug (e.g. [[why-being-lost]]).`
      );
    }
    const text = alias ? alias.trim() : slug;
    return `[${text}](/posts/${slug})`;
  });
}

function renderHtml(content, sourceFile) {
  const transformed = transformWikilinks(content, sourceFile);
  const raw = marked.parse(transformed);
  return applyLedeClass(raw);
}

// Sort by date descending (newest first).
function sortByDateDesc(a, b) {
  const da = new Date(a.date || 0).getTime();
  const db = new Date(b.date || 0).getTime();
  return db - da;
}

// Public: list of all posts with metadata only (no body).
// Used by the homepage feed (Currents layer).
export function getAllPostsMeta() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(f => {
    const { data, slug } = readPostFile(f);
    return {
      id: data.id ?? null,
      n: data.n ?? '',
      slug,
      tag: data.tag ?? '',
      title: data.title ?? '',
      sub: data.sub ?? data.subtitle ?? '',
      subtitle: data.subtitle ?? data.sub ?? '',
      cats: data.cats ?? [],
      read: data.read ?? '',
      readTime: data.readTime ?? data.read ?? '',
      date: data.date ?? '',
      displayDate: data.displayDate ?? '',
      listDate: data.listDate ?? data.displayDate ?? '',
    };
  });
  return posts.sort(sortByDateDesc);
}

// Public: full post (metadata + rendered HTML body) for a single slug.
// Used by the modal viewer and individual article pages.
export function getPostBySlug(slug) {
  if (!fs.existsSync(POSTS_DIR)) return null;
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const post = readPostFile(f);
    if (post.slug === slug) {
      return {
        id: post.data.id ?? null,
        slug: post.slug,
        tag: post.data.tag ?? '',
        title: post.data.title ?? '',
        subtitle: post.data.subtitle ?? post.data.sub ?? '',
        cats: post.data.cats ?? [],
        readTime: post.data.readTime ?? post.data.read ?? '',
        displayDate: post.data.displayDate ?? '',
        contentHtml: renderHtml(post.content, post.filename),
      };
    }
  }
  return null;
}

// Public: list of all post slugs (for getStaticPaths if we add direct article routes).
export function getAllPostSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => readPostFile(f).slug);
}

// Public: rendered HTML body for every post, keyed by id.
// Used to pass full article content into PersonalSite for the modal viewer
// without having to fetch lazily on click.
export function getAllPostsContentById() {
  if (!fs.existsSync(POSTS_DIR)) return {};
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const out = {};
  for (const f of files) {
    const post = readPostFile(f);
    const id = post.data.id;
    if (id == null) continue;
    out[id] = {
      tag: post.data.tag ?? '',
      title: post.data.title ?? '',
      subtitle: post.data.subtitle ?? post.data.sub ?? '',
      cats: post.data.cats ?? [],
      readTime: post.data.readTime ?? post.data.read ?? '',
      displayDate: post.data.displayDate ?? '',
      contentHtml: renderHtml(post.content, post.filename),
    };
  }
  return out;
}
