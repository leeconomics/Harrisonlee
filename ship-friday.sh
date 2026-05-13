#!/usr/bin/env bash
# ship-friday.sh — Weekly Friday 4pm publish job.
# Copies all .md files from memos/polishing/ → live-site/posts/,
# validates wikilinks, commits, pushes, then archives shipped files.

set -euo pipefail

REPO_DIR="$(dirname "$0")"
MEMOS_DIR="$(dirname "$0")/../memos"
POLISHING_DIR="$MEMOS_DIR/polishing"
ARCHIVE_DIR="$MEMOS_DIR/archive"
NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"

cd "$REPO_DIR"

# ── Load SSH key ──────────────────────────────────────────────────────────────
ssh-add -l &>/dev/null || ssh-add --apple-use-keychain ~/.ssh/id_ed25519_github 2>/dev/null || true

# ── Check for memos to ship ───────────────────────────────────────────────────
shopt -s nullglob
files=("$POLISHING_DIR"/*.md)
if [ ${#files[@]} -eq 0 ]; then
  echo "Nothing in polishing/ — skipping."
  exit 0
fi

echo "📬 Found ${#files[@]} memo(s) to ship:"
for f in "${files[@]}"; do echo "  - $(basename "$f")"; done

# ── Copy to posts/ ────────────────────────────────────────────────────────────
echo ""
echo "📁 Copying to posts/..."
for f in "${files[@]}"; do
  cp "$f" "$REPO_DIR/posts/$(basename "$f")"
  echo "  ✓ $(basename "$f")"
done

# ── Validate wikilinks ────────────────────────────────────────────────────────
echo ""
echo "🔗 Checking wikilinks..."
$NODE scripts/check-wikilinks.mjs

# ── Commit + push ─────────────────────────────────────────────────────────────
echo ""
git config user.email "leeconomics@users.noreply.github.com"
git config user.name "leeconomics"

MEMO_NAMES=$(for f in "${files[@]}"; do basename "$f" .md; done | paste -sd ", ")
git add posts/
git commit -m "Publish: $MEMO_NAMES"

echo "🚀 Pushing..."
git push origin main

# ── Archive shipped files ─────────────────────────────────────────────────────
mkdir -p "$ARCHIVE_DIR"
for f in "${files[@]}"; do
  mv "$f" "$ARCHIVE_DIR/$(basename "$f")"
done
echo ""
echo "📦 Archived ${#files[@]} memo(s) to memos/archive/"
echo ""
echo "✅ Done. Vercel deploying in ~90s."
for f in "${files[@]}"; do
  slug=$(basename "$f" .md)
  echo "   https://harrisonlee.vercel.app/posts/$slug"
done
