# API Reference

Base URL: `http://localhost:3001` (development) / `https://your-domain.com` (production)

All endpoints except `/health` and `GET /webhook/whatsapp` require an `Authorization: Bearer <token>` header (Supabase JWT).

---

## Health

### GET /health
Returns `{ "status": "ok" }`. No auth required.

---

## Webhook

### GET /webhook/whatsapp
Meta webhook verification handshake. Responds with `hub.challenge` when `hub.verify_token` matches `WHATSAPP_WEBHOOK_SECRET`.

### POST /webhook/whatsapp
Receives incoming WhatsApp events. Verifies HMAC-SHA256 signature via `X-Hub-Signature-256` header. Rate limited to 100 req/min. Acknowledges immediately with `200` and processes async.

---

## Students

### GET /api/students
Returns all students with their locations and assignments.

### GET /api/students/:id
Returns a single student with full location and route assignment details.

### POST /api/students
Creates a student record.

**Body:**
```json
{
  "name": "Amina Hassan",
  "grade": "Grade 5",
  "parent_name": "Fatuma Hassan",
  "parent_phone": "+255712000001",
  "whatsapp_id": null
}
```

### PATCH /api/students/:id
Updates student fields. Partial updates supported.

---

## Routes

### GET /api/routes
Returns all active routes with occupancy counts.

### GET /api/routes/:id/students
Returns all active student assignments for a route, ordered by pickup_order.

### POST /api/routes
Creates a new route.

**Body:**
```json
{
  "route_name": "Route A - North",
  "bus_number": "BUS-001",
  "driver_name": "John Msangi",
  "driver_phone": "+255712345678",
  "capacity": 15,
  "school_id": "00000000-0000-0000-0000-000000000001"
}
```

### PATCH /api/routes/:id
Updates route fields.

### DELETE /api/routes/:id
Soft-deletes route (sets `active = false`).

---

## Assignments

### GET /api/assignments/pending
Returns all assignments with `status = "pending_review"`, including student name, location, distance, and suggested route.

### POST /api/assignments/:id/confirm
Confirms a pending assignment. Sets `status = "active"` and records `assigned_by` / `assigned_at`.

### POST /api/assignments/:id/override
Moves a student to a different route and confirms.

**Body:**
```json
{ "route_id": "<uuid>" }
```

### POST /api/assignments/:id/flag
Flags an assignment for further investigation.

**Body:**
```json
{ "notes": "Location pin appears incorrect" }
```

---

## Export

### GET /api/export/csv
Downloads a CSV of all active student assignments.

**Query params:**
- `route_id` (optional) — filter to a single route

**CSV columns:** route_name, student_name, grade, address_text, latitude, longitude, road_distance_km, estimated_pickup_time

---

## Error Responses

All errors return JSON: `{ "error": "message" }`

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation failure |
| 401 | Missing or invalid auth token |
| 403 | Invalid webhook signature |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
