# Decision Log

A running record of real decisions made during the design and build of this system.
Each entry captures what we chose, why, and what we ruled out.

---

## Decision 1 — WhatsApp integration uses a tiered strategy, not a single approach

We decided to use two different WhatsApp integrations depending on the phase of the project.
In the MVP and internal pilot, we use `whatsapp-web.js` (an unofficial library that runs as a browser
session) on a dedicated test number. Once the system is proven in production, we migrate to the
official Meta WhatsApp Business API via a Business Solution Provider (360dialog or Twilio).

Why: The official API requires Meta business verification, which takes time and adds cost before
we know the system works. The unofficial library lets us validate the full pipeline fast, at zero
cost, with known parent contacts who have consented to the pilot.

What we ruled out:
- Going straight to the official API for the MVP — too much setup friction before the idea is proven.
- Using Baileys or other unofficial libraries — whatsapp-web.js is better documented and more stable.
- Staying on the unofficial library in production — Meta can ban the number at any time; this is
  only acceptable during a controlled internal test.

---

## Decision 2 — Mapping stack is OpenRouteService + Nominatim + Leaflet, not Google Maps

We decided to use OpenRouteService for road distance and travel time calculation, Nominatim (OpenStreetMap)
for geocoding text addresses, and Leaflet.js with OpenStreetMap tiles for the dashboard map. All three
are free and open-source.

Why: The monthly running cost target is under $50 USD for up to 500 students. Google Maps Platform
becomes expensive past the free credit — approximately $5 per 1,000 distance matrix requests, which
would add up as the student population grows. ORS gives us 2,000 free routing requests per day, well
above what 500 students requires at initial setup. Tanzania has good OpenStreetMap coverage in urban
areas, which is where this school operates.

What we ruled out:
- Google Maps Platform — accurate and familiar, but vendor lock-in and costs escalate fast.
- Mapbox — generous free tier (100K requests/month) but a commercial product with a cost cliff.
- Self-hosted OSRM — completely free with no rate limits, but requires a VPS with 2–4 GB RAM
  just for East Africa tiles, and adds operational burden for a small team.
- HERE Maps — free tier is large but the Tanzania coverage is rated only moderate.

---

## Decision 3 — Tech stack is Node.js + Next.js + Supabase, not Python + Flask

We decided to build the backend with Node.js and Express, the frontend with Next.js 14 and Tailwind CSS,
and use Supabase (PostgreSQL + PostGIS) as the database. This is the primary recommended stack.

Why: The dashboard needs an interactive map view with real-time updates when new assignments come in.
Next.js with Leaflet.js handles this well, and Supabase Realtime makes it straightforward to push new
pending assignments to the dashboard without polling. Node.js also has better library support for WhatsApp
integrations. The stack is mainstream enough that a junior-to-mid developer can maintain it.

What we ruled out:
- Python + Flask with Jinja2 templates — simpler and faster to start, but server-rendered maps
  (via Folium) are less interactive, and real-time dashboard updates would require more custom work.
- SQLite as an initial database — easier to set up locally, but PostGIS support (needed for
  geo queries like "find all students within 5km of a route stop") is unavailable on SQLite.
- Self-hosted PostgreSQL — more control, but Supabase provides Auth, RLS, Realtime, and PostGIS
  out of the box on its free tier, removing significant setup work for a single-developer team.
