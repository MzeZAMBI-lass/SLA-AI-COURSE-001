# Project Skills: SLA-AI-COURSE-001

## 1. Project Core

**System**: Automated School Transport Route Planning for Silverleaf Academy
**Goal**: Reduce per-student bus route assignment from ~10 min to <30 sec by automating WhatsApp location ingestion, geocoding, road-distance calculation, and route assignment.

**Current state**: Planning phase complete. No source code yet. Ready for Sprint 1 (monorepo scaffold + Supabase schema + auth).

### Automation Pipeline (7 steps)
1. Parent sends WhatsApp message with home address, location pin, or Maps link
2. Webhook receiver accepts message and verifies HMAC signature
3. Message parser extracts location (coordinates, Maps link, or plain-text address)
4. Geocoding service converts address to lat/lng via Nominatim (confidence check)
5. Routing service calculates road distance + travel time via OpenRouteService
6. Assignment engine scores student against existing routes → suggests best match
7. Staff reviews pending assignment in dashboard → accepts/overrides → parent notified

### Key metrics
- Processing time target: <5 sec per student
- Cost ceiling: <$50 USD/month for 500 students
- Staff training: 30-minute orientation maximum

---

## 2. Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Backend API | Node.js + Express | Webhook receiver, REST endpoints |
| Frontend | Next.js 14 (App Router) | Staff operations dashboard |
| Database | Supabase (PostgreSQL + PostGIS) | Free tier, RLS, managed |
| Geocoding | Nominatim (primary) | Free; **hard limit: 1 req/sec** |
| Routing | OpenRouteService | Free tier; **hard limit: 2,000 req/day** |
| Maps UI | Leaflet.js | Open-source, no API key required |
| WhatsApp MVP | whatsapp-web.js | Pilot/test only — unofficial |
| WhatsApp prod | 360dialog or Twilio | Official Business API — required for production |
| Types | TypeScript (strict) | All packages |
| Deploy | Render.com or Railway | + Supabase hosted |

### Planned monorepo layout (from planning.md Appendix B)
```
apps/api/             Node.js + Express backend
apps/web/             Next.js 14 frontend
packages/shared/      TypeScript type definitions
supabase/migrations/  Database migrations
docs/                 Operations guide, API reference
```

### Database schema (6 tables)
| Table | Purpose |
|-------|---------|
| students | Core student records (name, grade, parent_phone, whatsapp_id) |
| routes | Bus route definitions (route_name, bus_number, capacity) |
| route_assignments | Student-to-route mapping (pickup_order, estimated_pickup_time, status) |
| student_locations | Geocoded data (PostGIS geometry, road_distance_km, geocode_confidence) |
| incoming_messages | WhatsApp log (raw_payload JSONB, processing_status) |
| schools | School location reference (lat/lng, start_time) |

---

## 3. Conventions

### Code style
- TypeScript strict mode throughout
- No API keys or .env files in git — environment variables only, documented in `.env.example`
- No lat/lng or phone numbers in logs (PII prohibition — hard rule)
- Every new endpoint: `authMiddleware` applied before merge
- Every webhook route: HMAC signature verification before processing

### Database
- All migrations in `supabase/migrations/` — never modify schema manually
- RLS enabled on every table — never disable
- Store coordinates as PostGIS geometry, not raw float columns
- Cache all geocoding and routing results — prevent redundant API calls

### Testing
- 70%+ unit test coverage on business logic (parser, geocoder, router, assignment engine)
- Integration tests: full pipeline (WhatsApp message → pending → assigned)
- Manual E2E with real WhatsApp messages before each phase completion

### Issue tracking (beads)
- All tasks tracked in `bd` — never use TodoWrite, TaskCreate, or markdown TODO lists
- `bd remember "insight"` for persistent cross-session knowledge (not MEMORY.md files)
- Create beads issue BEFORE writing code; mark `in_progress` when starting

---

## 4. Common Tasks

### Finding and starting work
```bash
bd ready                       # Issues with no blockers
bd show <id>                   # Details + deps + acceptance criteria
bd update <id> --claim         # Claim it
```

### Sprint kickoff
```bash
# 1. Read planning.md §16 for the current sprint tasks
# 2. Create all issues (use parallel subagents for many at once):
bd create --title="..." --description="..." --type=task --priority=2
# 3. Wire dependencies:
bd dep add <child-id> <parent-id>
# Rule: infrastructure tasks must be created and blocked-by before feature tasks
```

### Adding a new API endpoint
```bash
# 1. apps/api/src/routes/<name>.ts — add authMiddleware
# 2. For webhooks: add verifySignature middleware
# 3. apps/api/src/__tests__/<name>.test.ts — unit tests
# 4. docs/api-reference.md — update endpoint list
```

### Geocoding workflow
```bash
# 1. Call Nominatim (enforce 1 req/sec rate limit via cache + sleep)
# 2. if confidence < GEOCODE_CONFIDENCE_THRESHOLD:
#      → insert into pending_review, flag in dashboard
# 3. if confidence >= threshold:
#      → call ORS for road distance + travel time
#      → store in student_locations (PostGIS geometry)
```

### Daily wrap-up
```bash
# Run at end of session — agent reads notes/, beads, and git log, then writes log/YYYY-MM-DD.md
# Invoke via:
claude --agent daily-wrapup
# Output: log/2026-07-09.md with three sections: Done, Doing, Next + Notes from notes/
# See .claude/agents/daily-wrapup.md for full steps and output template
```

### Mandatory session close
```bash
git status                     # Verify what changed
git add <specific files>       # Never git add -A
git commit -m "message"
git pull --rebase
git push                       # MUST succeed — work is not done until pushed
bd dolt push                   # Sync beads to remote
bd close <id1> <id2> ...       # Close completed issues
```

---

## 5. Constraints

### Privacy (hard rules — never violate)
- Raw lat/lng and phone numbers must never appear in logs
- API keys and `.env` files must never be committed to git
- Student location data must be encrypted at rest and in transit
- RLS must be enabled on all Supabase tables at all times

### API rate limits (free tier — violating = service blocked)
- **Nominatim**: 1 request/second max — always check cache before calling
- **OpenRouteService**: 2,000 requests/day — always cache; never re-geocode unchanged addresses

### WhatsApp tier rules
- `whatsapp-web.js` = MVP/pilot only — unofficial library, ToS violation risk
- Production deployments must use 360dialog or Twilio official API
- Webhook HMAC signature verification required before any message processing

### Development scope
- Follow sprint order in planning.md §16 — no Phase 2 features before MVP is complete
- Stack is locked: Node.js/Express + Next.js + Supabase + Leaflet
- Dashboard must be usable by non-technical staff (no jargon, one-glance workflow)
- Never auto-assign a student with a low-confidence geocode — flag for staff review

### Sprint order summary (planning.md §16)
```
1.x  Monorepo scaffold → Supabase schema → Auth setup
2.x  WhatsApp webhook → Message parser → Geocoding service
3.x  Routing service → Assignment engine
4.x  Dashboard API → Dashboard UI → CSV export
5.x  WhatsApp notifications
6.x  E2E testing → Security hardening
7.x+ Route optimization, multi-school support, mobile
```
