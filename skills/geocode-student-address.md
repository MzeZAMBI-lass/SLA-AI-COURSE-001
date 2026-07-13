# Skill: Geocode student address

Use when converting a parsed address or coordinates into a validated location for route assignment.

## When to use

- A student address was parsed from WhatsApp but has no confirmed coordinates yet
- You need to compute road distance from home to school or nearest bus stop
- Geocoding confidence is below threshold and staff review is required

## Steps

1. Check geocoding cache first — never re-call Nominatim for unchanged addresses.
2. Enforce **1 request/second** rate limit to Nominatim (free tier hard limit).
3. Call `apps/api/src/services/geocoding.ts` and read `geocode_confidence`.
4. If confidence **< `GEOCODE_CONFIDENCE_THRESHOLD`**:
   - Insert into pending review queue
   - Show flag in dashboard `apps/web/app/dashboard/pending/page.tsx`
   - Do **not** auto-assign to a route
5. If confidence is acceptable:
   - Call OpenRouteService via `apps/api/src/services/routing.ts`
   - Store result in `student_locations` as PostGIS geometry
   - Cache ORS result (2,000 req/day limit)

## Gotchas

- Never store raw lat/lng in logs or plaintext columns — use PostGIS geometry.
- ORS and Nominatim free tiers will block the account if rate limits are exceeded.
- Low-confidence geocodes in Tanzanian informal settlements are common — flag, don't guess.

## Files to touch

| File | Action |
|------|--------|
| `apps/api/src/services/geocoding.ts` | Nominatim client + cache |
| `apps/api/src/services/routing.ts` | ORS distance/time |
| `apps/web/app/dashboard/pending/page.tsx` | Staff review UI |
| `supabase/migrations/` | Schema changes only via migrations |
