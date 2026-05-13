#!/usr/bin/env bash
# ship-28.sh — Ship memo #28 (eyes-of-the-beholder) + URL-slug rename + wikilink infra.
#
# Run this on your Mac. The Cowork sandbox can't unlink the .git/*.lock files
# (bindfs blocks it) and has no GitHub credentials, so the actual commit/push
# has to happen on your filesystem with your SSH key.
#
# Usage:
#   cd "~/Documents/Claude/Projects/Memo Writer/live-site"
#   bash ship-28.sh
#
# What it does:
#   1. Clears stale git lock files (sandbox leftovers)
#   2. Resets the half-finished `01-...` → `01_opinion_...` rename refactor
#      (working tree already supersedes with clean URL-slug filenames)
#   3. Stages: new memo, hero SVG, lib/posts.js (wikilink transformer),
#      package.json (check-wikilinks script), scripts/, and the 27 renamed posts
#   4. Runs the wikilink check (hard-fails on broken targets)
#   5. Commits and pushes to origin/main (Vercel auto-deploys)

set -euo pipefail

cd "$(dirname "$0")"

# ── 1. Clear stale locks ─────────────────────────────────────────────────────
for lock in .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock; do
  if [ -f "$lock" ]; then
    echo "🧹 Removing stale $lock"
    rm -f "$lock"
  fi
done

# ── 2. Reset the abandoned rename refactor ──────────────────────────────────
# The working tree already has clean URL-slug filenames (audacity-tax.md etc.)
# which supersedes the staged `27_reflection_audacity-tax.md` style. Discard
# the staged renames so git diffs cleanly against current working tree.
echo "↺ Resetting staged rename refactor..."
git reset HEAD > /dev/null

# ── 3. Validate wikilinks before shipping ───────────────────────────────────
echo "🔗 Checking wikilinks..."
node scripts/check-wikilinks.mjs

# ── 4. Show what we're about to ship ────────────────────────────────────────
echo ""
echo "📦 About to ship:"
git status --short

echo ""
read -p "Proceed with commit + push? [y/N] " -r REPLY
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted. Nothing committed or pushed."
  exit 1
fi

# ── 5. Stage, commit, push ──────────────────────────────────────────────────
git add -A
git commit -m "Add memo #28 (eyes-of-the-beholder); rename posts to URL-slug; wikilink transformer

- New post: posts/eyes-of-the-beholder.md + public/posts/eyes-of-the-beholder.svg
- Rename all 27 existing posts from NN-slug.md → slug.md so filename = URL = wikilink target
- Add [[wikilink]] pre-processor in lib/posts.js (transforms Obsidian-style links to /posts/<slug>)
- Add scripts/check-wikilinks.mjs validator + npm run check-wikilinks
- Add scripts/test-transform.mjs
"

echo "🚀 Pushing to origin/main..."
git push origin main

echo ""
echo "✅ Pushed. Vercel will deploy in ~90 seconds."
echo "🌐 https://harrisonlee.vercel.app/posts/eyes-of-the-beholder"
echo "🌐 https://blog.harrisonlee.dev/posts/eyes-of-the-beholder"
