# Claude Code Workflow Skills

## Session Bootstrap

Every session auto-runs `bd prime` via SessionStart hook — this loads:
- All open/in_progress issues with context
- Blocked issues and their dependencies
- Session rules and mandatory close protocol

## Beads Issue Tracker

### Lifecycle
```
create → open → [claim] → in_progress → [in_review] → close
```

### Essential commands
```bash
bd ready                         # Available work (no blockers)
bd list --status=in_progress     # Active issues
bd show <id>                     # Full details + deps + notes
bd update <id> --claim           # Claim an issue
bd close <id1> <id2> ...         # Close multiple issues at once
bd stats                         # Project health overview
```

### Creating issues
```bash
bd create \
  --title="Short action-oriented title" \
  --description="Why this issue exists and what needs to be done" \
  --type=task|bug|feature \
  --priority=2
# Priority: 0=critical, 1=high, 2=medium (default), 3=low, 4=backlog
# WARNING: Never use bd edit — it opens $EDITOR and blocks agents
```

### Dependencies
```bash
bd dep add <child-id> <parent-id>   # child depends on parent (parent must close first)
bd blocked                           # Show all blocked issues
```

### Persistent knowledge
```bash
bd remember "insight text"           # Save across sessions
bd memories <keyword>                # Search saved knowledge
# Do NOT use MEMORY.md files — they fragment context
```

## Mandatory Session Close Protocol

**Work is NOT complete until `git push` succeeds.**

```bash
# Step 1: Check what changed
git status

# Step 2: Stage specific files (never git add -A)
git add <specific files>

# Step 3: Commit with descriptive message
git commit -m "descriptive message"

# Step 4: Pull + push
git pull --rebase
git push

# Step 5: Sync beads to remote
bd dolt push

# Step 6: Close all completed issues
bd close <id1> <id2> ...

# Step 7: Verify
git status   # must show "up to date with origin"
```

## Quality Gates

```bash
bd lint                          # Check issues for missing sections
bd doctor --check=conventions    # Stale, orphan, drift detection
bd preflight                     # Pre-PR checks
bd stale                         # Issues with no recent activity
bd orphans                       # Issues with broken deps
```

## Hooks Configured

| Hook | Command | Purpose |
|------|---------|---------|
| SessionStart | `bd prime` | Load full workflow context on session open |
| PreCompact | `bd prime` | Restore context after message compression |
| Stop | `session-close-check.sh` | Warn if uncommitted/unpushed work remains |

## Prohibited Actions

| Prohibited | Use instead |
|-----------|-------------|
| `TodoWrite` / `TaskCreate` | `bd create` |
| Markdown TODO lists | beads issues |
| `git add -A` or `git add .` | `git add <specific files>` |
| `bd edit` (opens $EDITOR) | `bd update <id> --field=value` |
| Committing `.env` or API keys | Environment variables only |
| Editing `.beads/` directly | `bd` CLI only |
| Writing to `MEMORY.md` | `bd remember "insight"` |

## Agent Patterns

### Spawn parallel subagents for bulk issue creation
When creating 3+ issues at once, use parallel Agent calls instead of sequential bd commands — saves time.

### Research before code
Always read `planning.md §16` for the current sprint before creating issues. Sprint order is mandatory.

### Scaffold pattern for new features
1. `bd create` the issue
2. `bd update <id> --claim`
3. Write code + tests
4. `bd close <id>`
5. Commit + push
