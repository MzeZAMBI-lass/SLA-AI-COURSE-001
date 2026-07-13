# Skill: Review route assignment

Use when staff accept, override, or reject a pending student-to-route assignment in the dashboard.

## When to use

- Assignment engine has scored a student against existing routes and created a pending record
- Transport staff need to confirm or override the suggested route
- You are building or fixing dashboard flows in `apps/web/app/dashboard/`

## Steps

1. Load pending assignments from the assignments API (`apps/api/src/routes/assignments.ts`).
2. Display student name, grade, geocoded location (map pin), suggested route, distance, and confidence flag.
3. Staff actions: **Accept** (confirm assignment), **Override** (pick different route), **Reject** (send back to pending/geocoding).
4. On accept: update `route_assignments.status`, set `pickup_order` and `estimated_pickup_time`.
5. On override: log staff user ID and timestamp (audit trail requirement in `planning.md`).
6. Refresh dashboard map (`apps/web/components/Map/RouteMap.tsx`) after status change.

## Gotchas

- Dashboard must be usable by non-technical staff — no jargon, one-glance workflow.
- Never show raw lat/lng or phone numbers in the UI — use map pins and masked identifiers.
- Students with low geocode confidence must stay in pending until staff explicitly approves.

## Files to touch

| File | Action |
|------|--------|
| `apps/web/app/dashboard/pending/page.tsx` | Pending queue UI |
| `apps/web/app/dashboard/routes/page.tsx` | Route overview |
| `apps/api/src/routes/assignments.ts` | Assignment API |
| `apps/api/src/services/routeAssignment.ts` | Scoring engine |
