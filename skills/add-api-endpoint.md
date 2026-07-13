# Skill: Add API endpoint

Use when adding a new REST route to the Express backend.

## When to use

- Sprint task requires a new staff-facing or internal API endpoint
- You are extending students, routes, assignments, or webhook handlers

## Steps

1. Create beads issue and claim it: `bd create` → `bd update <id> --claim`.
2. Add route file under `apps/api/src/routes/<name>.ts`.
3. Apply `authMiddleware` from `apps/api/src/middleware/auth.ts` on every non-health endpoint.
4. For webhooks only: add `verifySignature` from `apps/api/src/middleware/verifySignature.ts`.
5. Register route in `apps/api/src/app.ts`.
6. Write unit tests in `apps/api/tests/<name>.test.ts` — target 70%+ coverage on business logic.
7. Update `docs/api-reference.md` with method, path, auth, and request/response shape.
8. Close beads issue and commit with a descriptive message.

## Gotchas

- No API keys or `.env` values in git — document new vars in `.env.example` only.
- Rate limiting is applied globally via `apps/api/src/middleware/rateLimiter.ts` — don't bypass.
- RLS must stay enabled on all Supabase tables — never disable for convenience.

## Files to touch

| File | Action |
|------|--------|
| `apps/api/src/routes/<name>.ts` | New route |
| `apps/api/src/app.ts` | Register route |
| `apps/api/tests/<name>.test.ts` | Tests |
| `docs/api-reference.md` | API docs |
| `.env.example` | New env vars (if any) |
