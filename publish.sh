#!/usr/bin/env bash
# publish.sh — Ship live-site/ contents to GitHub (and onward to Vercel).
#
# Lives inside live-site/. Pushes from this folder's git clone.
# No rsync. No --delete. No Currents/.
# You move files into posts/ yourself (e.g. mv memos/polishing/foo.md
# live-site/posts/foo.md) before running this. This script just commits
# whatever's in the working tree and pushes.
#
# Usage:
#   bash publish.sh                              # default commit message
#   bash publish.sh "Add memo: tidepool theory"  # your own commit message

set -euo pipefail

# Resolve SITE_DIR from where this script is located — works no matter where
# it's invoked from. Avoids hardcoded ~/Documents paths.
SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$SITE_DIR/.git" ]; then
  echo "❌ $SITE_DIR is not a git repo. publish.sh must live inside live-site/."
  exit 1
fi

cd "$SITE_DIR"

# ── Self-heal: clear stale git locks from macOS xattr quirks ────────────────
for lock in .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock; do
  [ -f "$lock" ] && rm -f "$lock"
done

# ── Commit identity (Vercel Hobby plan requires the noreply alias) ──────────
git config user.email "leeconomics@users.noreply.github.com"
git config user.name "leeconomics"

# ── Pull latest first to avoid divergent branches ───────────────────────────
echo "🌊 Pulling latest from origin/main..."
git pull --rebase --autostash origin main 2>&1 || {
  echo "⚠️  Pull failed. Resolve manually before re-running."
  exit 1
}

# ── See what's about to ship ────────────────────────────────────────────────
WORKING=$(git status --porcelain | wc -l | tr -d ' ')
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

if [ "$WORKING" = "0" ] && [ "$AHEAD" = "0" ]; then
  echo "✅ Nothing to ship. Working tree clean and in sync with origin."
  exit 0
fi

echo ""
echo "📋 About to ship the following:"
if [ "$WORKING" != "0" ]; then
  echo "  Working-tree changes:"
  git status --short | sed 's/^/    /'
fi
if [ "$AHEAD" != "0" ]; then
  echo "  Commits already ahead of origin:"
  git log --oneline origin/main..HEAD | sed 's/^/    /'
fi
echo ""

# ── Commit any working-tree changes ─────────────────────────────────────────
if [ "$WORKING" != "0" ]; then
  MSG="${1:-Update site}"
  echo "💾 Committing: $MSG"
  git add -A
  git commit -m "$MSG"
fi

# ── Push ────────────────────────────────────────────────────────────────────
echo "🚀 Pushing to GitHub..."
git push origin main

# ── Echo destinations ───────────────────────────────────────────────────────
echo ""
echo "✅ Pushed. Vercel rebuilds in ~90 seconds."
echo "🌐 https://harrisonlee.vercel.app"
echo "📊 https://vercel.com/leeconomics/harrisonlee"
