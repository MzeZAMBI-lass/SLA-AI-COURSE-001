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


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
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

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
