#!/usr/bin/env python3
"""
Auto-prep raw memo uploads in Currents/ before publishing.

Designed to be called from publish.sh BEFORE rsync. Stdlib only (no pip deps).

Logic:
  1. Scan ~/Documents/Claude/Projects/Memo Writer/Currents/*.md
  2. For each file, detect if it's a "raw upload" (missing site-format fields)
  3. If raw, convert frontmatter to site format:
       - assign next available id (max existing + 1)
       - generate slug from filename or title
       - rename file to <id>-<slug>.md
       - normalize cats, read, dates
  4. If a sibling .svg exists with matching filename stem (before rename),
     move it to site/public/posts/<slug>.svg and inject <div class="memo-hero">
     at the top of the body.
  5. Print summary to stdout (publish.sh will surface it).

Site-format required frontmatter fields:
  id, n, slug, tag, title, sub, subtitle, cats, read, readTime,
  date, displayDate, listDate

Detection: a file is "raw" and needs conversion if ANY of:
  - has 'categories:' (raw uploads use categories instead of cats)
  - has 'read_time:'
  - has 'status:' (only raw uploads carry draft status)
  - missing 'id:' field
  - missing 'slug:' field
"""

import re
import sys
import shutil
from datetime import date
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
HOME         = Path.home()
PROJECT_ROOT = HOME / "Documents" / "Claude" / "Projects" / "Memo Writer"
CURRENTS     = PROJECT_ROOT / "Currents"
SITE_POSTS   = PROJECT_ROOT / "site" / "posts"
PUBLIC_POSTS = PROJECT_ROOT / "site" / "public" / "posts"

# ── Frontmatter helpers ──────────────────────────────────────────────────────

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n+", re.DOTALL)

def parse_frontmatter(text):
    """Return (fm_dict, body) — fm_dict preserves raw string values."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    fm_raw = m.group(1)
    body   = text[m.end():]
    fm = {}
    for line in fm_raw.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm, body

def needs_conversion(fm):
    """Return True if this file has raw-upload frontmatter that needs prepping."""
    if fm is None:
        return False  # no frontmatter is a hard fail, handled separately
    raw_markers   = {"categories", "read_time", "status"}
    required_site = {"id", "slug"}
    has_raw       = bool(set(fm.keys()) & raw_markers)
    missing_site  = bool(required_site - set(fm.keys()))
    return has_raw or missing_site

def parse_list_field(raw):
    """'[A, B, C]' → ['A','B','C']."""
    inner = raw.strip().strip("[]").strip("'\"")
    return [c.strip().strip("'\"") for c in inner.split(",") if c.strip()]

def slugify(s):
    """Convert string to kebab-case slug."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s

def strip_filename_prefix(name):
    """'07_six-steps-to-an-agent.md' → 'six-steps-to-an-agent'."""
    stem = Path(name).stem
    # strip leading digits + underscore/dash
    stem = re.sub(r"^\d+[_\-]?", "", stem)
    return stem

# ── Existing-id discovery ────────────────────────────────────────────────────

def all_existing_ids():
    """Scan Currents/ and site/posts/ for the highest used id."""
    ids = set()
    for folder in [CURRENTS, SITE_POSTS]:
        if not folder.exists():
            continue
        for f in folder.glob("*.md"):
            text = f.read_text(encoding="utf-8", errors="replace")
            fm, _ = parse_frontmatter(text)
            if fm and "id" in fm:
                try:
                    ids.add(int(fm["id"].strip().strip('"').strip("'")))
                except (ValueError, TypeError):
                    pass
    return ids

# ── Frontmatter builder ──────────────────────────────────────────────────────

def build_site_frontmatter(meta):
    cats_str = "[" + ", ".join(meta["cats"]) + "]"
    return (
        "---\n"
        f"id: {meta['id']}\n"
        f"n: \"{meta['id']}\"\n"
        f"slug: {meta['slug']}\n"
        f"tag: \"Note {meta['id']}\"\n"
        f"title: \"{meta['title']}\"\n"
        f"sub: \"{meta['sub']}\"\n"
        f"subtitle: \"{meta['subtitle']}\"\n"
        f"cats: {cats_str}\n"
        f"read: \"{meta['read']}\"\n"
        f"readTime: \"{meta['read']} read\"\n"
        f"date: \"{meta['date']}\"\n"
        f"displayDate: \"{meta['display_date']}\"\n"
        f"listDate: \"{meta['list_date']}\"\n"
        "---\n\n"
    )

def yaml_safe_string(s):
    """Replace inner straight double-quotes with curly to keep YAML valid."""
    if '"' not in s:
        return s
    # Match alternating: open with opening curly, close with closing curly
    out = []
    in_quote = False
    for ch in s:
        if ch == '"':
            out.append("”" if in_quote else "“")
            in_quote = not in_quote
        else:
            out.append(ch)
    return "".join(out)

# ── Date helpers ─────────────────────────────────────────────────────────────

def today_dates():
    today = date.today()
    iso = today.isoformat()
    display = today.strftime("%B %Y")  # e.g. "May 2026"
    list_d = today.strftime("%-d %B %Y")  # e.g. "1 May 2026"
    return iso, display, list_d

# ── Hero image attach ────────────────────────────────────────────────────────

def attach_hero_if_present(orig_path, slug, body):
    """If a sibling SVG exists, move to public/posts/ and prepend hero <div>."""
    candidates = []
    # Same stem as original .md
    candidates.append(orig_path.with_suffix(".svg"))
    # Match slug
    candidates.append(orig_path.parent / f"{slug}.svg")

    for svg in candidates:
        if svg.exists():
            PUBLIC_POSTS.mkdir(parents=True, exist_ok=True)
            target = PUBLIC_POSTS / f"{slug}.svg"
            shutil.copy2(svg, target)
            try:
                svg.unlink()
            except PermissionError:
                pass  # macOS xattr issue; not fatal
            hero = (
                f'<div class="memo-hero">\n'
                f'  <img src="/posts/{slug}.svg" alt="" loading="eager" />\n'
                f'</div>\n\n'
            )
            return hero + body.lstrip("\n"), True
    return body, False

# ── Main conversion ──────────────────────────────────────────────────────────

def convert_file(orig_path, used_ids):
    """Convert a raw-upload .md to site format. Returns (new_path, summary)."""
    text = orig_path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)

    if fm is None:
        return None, f"  ✗ {orig_path.name}: no frontmatter — skipping"

    # Title (required)
    title = fm.get("title", "").strip().strip('"').strip("'")
    if not title:
        return None, f"  ✗ {orig_path.name}: missing title — skipping"

    # Subtitle
    subtitle = fm.get("subtitle", fm.get("sub", "")).strip().strip('"').strip("'")
    sub      = fm.get("sub", subtitle).strip().strip('"').strip("'")
    if len(sub) > 110:
        sub = sub[:107].rstrip() + "..."

    # Categories
    raw_cats = fm.get("cats") or fm.get("categories") or "[]"
    cats     = parse_list_field(raw_cats)
    if not cats:
        cats = ["Business"]

    # Read time
    read_raw = fm.get("read") or fm.get("readTime") or fm.get("read_time") or "5 min"
    read     = re.sub(r"\s*read\s*$", "", read_raw.strip().strip('"'))

    # Slug — prefer existing, else derive from filename, else from title
    slug = fm.get("slug", "").strip().strip('"').strip("'")
    if not slug:
        slug = slugify(strip_filename_prefix(orig_path.name))
        if not slug:
            slug = slugify(title)

    # ID — assign next free
    if "id" in fm and fm["id"].strip().strip('"').isdigit():
        memo_id = int(fm["id"].strip().strip('"'))
    else:
        memo_id = max(used_ids) + 1 if used_ids else 1
        used_ids.add(memo_id)

    # Dates
    iso, display, list_d = today_dates()

    meta = {
        "id":           memo_id,
        "slug":         slug,
        "title":        yaml_safe_string(title),
        "sub":          yaml_safe_string(sub),
        "subtitle":     yaml_safe_string(subtitle),
        "cats":         cats,
        "read":         read,
        "date":         iso,
        "display_date": display,
        "list_date":    list_d,
    }

    # Hero image attach (mutates body if SVG sibling exists)
    body, has_hero = attach_hero_if_present(orig_path, slug, body)

    new_content = build_site_frontmatter(meta) + body.lstrip("\n")
    new_name    = f"{memo_id:02d}-{slug}.md"
    new_path    = orig_path.parent / new_name

    new_path.write_text(new_content, encoding="utf-8")

    # Remove original if name changed
    if new_path != orig_path:
        try:
            orig_path.unlink()
        except PermissionError:
            print(f"  ⚠  could not remove old {orig_path.name} (macOS xattr); please delete manually", file=sys.stderr)

    hero_note = " + hero SVG" if has_hero else ""
    return new_path, f"  ✓ {orig_path.name} → {new_name} (id {memo_id}, cats {cats}){hero_note}"

# ── Entry point ──────────────────────────────────────────────────────────────

def main():
    if not CURRENTS.exists():
        print(f"  ⚠  Currents/ not found at {CURRENTS}", file=sys.stderr)
        return 1

    # Find files needing conversion
    candidates = []
    for f in sorted(CURRENTS.glob("*.md")):
        text = f.read_text(encoding="utf-8", errors="replace")
        fm, _ = parse_frontmatter(text)
        if needs_conversion(fm):
            candidates.append(f)

    if not candidates:
        print("✨ Prep: no raw uploads found, all memos already in site format")
        return 0

    print(f"🔧 Prep: converting {len(candidates)} raw upload(s)...")
    used_ids = all_existing_ids()
    for f in candidates:
        new_path, msg = convert_file(f, used_ids)
        print(msg)
        if new_path:
            text = new_path.read_text(encoding="utf-8")
            fm, _ = parse_frontmatter(text)
            if fm and "id" in fm:
                try:
                    used_ids.add(int(fm["id"]))
                except ValueError:
                    pass

    return 0

if __name__ == "__main__":
    sys.exit(main())
