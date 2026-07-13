# Skill: Parse WhatsApp location message

Use when implementing or debugging the WhatsApp webhook → message parser pipeline.

## When to use

- A parent sends a home address, location pin, Google Maps link, or plain-text address via WhatsApp
- You need to extract coordinates or address text from `incoming_messages.raw_payload`
- You are writing or fixing unit tests in `apps/api/tests/messageParser.test.ts`

## Steps

1. Verify HMAC signature in `verifySignature` middleware before parsing.
2. Read `apps/api/src/services/messageParser.ts` — three supported input types:
   - Native WhatsApp location pin (`location.latitude`, `location.longitude`)
   - Google Maps link (extract lat/lng from URL)
   - Plain-text address string (pass to geocoding service)
3. Return a normalized object: `{ type, address?, lat?, lng?, sourceMessageId }`.
4. If parsing fails, set `processing_status = 'failed'` and flag for staff review — never silently drop.
5. Add or update a fixture in `notes/` (see beads issue `SLA-AI-COURSE-001-5v5`) before writing tests.

## Gotchas

- `whatsapp-web.js` is pilot-only — production must use 360dialog/Twilio official API.
- Never log raw phone numbers or lat/lng values — PII prohibition (see `CLAUDE.md`).
- Parser must handle informal Tanzanian addresses (landmarks, ward names, no street number).

## Files to touch

| File | Action |
|------|--------|
| `apps/api/src/routes/webhook.ts` | Webhook receiver |
| `apps/api/src/services/messageParser.ts` | Parser logic |
| `apps/api/tests/messageParser.test.ts` | Unit tests |
| `docs/api-reference.md` | Update if webhook contract changes |
