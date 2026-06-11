# Automated School Transport Route Planning System
## Implementation Planning Document

**Document Version:** 1.0  
**Date:** June 2026  
**Status:** Draft — For Review  
**Audience:** Development Team, Operations Management, IT Stakeholders

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Requirements](#2-business-requirements)
3. [Functional Requirements](#3-functional-requirements)
4. [User Workflow](#4-user-workflow)
5. [System Architecture](#5-system-architecture)
6. [Recommended Technology Stack](#6-recommended-technology-stack)
7. [WhatsApp Integration Options](#7-whatsapp-integration-options)
8. [Mapping and Routing Service Options](#8-mapping-and-routing-service-options)
9. [Database Requirements](#9-database-requirements)
10. [Automation Workflow Design](#10-automation-workflow-design)
11. [Route Optimization for Multiple Students](#11-route-optimization-for-multiple-students)
12. [Security and Privacy Considerations](#12-security-and-privacy-considerations)
13. [Development Phases and Timeline](#13-development-phases-and-timeline)
14. [MVP Scope vs Future Enhancements](#14-mvp-scope-vs-future-enhancements)
15. [Challenges and Mitigation Strategies](#15-challenges-and-mitigation-strategies)
16. [Step-by-Step Build Plan](#16-step-by-step-build-plan)

---

## 1. Executive Summary

The school operations department currently manages bus route assignments through a fully manual process: staff receive location pins or links via WhatsApp, copy coordinates into Google Maps, manually calculate distances and travel times, and assign students to routes by hand. This is slow, error-prone, and does not scale as the student population grows.

This document defines the complete implementation roadmap for an **Automated School Transport Route Planning System** — a cost-effective, scalable platform that replaces the manual workflow with automated location ingestion, intelligent route calculation, and a simple operations dashboard.

**Core value proposition:**
- Reduce per-student route assignment time from ~10 minutes to under 30 seconds
- Eliminate transcription errors from manual coordinate copying
- Enable a single staff member to manage route assignments for hundreds of students
- Build on free/low-cost mapping APIs to keep running costs minimal

---

## 2. Business Requirements

### 2.1 Primary Business Goals

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-01 | Receive and process student home locations shared via WhatsApp (text addresses, pins, or map links) | Must Have |
| BR-02 | Automatically calculate distance and estimated travel time from each student's home to school | Must Have |
| BR-03 | Assign students to appropriate bus routes based on proximity and capacity | Must Have |
| BR-04 | Provide operations staff with a simple, non-technical dashboard to review and manage assignments | Must Have |
| BR-05 | Reduce manual effort in route planning by at least 80% | Must Have |
| BR-06 | Support route optimization across multiple students on the same route | Should Have |
| BR-07 | Allow staff to manually override automated assignments | Should Have |
| BR-08 | Generate printable or exportable route sheets for bus drivers | Should Have |
| BR-09 | Notify parents of their child's assigned bus route and estimated pickup time | Could Have |
| BR-10 | Scale to accommodate school growth without significant infrastructure changes | Must Have |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Location processing time | < 5 seconds per student |
| NFR-02 | System availability | 99% uptime during school hours (6am–6pm) |
| NFR-03 | Data privacy | Student location data encrypted at rest and in transit |
| NFR-04 | Cost | Monthly running cost < $50 USD for up to 500 students |
| NFR-05 | Usability | Operations staff require no technical training beyond a 30-minute orientation |
| NFR-06 | Maintainability | Codebase manageable by a single junior-to-mid developer |

### 2.3 Constraints

- Budget is limited; preference for open-source tools and free API tiers
- Operations staff are non-technical; the interface must be simple and intuitive
- School operates in a region where WhatsApp is the dominant communication channel
- The solution must work in areas with variable internet connectivity

---

## 3. Functional Requirements

### 3.1 Location Ingestion

| ID | Requirement |
|----|-------------|
| FR-01 | Parse WhatsApp location pin messages (contain latitude/longitude metadata) |
| FR-02 | Parse Google Maps share links (e.g., `maps.app.goo.gl/...`) and extract coordinates |
| FR-03 | Parse OpenStreetMap links and extract coordinates |
| FR-04 | Parse plain text addresses and geocode them to coordinates |
| FR-05 | Validate that extracted coordinates fall within a reasonable geographic boundary (e.g., within 50 km of the school) |
| FR-06 | Flag ambiguous or failed location parses for manual staff review |

### 3.2 Distance and Time Calculation

| ID | Requirement |
|----|-------------|
| FR-07 | Calculate road distance (not straight-line) between student home and school |
| FR-08 | Calculate estimated travel time by road under typical morning traffic conditions |
| FR-09 | Store both straight-line and road distances for reference |
| FR-10 | Support configurable school location (for multi-campus future use) |

### 3.3 Route Assignment

| ID | Requirement |
|----|-------------|
| FR-11 | Automatically suggest a bus route assignment based on proximity to existing routes |
| FR-12 | Enforce bus capacity limits when assigning students to routes |
| FR-13 | Allow staff to accept, reject, or modify automated route suggestions |
| FR-14 | Support definition of geographic zones for route segmentation |

### 3.4 Operations Dashboard

| ID | Requirement |
|----|-------------|
| FR-15 | Display all students on a map with colour-coded route assignments |
| FR-16 | Show a list view of students per route with distance and estimated pickup time |
| FR-17 | Allow staff to search for a student and view their assignment details |
| FR-18 | Flag unprocessed or pending student location requests |
| FR-19 | Export route data as CSV or PDF for driver briefing sheets |

### 3.5 Notifications (Phase 2)

| ID | Requirement |
|----|-------------|
| FR-20 | Send automated WhatsApp confirmation to parent with route and estimated pickup time |
| FR-21 | Notify operations staff of new incoming location requests |

---

## 4. User Workflow

### 4.1 Current (Manual) Workflow

```
Parent sends location via WhatsApp (pin, link, or typed address)
        │
        ▼
Staff member receives message in WhatsApp
        │
        ▼
Staff manually copies/opens location in Google Maps
        │
        ▼
Staff manually reads and records coordinates or address
        │
        ▼
Staff calculates distance and travel time in Google Maps
        │
        ▼
Staff manually checks spreadsheet for available bus routes
        │
        ▼
Staff assigns student to route in spreadsheet
        │
        ▼
Staff verbally or via WhatsApp informs parent of assignment
        │
        ▼
Staff updates driver's printed route sheet manually

Total time per student: ~8–15 minutes
Error risk: HIGH (manual transcription, no validation)
```

### 4.2 Target (Automated) Workflow

```
Parent sends location via WhatsApp (pin, link, or typed address)
        │
        ▼
WhatsApp Business API / webhook receives message
        │
        ▼
Automation layer extracts & validates coordinates
        │
        ▼
Mapping API calculates distance + travel time to school
        │
        ▼
Route assignment engine suggests optimal route
        │
        ▼
Operations dashboard displays pending assignment for staff review
        │
        ▼
Staff reviews and confirms (one click) or overrides
        │
        ▼
Parent receives automated WhatsApp confirmation (Phase 2)
        │
        ▼
Driver route sheet auto-updated in dashboard

Total time per student: ~30 seconds (staff review only)
Error risk: LOW (validated coordinates, automated logic)
```

### 4.3 Staff Dashboard Workflow

```
Staff opens web dashboard
        │
        ├──► View "Pending" tab: new unprocessed location requests
        │           │
        │           ▼
        │    Review student name, location pin on map, distance, suggested route
        │           │
        │           ├──► Click "Confirm Assignment" → student assigned, moved to Active
        │           │
        │           └──► Click "Override" → staff selects different route manually
        │
        ├──► View "Routes" tab: map of all routes with student pins
        │
        └──► View "Export" tab: download driver route sheets
```

---

## 5. System Architecture

### 5.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL LAYER                               │
│                                                                     │
│   Parent's WhatsApp  ──────────►  WhatsApp Business API / Meta      │
│                                         │                           │
└─────────────────────────────────────────┼───────────────────────────┘
                                          │ Webhook (HTTPS POST)
┌─────────────────────────────────────────┼───────────────────────────┐
│                     APPLICATION LAYER   │                           │
│                                         ▼                           │
│   ┌─────────────────────────────────────────────────┐              │
│   │              Message Processor Service           │              │
│   │  - Parse incoming WhatsApp message               │              │
│   │  - Detect message type (pin / link / text)       │              │
│   │  - Extract coordinates or address string         │              │
│   │  - Validate geographic bounds                    │              │
│   └─────────────────────────┬───────────────────────┘              │
│                             │                                        │
│                             ▼                                        │
│   ┌─────────────────────────────────────────────────┐              │
│   │            Geocoding & Routing Service           │              │
│   │  - Geocode text addresses → coordinates          │              │
│   │  - Calculate road distance to school             │              │
│   │  - Calculate estimated travel time               │              │
│   │  - Interface: OpenRouteService / OSRM / Google   │              │
│   └─────────────────────────┬───────────────────────┘              │
│                             │                                        │
│                             ▼                                        │
│   ┌─────────────────────────────────────────────────┐              │
│   │           Route Assignment Engine               │              │
│   │  - Load existing routes + capacities            │              │
│   │  - Score candidate routes for new student       │              │
│   │  - Suggest best assignment                      │              │
│   │  - Flag for staff review if no clear match      │              │
│   └─────────────────────────┬───────────────────────┘              │
│                             │                                        │
│                             ▼                                        │
│   ┌─────────────────────────────────────────────────┐              │
│   │                  Database Layer                  │              │
│   │  PostgreSQL (Supabase free tier)                 │              │
│   │  - Students, Routes, Assignments, Messages       │              │
│   └─────────────────────────┬───────────────────────┘              │
│                             │                                        │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                   PRESENTATION LAYER  │                             │
│                                       ▼                             │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │               Operations Web Dashboard                    │    │
│   │  Built with: Next.js + Tailwind + Leaflet.js (map)        │    │
│   │                                                           │    │
│   │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │    │
│   │  │  Pending Tab │  │  Routes Tab  │  │   Export Tab    │  │    │
│   │  │  (review     │  │  (map view + │  │  (CSV / PDF     │  │    │
│   │  │  assignments)│  │  list view)  │  │   route sheets) │  │    │
│   │  └─────────────┘  └──────────────┘  └─────────────────┘  │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| Webhook Receiver | Accept and authenticate incoming WhatsApp events | Node.js / Express |
| Message Processor | Parse message type and extract location data | Node.js service |
| Geocoding Service | Convert addresses to coordinates | OpenRouteService / Nominatim |
| Routing Service | Calculate road distance and travel time | OSRM / OpenRouteService |
| Route Assignment Engine | Score and suggest route assignments | Node.js business logic |
| Database | Persistent storage for all entities | PostgreSQL (Supabase) |
| Operations Dashboard | Staff-facing UI for review and management | Next.js + Leaflet.js |
| Notification Service | Send WhatsApp confirmations (Phase 2) | WhatsApp Business API |

### 5.3 Deployment Architecture

```
┌──────────────────────────────────────────────┐
│              Cloud Hosting (Render / Railway) │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Backend API    │  │  Frontend (SSR)  │  │
│  │   (Node.js)      │  │  (Next.js)       │  │
│  └────────┬─────────┘  └──────────────────┘  │
│           │                                   │
│  ┌────────▼─────────────────────────────────┐ │
│  │     Database: Supabase (PostgreSQL)      │ │
│  │     + PostGIS extension for geo queries  │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

External APIs:
  - WhatsApp Business API (Meta)
  - OpenRouteService or OSRM (routing)
  - Nominatim / Photon (geocoding)
  - Google Maps (optional, for dashboard tiles)
```

---

## 6. Recommended Technology Stack

### 6.1 Full Stack Recommendation

| Layer | Technology | Rationale | Cost |
|-------|-----------|-----------|------|
| **Backend** | Node.js + Express | Lightweight, excellent WhatsApp library support, easy to hire for | Free |
| **Frontend** | Next.js 14 + Tailwind CSS | React-based, SSR, fast to build dashboards | Free |
| **Database** | PostgreSQL via Supabase | Free tier (500MB), PostGIS for geospatial queries, built-in auth | Free (up to 500MB) |
| **Maps (Dashboard)** | Leaflet.js + OpenStreetMap tiles | Open-source, no API key, no usage limits | Free |
| **Routing** | OpenRouteService (ORS) | 2,000 free requests/day; supports driving directions | Free tier |
| **Geocoding** | Nominatim (OSM) | Free, no key required, self-hostable | Free |
| **WhatsApp** | Meta WhatsApp Business API (via 360dialog or Twilio) | Official API, required for automation at scale | See §7 |
| **Hosting** | Render.com or Railway.app | Free/low-cost PaaS, simple deployment | $0–$20/mo |
| **Authentication** | Supabase Auth | Built-in with database, supports email/password for staff | Free |
| **File Export** | pdf-lib (Node.js) | Open-source PDF generation for route sheets | Free |

### 6.2 Alternative Lightweight Stack (Minimal Infra)

If the team is small and wants to move faster with less infrastructure:

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend + Frontend** | Python + Flask + Jinja2 templates | Simpler stack, less frontend complexity |
| **Database** | SQLite → PostgreSQL migration path | Start simple, migrate when needed |
| **Automation** | n8n (self-hosted) | Low-code automation for WhatsApp webhook parsing |
| **Maps** | Folium (Python Leaflet wrapper) | For server-rendered map views |

**Recommendation:** Use the Node.js/Next.js stack for better long-term scalability and richer interactive maps. Use the Python/Flask stack only if the available developer is more comfortable with Python.

---

## 7. WhatsApp Integration Options

### 7.1 Option Comparison

| Option | Type | Cost | Setup Complexity | Message Throughput | Compliance |
|--------|------|------|------------------|--------------------|-----------|
| **Meta Business API (direct)** | Official | Free (up to 1,000 conversations/month) | High — requires Meta Business verification | High | Full |
| **360dialog** | Official BSP | ~$5/mo base + per-message | Medium | High | Full |
| **Twilio WhatsApp** | Official BSP | $0.005–$0.01 per message | Low | High | Full |
| **Vonage (Nexmo)** | Official BSP | Pay per message | Low | High | Full |
| **Baileys (unofficial)** | Unofficial library | Free | Medium | Medium | **Non-compliant** |
| **whatsapp-web.js** | Unofficial | Free | Low | Low (single session) | **Non-compliant** |

### 7.2 Recommended Approach: Tiered Strategy

**Phase 1 (MVP) — Use unofficial library for internal testing only:**

```
whatsapp-web.js runs on a dedicated phone/server session.
Messages sent to a specific WhatsApp number are auto-forwarded 
to the webhook for processing.

⚠️  Risk: WhatsApp may ban the number. Acceptable for internal
    pilots with known parent contacts only.
```

**Phase 2 (Production) — Migrate to official API via 360dialog:**

```
Register school WhatsApp number with 360dialog ($5/mo).
Parents send location to the school's official WhatsApp number.
360dialog forwards webhook events to the application backend.
School gains a verified green-tick WhatsApp Business profile.
```

### 7.3 WhatsApp Message Parsing Logic

When a parent shares a location, WhatsApp sends different message structures depending on the method:

**Scenario A — Native Location Pin:**
```json
{
  "type": "location",
  "location": {
    "latitude": -3.7321,
    "longitude": 36.6858,
    "name": "Home",
    "address": "Babati, Manyara"
  }
}
```
→ Extract `latitude` and `longitude` directly. No geocoding needed.

**Scenario B — Google Maps Link:**
```
https://maps.app.goo.gl/AbCdEfGhIjKlMn12
https://www.google.com/maps?q=-3.7321,36.6858
https://maps.google.com/?ll=-3.7321,36.6858
```
→ Follow redirect and extract coordinates from final URL using regex:
```javascript
const coordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
// or
const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
```

**Scenario C — Plain Text Address:**
```
"We live near Babati market, behind the blue mosque"
"Lot 14, Mwanga Road, Babati"
```
→ Send to Nominatim geocoding API. If confidence is low, flag for staff review.

**Parsing Priority Order:**
```
1. Native WhatsApp location pin   → Direct coordinates (most reliable)
2. Google Maps / OSM link         → Extract from URL (reliable)
3. What3Words link                → API lookup (if enabled)
4. Plain text address             → Geocode (least reliable, needs review flag)
```

---

## 8. Mapping and Routing Service Options

### 8.1 Service Comparison

| Service | Routing | Geocoding | Free Tier | Self-Hostable | Tanzania Support |
|---------|---------|-----------|-----------|---------------|-----------------|
| **Google Maps Platform** | ✅ Excellent | ✅ Excellent | $200/mo credit (~40K route requests) | ❌ | ✅ Good |
| **OpenRouteService (ORS)** | ✅ Good | ✅ Good | 2,000 req/day | ✅ Yes | ✅ Good |
| **OSRM (Open Source Routing Machine)** | ✅ Good | ❌ No | Self-hosted only | ✅ Yes | ✅ With OSM data |
| **Nominatim (OSM Geocoding)** | ❌ No | ✅ Good | Unlimited (fair use) | ✅ Yes | ✅ Good |
| **Mapbox** | ✅ Excellent | ✅ Excellent | 100K free requests/mo | ❌ | ✅ Good |
| **HERE Maps** | ✅ Good | ✅ Good | 250K free requests/mo | ❌ | ✅ Moderate |
| **Graphhopper** | ✅ Good | ✅ Good | 500 req/day | ✅ Yes | ✅ With OSM data |

### 8.2 Detailed Pros and Cons

#### Google Maps Platform
- **Pros:** Most accurate road data, best traffic awareness, excellent Tanzania coverage, familiar to staff
- **Cons:** Becomes expensive beyond free credit (~$5 per 1,000 distance matrix requests), vendor lock-in, requires billing account even for free tier
- **Best for:** If accuracy is paramount and usage is low (< 2,000 requests/month)

#### OpenRouteService (ORS)
- **Pros:** Fully free for 2,000 requests/day, supports walking/driving/cycling, good documentation, can be self-hosted on a $5/mo VPS using OSM data
- **Cons:** Road data quality dependent on OSM contributors in the region; Tanzania coverage is good in urban areas but patchy in rural zones
- **Best for:** MVP and production if usage stays under 2,000/day (~60,000/month)

#### OSRM (Self-hosted)
- **Pros:** Completely free when self-hosted, fast, no API rate limits, uses OSM data
- **Cons:** Requires a VPS with 2–4GB RAM for East Africa data tile, needs periodic OSM data updates, no geocoding built in
- **Best for:** High-volume scenarios or when you need zero per-request cost

#### Nominatim (Geocoding)
- **Pros:** Free to use (public API fair use policy), open-source, self-hostable
- **Cons:** Public API limited to 1 request/second; accuracy depends on OSM address data quality for the region
- **Best for:** Geocoding text addresses; pair with ORS for routing

#### Mapbox
- **Pros:** Very generous free tier (100K requests/month), great documentation, beautiful map tiles
- **Cons:** Commercial product with costs beyond free tier, requires API key management
- **Best for:** If the dashboard needs rich interactive maps and the free tier is sufficient

### 8.3 Recommended Stack

**Recommended: OpenRouteService + Nominatim**

```
Geocoding:  Nominatim (OSM)  — free, no key, good Tanzania coverage
Routing:    OpenRouteService  — 2,000 free requests/day, driving profile
Map Tiles:  OpenStreetMap via Leaflet.js — free, no key, offline-capable
Fallback:   Google Maps API  — for geocoding edge cases where Nominatim fails
```

**Cost at 500 students (one-time setup):**
- 500 geocoding requests × Nominatim = **$0**
- 500 routing requests × ORS = **$0** (well within 2,000/day limit)
- Map tiles × Leaflet/OSM = **$0**
- Total mapping cost: **$0/month**

---

## 9. Database Requirements

### 9.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────────┐
│      students        │       │         routes           │
├─────────────────────┤       ├─────────────────────────┤
│ id (PK)             │       │ id (PK)                 │
│ name                │       │ route_name              │
│ grade               │       │ bus_number              │
│ parent_name         │       │ driver_name             │
│ parent_phone        │       │ driver_phone            │
│ whatsapp_id         │       │ capacity (max students) │
│ created_at          │       │ school_id (FK)          │
└──────────┬──────────┘       │ active                  │
           │                  └──────────┬──────────────┘
           │                             │
           └───────────┬─────────────────┘
                       │
              ┌────────▼────────────────┐
              │     route_assignments    │
              ├─────────────────────────┤
              │ id (PK)                 │
              │ student_id (FK)         │
              │ route_id (FK)           │
              │ pickup_order            │
              │ estimated_pickup_time   │
              │ status (pending/active/ │
              │         suspended)      │
              │ assigned_by             │
              │ assigned_at             │
              └─────────────────────────┘

┌─────────────────────────────────────────┐
│           student_locations              │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ student_id (FK)                         │
│ latitude (DECIMAL 9,6)                  │
│ longitude (DECIMAL 9,6)                 │
│ address_text                            │
│ geocode_source (pin/link/text/manual)   │
│ geocode_confidence (0.0–1.0)            │
│ road_distance_km                        │
│ travel_time_minutes                     │
│ verified_by_staff                       │
│ created_at                              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           incoming_messages              │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ whatsapp_message_id                     │
│ sender_phone                            │
│ message_type (location/text/link)       │
│ raw_payload (JSONB)                     │
│ processed (boolean)                     │
│ processing_status                       │
│ student_id (FK, nullable)               │
│ received_at                             │
│ processed_at                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│               schools                    │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ name                                    │
│ latitude                                │
│ longitude                               │
│ address                                 │
│ start_time                              │
│ end_time                                │
└─────────────────────────────────────────┘
```

### 9.2 Key Database Decisions

- **PostGIS extension** on PostgreSQL enables native geo queries (e.g., "find all students within 5km of route stop")
- **JSONB column** on `incoming_messages.raw_payload` preserves the original WhatsApp event for debugging and re-processing
- **Supabase free tier** provides 500MB PostgreSQL with PostGIS, suitable for 2,000–5,000 student records with location history
- **Soft deletes** (active flags) rather than hard deletes preserve data for auditing

### 9.3 Estimated Storage

| Table | Rows (500 students) | Estimated Size |
|-------|---------------------|---------------|
| students | 500 | ~100 KB |
| student_locations | 500 | ~200 KB |
| route_assignments | 500 | ~100 KB |
| routes | 10–20 | < 10 KB |
| incoming_messages | 500–2,000 | ~5 MB (JSONB payloads) |
| **Total** | | **~6 MB** — well within Supabase free tier |

---

## 10. Automation Workflow Design

### 10.1 Full Automation Pipeline

```
STEP 1: MESSAGE RECEPTION
─────────────────────────
WhatsApp event arrives at /webhook endpoint (HTTPS POST)
  │
  ├── Verify webhook signature (HMAC-SHA256)
  ├── Acknowledge receipt immediately (200 OK within 5 seconds)
  └── Queue message for async processing

STEP 2: MESSAGE CLASSIFICATION
───────────────────────────────
Read message payload:
  │
  ├── type === "location"   → SCENARIO A: extract lat/lng directly
  ├── type === "text"
  │     ├── Contains maps URL?  → SCENARIO B: extract from link
  │     ├── Contains address?   → SCENARIO C: geocode text
  │     └── No location data?   → Flag for staff, request re-send
  └── type === "image" (screenshot of map) → Flag for staff manual input

STEP 3: COORDINATE VALIDATION
──────────────────────────────
Validate extracted coordinates:
  │
  ├── Check: are lat/lng numeric and within valid range?
  ├── Check: is location within 50km of school?
  ├── Check: is location not in an impossible area (ocean, etc)?
  └── Score confidence: HIGH / MEDIUM / LOW
        LOW confidence → flag for staff review before proceeding

STEP 4: ROUTING CALCULATION
────────────────────────────
Call OpenRouteService (or OSRM):
  POST /v2/directions/driving-car
  {
    "coordinates": [[student_lng, student_lat], [school_lng, school_lat]]
  }
  │
  ├── Extract: distance (km)
  ├── Extract: duration (minutes)
  └── Store in student_locations table

STEP 5: ROUTE ASSIGNMENT SCORING
──────────────────────────────────
For each active bus route:
  │
  ├── Calculate: detour distance if student is added
  ├── Check: current capacity vs maximum
  ├── Score = (1/detour_km) × capacity_weight × zone_weight
  └── Rank routes by score

Select highest-scoring route as suggestion.
If no route has remaining capacity → flag as "needs new route"

STEP 6: STAFF NOTIFICATION
────────────────────────────
Insert record into route_assignments (status = "pending")
Update operations dashboard (real-time via Supabase Realtime)
Staff sees new pending assignment in dashboard → confirms or overrides

STEP 7: CONFIRMATION (PHASE 2)
──────────────────────────────
On staff confirmation:
  └── Send WhatsApp message to parent:
      "Your child [Name] has been assigned to Bus Route [X].
       Estimated pickup time: [HH:MM]. Driver: [Name], [Phone]."
```

### 10.2 Error Handling States

| Error Type | System Response | Staff Action Required |
|-----------|----------------|-----------------------|
| Unknown sender (no student match) | Store message, flag as "Unknown Parent" | Staff links phone number to student |
| Map link unresolvable (expired, private) | Flag as "Location Failed", request re-send | Staff may ask parent to re-share |
| Geocoding returned low-confidence result | Flag as "Needs Verification" with best guess shown on map | Staff confirms or adjusts pin |
| All routes at capacity | Flag as "Capacity Full", suggest new route creation | Staff creates new route or increases capacity |
| Routing API timeout | Retry 3×, then flag for manual calculation | Staff runs calculation manually if needed |

---

## 11. Route Optimization for Multiple Students

### 11.1 Problem Definition

Assigning students to routes one by one is not globally optimal. A batch optimization approach considers all unassigned students simultaneously to minimize total route distance while respecting bus capacity.

### 11.2 Algorithm Options

#### Option A: Geographic Clustering (Recommended for MVP)

```
Algorithm: K-Means or DBSCAN clustering on student coordinates

Steps:
1. Cluster student home locations into N groups (N = number of buses)
2. Assign each cluster to a bus route
3. Within each cluster, order stops by proximity (nearest-neighbour)
4. Calculate total route distance per bus

Pros:  Simple to implement, runs in milliseconds, no external API needed
Cons:  Does not account for road geometry; clusters may span natural barriers
Library: ml-kmeans (Node.js) or scikit-learn (Python)
```

#### Option B: Nearest-Neighbour Heuristic

```
Algorithm: For each bus starting from school, repeatedly pick the 
nearest unassigned student until capacity is reached.

Steps:
1. Start at school location
2. Find nearest unassigned student
3. Add to route, move to student's location
4. Repeat until bus is full
5. Start next bus from school

Pros:  Easy to code, deterministic, produces reasonable routes
Cons:  Greedy; can miss globally better solutions
```

#### Option C: Vehicle Routing Problem Solver (Future Enhancement)

```
Algorithm: Google OR-Tools (open-source VRP solver)

This solves the full Capacitated Vehicle Routing Problem (CVRP):
- Minimise total distance across all buses
- Respect capacity constraints
- Supports time windows (pickup must be by certain time)

Pros:  Optimal or near-optimal solutions
Cons:  Complex to set up, slower for large problems (>200 stops)
Library: google/or-tools (free, Apache 2.0)
```

### 11.3 Recommended Implementation Path

```
Phase 1 (MVP):     Geographic Clustering (Option A)
Phase 2:           Nearest-Neighbour optimisation within clusters
Phase 3:           OR-Tools VRP solver for full optimisation
```

### 11.4 Route Re-optimisation Trigger

Re-run optimisation when:
- A new student is added to the system
- A student transfers schools or moves
- A bus is removed from service
- The school schedule changes

Staff can trigger a "Re-optimise All Routes" action from the dashboard, which runs the algorithm and presents the proposed changes for review before applying.

---

## 12. Security and Privacy Considerations

### 12.1 Data Classification

| Data Type | Classification | Handling |
|-----------|---------------|---------|
| Student name + grade | Confidential | Encrypted at rest, access-controlled |
| Parent phone number | Confidential | Hashed or encrypted in DB |
| Home location (lat/lng) | Highly Sensitive | Encrypted at rest, not shared externally |
| WhatsApp message content | Sensitive | Stored for processing only, purged after 90 days |
| Route assignments | Internal | Access-controlled to staff only |

### 12.2 Technical Security Controls

**Authentication:**
- Operations dashboard requires staff login (email + password via Supabase Auth)
- Multi-factor authentication (MFA) recommended for admin accounts
- JWT tokens with 8-hour expiry for session management
- No public-facing endpoints that return student or location data

**Data Encryption:**
- All data in transit: TLS 1.2+ (enforced by Supabase and hosting provider)
- Sensitive fields (lat/lng, phone numbers) encrypted at rest using PostgreSQL `pgcrypto`
- Environment variables for all API keys and secrets (never in source code)

**Webhook Security:**
- Verify WhatsApp webhook signatures using HMAC-SHA256 on every incoming request
- Reject any request with an invalid or missing signature
- Rate-limit the webhook endpoint to prevent abuse

**Access Control:**
- Role-based access: `admin` (full access) vs `operator` (view + confirm assignments, no delete)
- Database row-level security (RLS) via Supabase policies
- Operations staff cannot access raw message payloads or WhatsApp IDs

### 12.3 Privacy Compliance

- **Data minimisation:** Only collect location data required for route assignment; do not store movement history beyond what is operationally needed
- **Retention policy:** Purge `incoming_messages` raw payloads after 90 days; retain `student_locations` for the duration of enrolment plus 1 year
- **Parental consent:** Include transport data collection in school enrolment forms and transport request process
- **Right to deletion:** Provide a process for parents to request deletion of their location data
- **No third-party sharing:** Location data is not shared with any external party beyond the routing API (which receives coordinates but not student names)

### 12.4 Operational Security

- API keys stored in environment variables, rotated every 6 months
- Database backups taken daily, stored encrypted, retained for 30 days
- All staff actions in the dashboard logged with timestamp and user ID (audit trail)
- Incident response plan: if a data breach is suspected, disable WhatsApp webhook endpoint, notify school data protection officer within 24 hours

---

## 13. Development Phases and Timeline

### 13.1 Phase Overview

```
Phase 1: Foundation (Weeks 1–3)
  └── Project setup, database, core backend, basic location parsing

Phase 2: MVP (Weeks 4–7)
  └── WhatsApp integration, routing calculation, basic dashboard

Phase 3: Operations Polish (Weeks 8–10)
  └── Route assignment engine, map visualisation, CSV export

Phase 4: Hardening (Weeks 11–12)
  └── Security review, testing, staff training, go-live

Phase 5: Enhancements (Weeks 13–20, ongoing)
  └── Automated notifications, route optimisation, reporting
```

### 13.2 Detailed Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1 | Foundation | Repository setup, CI/CD pipeline, environment configuration |
| 2 | Foundation | Database schema + migrations, Supabase project setup, seed data |
| 3 | Foundation | Core backend skeleton, webhook receiver, message classification logic |
| 4 | MVP | WhatsApp integration (whatsapp-web.js for testing), end-to-end location parsing |
| 5 | MVP | ORS/Nominatim integration, distance/time calculation |
| 6 | MVP | Route assignment logic (basic proximity scoring) |
| 7 | MVP | Basic operations dashboard (pending list, confirm/override actions) |
| 8 | Polish | Interactive map view (Leaflet.js, student pins, route colours) |
| 9 | Polish | Route management UI (create/edit routes, capacity settings) |
| 10 | Polish | CSV and PDF export for driver route sheets |
| 11 | Hardening | Security audit, penetration testing, HTTPS + webhook signature verification |
| 12 | Hardening | Staff user testing, bug fixes, go-live with pilot group (1–2 routes) |
| 13–14 | Enhancement | Full production rollout, staff training for all operators |
| 15–16 | Enhancement | WhatsApp Business API migration (replace whatsapp-web.js) |
| 17–18 | Enhancement | Automated parent notifications via WhatsApp |
| 19–20 | Enhancement | Route re-optimisation engine (clustering algorithm) |

---

## 14. MVP Scope vs Future Enhancements

### 14.1 MVP (Weeks 1–12)

The MVP delivers the core automation loop that eliminates manual work:

| Feature | Included in MVP |
|---------|----------------|
| Receive WhatsApp location pins | ✅ |
| Parse Google Maps links | ✅ |
| Calculate road distance + travel time | ✅ |
| Staff dashboard — pending assignments list | ✅ |
| Staff dashboard — confirm / override assignment | ✅ |
| Basic map view of students by route | ✅ |
| Manual route creation and management | ✅ |
| CSV export of route lists | ✅ |
| Staff login / authentication | ✅ |
| Parse plain-text addresses | ✅ (with review flag) |
| Automated parent notifications | ❌ Phase 2 |
| Route optimisation algorithm | ❌ Phase 3 |
| PDF driver route sheets | ❌ Phase 3 |
| Mobile-optimised dashboard | ❌ Phase 3 |
| Multi-school support | ❌ Future |

### 14.2 Future Enhancements Backlog

| Feature | Value | Effort | Priority |
|---------|-------|--------|----------|
| Automated parent WhatsApp confirmations | High | Medium | P1 |
| Route re-optimisation engine | High | High | P1 |
| PDF driver briefing sheets | Medium | Low | P2 |
| Real-time bus tracking (GPS integration) | High | Very High | P3 |
| Parent self-service portal | Medium | High | P3 |
| Multi-school / multi-campus support | Medium | Medium | P3 |
| Morning attendance integration | Medium | High | P4 |
| Analytics and reporting dashboard | Low | Medium | P4 |
| Mobile app for operations staff | Low | High | P5 |
| Offline mode / PWA | Low | High | P5 |

---

## 15. Challenges and Mitigation Strategies

| Challenge | Risk Level | Mitigation |
|-----------|-----------|-----------|
| **WhatsApp API changes or number ban** (using unofficial library) | High | Use official WhatsApp Business API in production. Use unofficial library in isolated pilot only. Have a backup channel (email/SMS). |
| **Poor geocoding accuracy for informal addresses** in Tanzania | High | Flag low-confidence geocodes for staff review. Show suggested pin on map so staff can drag-and-drop to correct location. Store verified coordinates so future requests from same area benefit. |
| **OSM road data gaps** in rural/semi-urban areas | Medium | Fall back to straight-line distance calculation with a regional correction factor (e.g., 1.35× for Tanzania). Allow staff to manually enter travel time when routing fails. |
| **Staff resistance to new system** | Medium | Involve 1–2 operations staff in UAT from Week 7. Keep the UI extremely simple. Run parallel operations (manual + system) for first 2 weeks. Provide a 1-page quick-reference guide. |
| **Routing API rate limits** | Low | Cache routing results — same home coordinates don't need re-routing. Batch new student processing during off-peak hours. Self-host OSRM if usage grows. |
| **Supabase free tier storage limits** | Low | At 6MB estimated usage for 500 students, limits are not a concern for 2–3 years. Plan PostgreSQL migration if data exceeds 400MB. |
| **Parent shares location in an unexpected format** (e.g., screenshot, Apple Maps link) | Medium | Build a robust unrecognised-format handler that flags for staff and prompts the parent with specific instructions on how to share a location pin. |
| **Bus capacity changes** or route restructuring mid-year | Low | Route management UI allows staff to adjust capacities and trigger re-optimisation at any time. |
| **Data breach of student location data** | Medium | Encrypt sensitive fields, enforce RLS, minimise data retention period, ensure HTTPS everywhere. Have an incident response plan documented. |
| **Single developer bus factor** | Medium | Document codebase thoroughly. Use standard frameworks (Node.js/Next.js) with large communities. Deploy to managed platforms (Render/Railway/Supabase) to reduce ops burden. |

---

## 16. Step-by-Step Build Plan

This section provides the development team with a concrete, ordered build plan. Each step includes the goal, technical tasks, and acceptance criteria.

---

### SPRINT 1 — Foundation (Weeks 1–2)

#### Step 1.1: Project Scaffolding
**Goal:** Set up a working monorepo with consistent tooling.

Tasks:
- Initialise monorepo structure: `/apps/api`, `/apps/web`, `/packages/shared`
- Configure ESLint, Prettier, and TypeScript across all packages
- Set up GitHub repository with branch protection on `main`
- Configure GitHub Actions CI: lint + test on every PR
- Create `.env.example` files for all required environment variables

Acceptance: Developers can clone, run `npm install`, and start both API and web servers locally in under 5 minutes.

#### Step 1.2: Database Setup
**Goal:** Establish the persistent data layer.

Tasks:
- Create Supabase project; enable PostGIS extension
- Write database migration files for all tables (see §9.1 schema)
- Create seed data: 1 school record, 3 test routes, 5 test students
- Set up Supabase Row Level Security policies
- Configure Supabase Realtime on `route_assignments` table (for dashboard live updates)
- Write a database client wrapper (`/packages/shared/db.ts`)

Acceptance: All tables exist with correct constraints; seed data loads without errors; RLS blocks unauthenticated reads.

#### Step 1.3: Authentication
**Goal:** Secure the operations dashboard.

Tasks:
- Configure Supabase Auth for email/password login
- Create staff user accounts (admin and operator roles)
- Build minimal login page in Next.js
- Implement protected route middleware (redirect unauthenticated users)
- Add auth context provider to Next.js app

Acceptance: Unauthenticated access to any `/dashboard/*` route redirects to `/login`.

---

### SPRINT 2 — WhatsApp Ingestion (Weeks 3–4)

#### Step 2.1: Webhook Receiver
**Goal:** Accept and authenticate WhatsApp events.

Tasks:
- Create Express endpoint `POST /webhook/whatsapp`
- Implement webhook verification endpoint `GET /webhook/whatsapp` (required by Meta API)
- Implement HMAC-SHA256 signature verification middleware
- Implement immediate acknowledgement (200 response within 2 seconds)
- Push incoming message to a processing queue (use Bull queue with Redis, or simple async queue)
- Store raw payload in `incoming_messages` table

Acceptance: Send a test POST with valid/invalid signatures; valid passes, invalid returns 403; all valid messages appear in `incoming_messages`.

#### Step 2.2: Message Classification and Location Extraction
**Goal:** Parse all supported location message types.

Tasks:
- Implement `MessageClassifier` service:
  - Detect native WhatsApp location type → extract lat/lng
  - Detect Google Maps share link (multiple URL formats) → follow redirect, extract coords
  - Detect OSM link → extract coords from URL parameters
  - Detect plain text → flag for geocoding
  - Detect unrecognised format → flag for staff
- Write unit tests for all parser functions with real example payloads
- Link parsed location to student via `sender_phone` → `students.parent_phone` lookup

Acceptance: All test message payloads (5 types) parse correctly; unrecognised formats are flagged with status `"needs_manual_review"`.

#### Step 2.3: WhatsApp Test Client Setup
**Goal:** Enable end-to-end testing with real WhatsApp messages.

Tasks:
- Set up `whatsapp-web.js` session on a dedicated test phone number
- Configure it to forward received messages to the local webhook endpoint
- Test the full flow: send location pin from personal phone → pin appears as pending in dashboard

Acceptance: Developer can send a WhatsApp location pin and see it appear as a pending record in the database within 10 seconds.

---

### SPRINT 3 — Routing Calculation (Weeks 5–6)

#### Step 3.1: Geocoding Service
**Goal:** Convert text addresses to coordinates.

Tasks:
- Implement `GeocodingService` that wraps Nominatim API
- Add response caching (cache geocoding results by address string, 30-day TTL)
- Implement confidence scoring based on Nominatim `importance` field
- Flag results with `importance < 0.5` for staff review
- Fallback: if Nominatim fails, attempt Google Maps Geocoding API (if key is configured)

Acceptance: Geocoding 10 test addresses returns coordinates; at least 8/10 correct within 500m; low-confidence results are flagged.

#### Step 3.2: Distance and Travel Time Calculation
**Goal:** Calculate road routing data for each student.

Tasks:
- Implement `RoutingService` that wraps OpenRouteService `/v2/directions` endpoint
- Accept student coordinates + school coordinates as input
- Return: `road_distance_km`, `travel_time_minutes`, raw route geometry (GeoJSON)
- Implement retry logic (3 retries with exponential backoff)
- Implement fallback: if ORS fails, calculate straight-line Haversine distance × 1.35 correction factor
- Store results in `student_locations` table

Acceptance: RoutingService returns accurate distance for 5 known student-to-school pairs (verified against Google Maps manually); fallback activates when ORS endpoint is unreachable.

#### Step 3.3: Geographic Boundary Validation
**Goal:** Reject coordinates outside the school's service area.

Tasks:
- Define configurable `MAX_DISTANCE_KM` (default: 50km from school)
- Validate extracted coordinates fall within this boundary before routing
- Validate coordinates are not in an ocean or impossible location (basic bounding box check)
- Flag out-of-bounds coordinates with status `"out_of_service_area"`

Acceptance: Coordinates 100km from school are flagged and not processed further; coordinates 10km away proceed normally.

---

### SPRINT 4 — Route Assignment Engine (Week 6–7)

#### Step 4.1: Route Assignment Scoring
**Goal:** Automatically suggest the best bus route for a new student.

Tasks:
- Implement `RouteAssignmentEngine`:
  - Load all active routes with current student assignments
  - For each route, calculate the additional detour distance to include the new student (insert student into existing stop sequence at optimal position)
  - Apply capacity penalty: routes at > 80% capacity score lower
  - Apply geographic zone weight (if zones are defined)
  - Return ranked list of routes with scores
- Store the top suggestion as `route_assignments` record with `status = "pending_review"`

Acceptance: Given 3 test routes and a new student location, the engine returns the correct best-fit route (validated manually against a map).

#### Step 4.2: Pickup Order Calculation
**Goal:** Determine the correct pickup sequence for a student added to a route.

Tasks:
- For a new student added to an existing route, insert them at the position that minimises total route distance
- Recalculate `pickup_order` and `estimated_pickup_time` for all students on the route
- Use school start time minus total route duration to anchor the schedule

Acceptance: Adding a student to a route recalculates the pickup sequence; estimated pickup times are plausible and internally consistent.

---

### SPRINT 5 — Operations Dashboard (Weeks 7–9)

#### Step 5.1: Pending Assignments View
**Goal:** Give staff a clear view of assignments awaiting review.

Tasks:
- Build `/dashboard/pending` page in Next.js
- List all `route_assignments` with `status = "pending_review"` 
- For each pending item, show: student name, parent phone, location on mini-map, suggested route, distance, estimated travel time
- Implement "Confirm" button → updates status to `"active"`, sends success response
- Implement "Override" flow → dropdown to select alternative route, then confirm
- Implement "Flag for Review" → marks as needing further investigation with a notes field
- Supabase Realtime subscription: new pending assignments appear without page reload

Acceptance: New WhatsApp location ping appears on pending view within 15 seconds; staff can confirm, override, or flag with 2–3 clicks.

#### Step 5.2: Route Map View
**Goal:** Visual overview of all students and their routes on a map.

Tasks:
- Build `/dashboard/routes` page with embedded Leaflet.js map
- Render student home locations as pins, colour-coded by route
- Render school location as a distinct marker
- Sidebar: list of routes with student count, capacity, driver name
- Click on route in sidebar → highlight that route's students on map
- Click on student pin → show popup: name, grade, distance, pickup time

Acceptance: Map correctly renders all students; clicking a route highlights the correct subset; popups show accurate data.

#### Step 5.3: Route Management UI
**Goal:** Allow staff to create, edit, and manage routes.

Tasks:
- Build `/dashboard/routes/manage` page
- Create new route: name, bus number, driver name/phone, capacity
- Edit route: same fields, plus ability to manually add/remove students
- Deactivate route: move all students to "unassigned" status
- Show current occupancy (e.g., "12 / 15 students")

Acceptance: Staff can create a new route, assign a student manually, and the student appears on the map under the new route colour.

#### Step 5.4: Export Functionality
**Goal:** Produce driver-ready route sheets.

Tasks:
- Build `/dashboard/export` page
- CSV export: all students per route with address, coordinates, estimated pickup time
- Simple HTML-to-PDF export (using `html-pdf-node` or `puppeteer`) for formatted driver sheets
- Driver sheet includes: route name, date, ordered stop list with student name, address, and pickup time

Acceptance: Exported CSV opens correctly in Excel/Google Sheets; PDF driver sheet is readable and accurately reflects route data.

---

### SPRINT 6 — Hardening and Go-Live (Weeks 10–12)

#### Step 6.1: Security Review
Tasks:
- Audit all API endpoints for missing authentication middleware
- Verify all environment variables are not committed to Git
- Enable Supabase RLS on all tables; test that operator role cannot access raw messages
- Implement HTTPS-only enforcement on all services
- Add rate limiting to webhook endpoint (max 100 requests/minute)
- Review and remove any console.log statements that output sensitive data

#### Step 6.2: Testing
Tasks:
- Write integration tests covering the full pipeline: mock WhatsApp message → verify pending assignment created
- Write unit tests for: message parser, geocoding service, routing service, assignment engine
- Target: 70%+ code coverage on core business logic
- Conduct manual end-to-end testing with real WhatsApp messages from 5 different phone numbers
- Performance test: simulate 50 simultaneous incoming messages; verify all processed within 60 seconds

#### Step 6.3: Staff Training and Pilot
Tasks:
- Create a 1-page operations guide (PDF) for non-technical staff
- Run a 30-minute hands-on training session with 2–3 staff members
- Deploy to production environment (Render + Supabase production project)
- Run parallel operations for 2 weeks: staff process routes both manually AND via system, comparing results
- Collect feedback and fix critical bugs before full cutover

#### Step 6.4: Full Rollout
Tasks:
- Decommission manual spreadsheet process
- Migrate all existing student route assignments into the system
- Monitor webhook logs and error rates for first 2 weeks
- Set up uptime monitoring (UptimeRobot free tier)
- Define on-call process for system outages during school hours

---

### SPRINT 7+ — Phase 2 Enhancements (Weeks 13–20)

#### Step 7.1: Official WhatsApp Business API Migration
- Register school phone number with 360dialog or Twilio
- Replace whatsapp-web.js session with official webhook
- Verify school profile as a WhatsApp Business account

#### Step 7.2: Automated Parent Notifications
- Design WhatsApp message templates for route confirmation
- Submit templates for Meta approval (required for business-initiated messages)
- Implement notification service that sends confirmation on staff approval
- Allow staff to preview message before it is sent

#### Step 7.3: Route Optimisation Engine
- Implement geographic clustering algorithm (K-Means)
- Add "Re-optimise All Routes" action to dashboard
- Show diff view of before/after optimisation for staff approval
- Implement nearest-neighbour stop ordering within each cluster

#### Step 7.4: Analytics and Reporting
- Monthly summary: number of new students added, average distance, route utilisation
- Identify routes that are consistently under or over capacity
- Export summary report as PDF for management review

---

## Appendix A: Environment Variables Reference

```bash
# Application
NODE_ENV=production
PORT=3001
APP_URL=https://your-domain.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only, never expose to client

# WhatsApp
WHATSAPP_WEBHOOK_SECRET=your-webhook-hmac-secret
WHATSAPP_API_TOKEN=your-business-api-token  # Phase 2
WHATSAPP_PHONE_NUMBER_ID=your-phone-id      # Phase 2

# Mapping APIs
ORS_API_KEY=your-openrouteservice-key  # Free at openrouteservice.org
GOOGLE_MAPS_API_KEY=your-key           # Optional fallback geocoding

# School Configuration
SCHOOL_LATITUDE=-3.7321
SCHOOL_LONGITUDE=36.6858
SCHOOL_START_TIME=07:30
MAX_SERVICE_DISTANCE_KM=50
```

---

## Appendix B: Recommended Directory Structure

```
transport-system/
├── apps/
│   ├── api/                    # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/         # Express route handlers
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── messageParser.ts
│   │   │   │   ├── geocoding.ts
│   │   │   │   ├── routing.ts
│   │   │   │   └── routeAssignment.ts
│   │   │   ├── middleware/     # Auth, rate limiting, signature verify
│   │   │   ├── db/             # Supabase client + query helpers
│   │   │   └── queue/          # Message processing queue
│   │   └── tests/
│   └── web/                    # Next.js 14 frontend
│       ├── app/
│       │   ├── (auth)/login/
│       │   └── dashboard/
│       │       ├── pending/
│       │       ├── routes/
│       │       └── export/
│       └── components/
│           ├── Map/            # Leaflet.js components
│           ├── StudentCard/
│           └── RouteList/
├── packages/
│   └── shared/                 # Shared TypeScript types
│       └── types/
│           ├── student.ts
│           ├── route.ts
│           └── message.ts
├── supabase/
│   └── migrations/             # Database migration files
└── docs/
    ├── operations-guide.pdf    # Staff guide
    └── api-reference.md
```

---

*Document prepared by: Solutions Architecture Team*  
*Last updated: June 2026*  
*Next review: Upon completion of Phase 1 MVP*
