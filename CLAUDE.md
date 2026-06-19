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


planning.md — full architecture, schema, sprints, and rationale
docs/ — operations guide, API reference
src/ — application code (apps/api, apps/web, packages/shared)


How We Work


Follow the sprint order in planning.md §16; don't skip ahead to Phase 2 features (notifications, optimization engine) before MVP sprints are done.
Match the stack already chosen: Node.js/Express + Next.js + Supabase (PostgreSQL/PostGIS) + Leaflet.js — don't introduce new frameworks without discussion.
Every new endpoint needs auth middleware and webhook signature verification before merge.
Write unit tests for parsing/geocoding/routing logic; target 70%+ coverage on business logic.
Keep the dashboard simple enough for non-technical staff — no feature ships without a one-glance, low-click workflow.
