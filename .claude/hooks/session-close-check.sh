#!/bin/bash
# Session close guard — warns if uncommitted or unpushed work remains.
# Runs as a Stop hook in .claude/settings.json.

UNCOMMITTED=$(git status --porcelain 2>/dev/null | grep -v '^\?\?' | wc -l)
UNTRACKED=$(git status --porcelain 2>/dev/null | grep '^\?\?' | wc -l)
UNPUSHED=$(git log --oneline @{u}..HEAD 2>/dev/null | wc -l)

ISSUES=0

if [ "$UNCOMMITTED" -gt 0 ] || [ "$UNTRACKED" -gt 0 ] || [ "$UNPUSHED" -gt 0 ]; then
  ISSUES=1
fi

if [ "$ISSUES" -eq 0 ]; then
  exit 0
fi

echo ""
echo "SESSION CLOSE CHECKLIST"
echo "================================================"

if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "UNCOMMITTED CHANGES ($UNCOMMITTED modified/staged files):"
  git status --short | grep -v '^\?\?' | head -10
fi

if [ "$UNTRACKED" -gt 0 ]; then
  echo "UNTRACKED FILES ($UNTRACKED files — check if they should be committed):"
  git status --short | grep '^\?\?' | head -5
fi

if [ "$UNPUSHED" -gt 0 ]; then
  echo "UNPUSHED COMMITS ($UNPUSHED commits not yet on remote):"
  git log --oneline origin/main..HEAD | head -5
fi

echo ""
echo "Work is NOT complete until pushed. Run:"
echo "  git add <files> && git commit -m '...' && git pull --rebase && git push"
echo "  bd dolt push"
echo "================================================"
