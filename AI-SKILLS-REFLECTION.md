# AI Skills & Agents — School Transport Route Planner
## One-Page Reflection

**Student / Author:** Kitili Mbula  
**Project:** SLA-AI-COURSE-001 — Automated School Transport Route Planning for Silverleaf Academy  
**GitHub:** https://github.com/MzeZAMBI-lass/SLA-AI-COURSE-001  
**Date:** July 13, 2026

---

### What was created

**Project reference** (repo root):

| File | Purpose |
|------|---------|
| `SKILL.md` | Project-wide context — purpose, stack, conventions, common tasks, constraints |
| `AGENTS.md` | How AI agents should orient, use skills, and track work in this repo |

**Task-recipe skills** (`skills/`):

| Skill | Purpose |
|-------|---------|
| `parse-whatsapp-location.md` | Extract coordinates or address from WhatsApp payloads |
| `geocode-student-address.md` | Nominatim + ORS workflow with confidence thresholds |
| `add-api-endpoint.md` | Auth, tests, and docs checklist for new API routes |
| `review-route-assignment.md` | Staff dashboard accept/override/reject workflow |

**Agents** (`.claude/agents/`):

| Agent | Purpose |
|-------|---------|
| `sprint-planner` | Maps `planning.md` §16 sprints to beads issues with dependencies |
| `health-check` | Daily audit: beads doctor, git status, stale/orphan issues |
| `session-close` | Enforces commit → push → verify close protocol |
| `daily-wrapup` | End-of-session summary to `log/YYYY-MM-DD.md` |

---

### Why these matter for *this* project

Silverleaf Academy assigns hundreds of students to bus routes manually — about 10 minutes per student. The system ingests parent locations via WhatsApp, geocodes informal Tanzanian addresses, calculates road distances, and suggests route matches. That pipeline spans **privacy rules** (never log lat/lng), **free-tier API limits** (Nominatim 1 req/sec, ORS 2,000/day), and **staff review gates** (low-confidence geocodes must not auto-assign).

Without `SKILL.md`, every new AI session rediscovers the stack and re-violates privacy constraints. Without task recipes in `skills/`, the assistant treats geocoding like a generic CRUD task and skips the confidence threshold check. The `sprint-planner` agent prevents skipping ahead to Phase 2 notifications before the MVP webhook → parser → geocoder chain is solid.

---

### Thinking with AI vs using AI

Using AI means "add a geocoding function." **Thinking with AI** means asking: *which sprint owns this, does it respect the 1 req/sec limit, what happens below confidence threshold, and which dashboard page flags it for staff?* These skills and agents encode that reasoning as reusable project memory so the assistant behaves like a teammate who has worked on school transport routing before — not a generic coder.

---

### Repository link

https://github.com/MzeZAMBI-lass/SLA-AI-COURSE-001
