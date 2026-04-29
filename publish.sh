#!/usr/bin/env bash
# publish.sh — One-keystroke ship for harrisonlee.vercel.app
# ───────────────────────────────────────────────────────────
# What this does:
#   1. Goes into the site/ folder (the live git clone)
#   2. Sets the per-repo commit author email (Vercel Hobby gotcha)
#   3. Pulls latest from main (avoids merge conflicts)
#   4. Syncs ~/Documents/Claude/Projects/Memo Writer/Currents/*.md → site/posts/
#   5. Stages, commits with an auto-generated message, pushes via SSH
#   6. Echoes the live URL of any new posts
#
# Usage:
#   hl-ship              # if alias is configured in ~/.zshrc
#   ./publish.sh         # direct invocation
#
# Requirements (one-time setup, already done as of 2026-04-29):
#   - SSH key on this Mac, registered with GitHub (leeconomics account)
#   - This script is in ~/Documents/Claude/Projects/Memo Writer/site/
#   - Repo cloned via SSH URL (git@github.com:leeconomics/Harrisonlee.git)

set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
SITE_DIR="$HOME/Documents/Claude/Projects/Memo Writer/site"
CURRENTS_DIR="$HOME/Documents/Claude/Projects/Memo Writer/Currents"
POSTS_DIR="$SITE_DIR/posts"

# ── Sanity checks ────────────────────────────────────────────────────────────
if [ ! -d "$SITE_DIR/.git" ]; then
  echo "❌ ERROR: $SITE_DIR is not a git repo. Did the clone fail?"
  exit 1
fi

if [ ! -d "$CURRENTS_DIR" ]; then
  echo "❌ ERROR: Currents/ folder not found at $CURRENTS_DIR"
  exit 1
fi

cd "$SITE_DIR"

# ── Self-heal: clean up any leftover .git/index.lock ─────────────────────────
# When Cowork's sandbox stages a commit but can't unlink the lock due to macOS
# extended attributes, the lock survives. Harry's Mac CAN delete it (he owns
# the filesystem). Auto-clear at the start of every ship to avoid manual rm.
if [ -f .git/index.lock ]; then
  echo "🧹 Removing stale .git/index.lock"
  rm -f .git/index.lock
fi

# ── Vercel email gotcha — set per-repo author ──────────────────────────────
# Vercel Hobby plan rejects deploys whose commit author email doesn't match the
# project owner. Force the noreply alias so this never breaks.
git config user.email "leeconomics@users.noreply.github.com"
git config user.name "leeconomics"

# ── Pull latest before doing anything ────────────────────────────────────────
echo "🌊 Pulling latest from main..."
git pull --rebase --autostash origin main 2>/dev/null || {
  echo "⚠️  Pull failed (probably first run after clone). Continuing..."
}

# ── Sync Currents/ → site/posts/ ──────────────────────────────────────────────
# rsync handles new files, deletions, and changes. --delete removes posts that
# were removed from Currents/ (e.g. archived). Comment out --delete if you want
# additive-only behavior.
echo "📁 Syncing Currents/ → site/posts/..."
rsync -av --delete \
  --exclude=".DS_Store" \
  --exclude=".git" \
  "$CURRENTS_DIR/" "$POSTS_DIR/"

# ── Detect changes ────────────────────────────────────────────────────────────
if git diff --quiet && git diff --cached --quiet; then
  echo "✅ No changes to publish. Repo is in sync with Currents/."
  exit 0
fi

# ── Build a commit message from changed memo titles ─────────────────────────
CHANGED_FILES=$(git status --porcelain posts/ | awk '{print $2}' | grep '\.md$' || true)
if [ -z "$CHANGED_FILES" ]; then
  COMMIT_MSG="Update site"
else
  COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
  if [ "$COUNT" = "1" ]; then
    SLUG=$(basename "$CHANGED_FILES" .md)
    COMMIT_MSG="Publish: $SLUG"
  else
    COMMIT_MSG="Publish: $COUNT memos updated"
  fi
fi

# Allow override via first arg
if [ "${1:-}" != "" ]; then
  COMMIT_MSG="$1"
fi

# ── Commit + push ─────────────────────────────────────────────────────────────
echo "💾 Committing: $COMMIT_MSG"
git add -A
git commit -m "$COMMIT_MSG"

echo "🚀 Pushing to GitHub via SSH..."
git push origin main

# ── Echo live URLs ────────────────────────────────────────────────────────────
echo ""
echo "✅ Pushed. Vercel will deploy in ~90 seconds."
echo ""

# Try to extract slugs from changed posts and print live URLs
if [ -n "$CHANGED_FILES" ]; then
  echo "Live URLs once Vercel finishes building:"
  echo "$CHANGED_FILES" | while read -r f; do
    if [ -f "$f" ]; then
      SLUG=$(grep -E "^slug:" "$f" | head -1 | sed 's/slug: *//' | tr -d '"' | tr -d "'" | xargs)
      if [ -n "$SLUG" ]; then
        echo "  https://harrisonlee.vercel.app/posts/$SLUG"
      fi
    fi
  done
fi

VERCEL_URL="https://vercel.com/leeconomics/harrisonlee"
SITE_URL="https://harrisonlee.vercel.app"

echo ""
echo "📊 Deploy dashboard: $VERCEL_URL"
echo "🌐 Live site:        $SITE_URL"

# ── Auto-open the Vercel dashboard so Harry can watch the build ───────────────
# `open` is macOS-native; falls back gracefully if missing.
if command -v open >/dev/null 2>&1; then
  echo ""
  echo "🪟 Opening Vercel dashboard in your browser to watch the build..."
  open "$VERCEL_URL"
fi

# ── macOS native notification once deploy URL is reachable ───────────────────
# Polls the live site root every 8 seconds (max 3 min) for an HTTP 200, then
# fires a banner. Backgrounded so the script returns immediately.
if command -v osascript >/dev/null 2>&1; then
  (
    for _ in $(seq 1 22); do
      sleep 8
      if curl -fsS -o /dev/null --max-time 4 "$SITE_URL"; then
        # Site is reachable — fire notification and exit
        osascript -e "display notification \"Vercel deploy is live: $SITE_URL\" with title \"Tidal — Deploy ready\" sound name \"Glass\""
        break
      fi
    done
  ) &
fi
