CLAUDE.md

Purpose


Automates school bus route planning for school administrators. The primary goal is reducing manual route assignment while ensuring student locations are validated before any routing decisions are made.

Hard Rules


Student privacy takes priority over convenience, automation, and analytics.
Never commit API keys, tokens, or .env files; use environment variables only.
Never store raw student location data unencrypted at rest, and never log lat/lng or phone numbers in plaintext.
Use official WhatsApp Business API (360dialog/Twilio) in production; unofficial libraries (whatsapp-web.js) are pilot/test-only.
Geocoding confidence below threshold must be flagged for staff review, never silently auto-assigned.
Stay within free-tier API limits (ORS: 2,000 req/day, Nominatim: 1 req/sec) — cache results, don't re-geocode unchanged addresses.


Pointers


SKILL.md — full project skills reference: core purpose, tech stack, conventions, common tasks, and constraints
planning.md — full architecture, schema, sprints, and rationale
docs/ — operations guide, API reference
src/ — application code (apps/api, apps/web, packages/shared)


How We Work


Follow the sprint order in planning.md §16; don't skip ahead to Phase 2 features (notifications, optimization engine) before MVP sprints are done.
Match the stack already chosen: Node.js/Express + Next.js + Supabase (PostgreSQL/PostGIS) + Leaflet.js — don't introduce new frameworks without discussion.
Every new endpoint needs auth middleware and webhook signature verification before merge.
Write unit tests for parsing/geocoding/routing logic; target 70%+ coverage on business logic.
Keep the dashboard simple enough for non-technical staff — no feature ships without a one-glance, low-click workflow.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
