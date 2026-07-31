# memory.md


2026-06-11 · wrote planning.md

Started with an ideal-world architecture — ignored real constraints like
free-tier APIs and informal Tanzanian addresses.
Next time → scope for real constraints first.

2026-06-11 · pushed planning.md

Used technical jargon throughout — non-technical staff couldn't follow it.
Next time → use simple language to explain complex technical terms.

2026-06-18 · wrote agent_loop.md

Used abstract definitions to explain the feedback loop — hard to grasp.
A concrete example (Ayesha's failed email, successful SMS) made it click far better.

2026-06-19 · wrote CLAUDE.md

Skipped writing constraints upfront — hit privacy trade-offs mid-build.
Next time → write rules before touching code.

2026-06-19 · committed & pushed CLAUDE.md

Pushed to the wrong repository — had to redo the work.
Next time → ask and confirm the correct repo before pushing.

2026-07-02 · created structure.md and pushed to origin/main

Fetched, pulled remote changes, then drafted and committed structure.md mapping every file and folder with one-line descriptions.
Next time → flag the `~/home/...` path typo immediately rather than waiting for the user to notice.

2026-07-05 · ran full project audit, filled all gaps, and passed all four standards

Audited memory.md, decisions.md, structure.md, and beads against defined standards. Found two gaps: structure.md was out of date (missing decisions.md, AGENTS.md, .beads/, .gitignore), and beads had zero real tasks. Fixed both — updated the directory map, created decisions.md with three real what/why/ruled-out entries, created five sprint tasks in beads, and set them across three states (in_progress, in_review, closed). All four standards passed on the re-audit.
Next time → run the audit at the start of a session, not the end — catching gaps early means fixing them doesn't eat into work time.

2026-07-21 to 2026-07-24 · Sprint 1 stalled on a manual Netlify step

Four days with no commits. Deployment config (netlify.toml, Node pinning, plugin) was committed and pushed on 2026-07-20, but the Netlify site itself still needed a five-minute manual step (netlify.com → Add new site → Import from GitHub) that never got done. Sprint 1 (auth middleware, DB schema migrations, geocoding pipeline) sat paused the whole time waiting on it, and the daily wrap-up log repeated the same "still pending" note for four days straight.
Next time → do the quick manual platform step as soon as it's identified as a blocker, or decouple local Sprint 1 work from it so a five-minute task doesn't stall a sprint for days.

2026-07-25 · added logout button, then had to fix it same day

Shipped the logout button (`LogoutButton.tsx`) without checking where it actually sent staff after sign-out, so a second commit was needed a few minutes later to make it redirect to the login page.
Next time → verify the redirect target as part of the same change, not as a follow-up fix.

2026-07-27 · shipped Sprint 5.2 (route map rendering) while Sprint 1 was still open

Built the `routePath` service and Leaflet rendering for route paths via OpenRouteService, with caching on the route row to respect the ORS free-tier limit — solid MVP work, but it landed while Sprint 1's foundation items (auth middleware, DB migrations, geocoding pipeline) were still incomplete, jumping ahead of planning.md's sprint order.
Next time → close out or explicitly re-scope a blocked foundation sprint before picking up later sprint work, so the gap doesn't get papered over by newer commits.

2026-07-27 · beads tracker logged as broken three sessions running, never diagnosed

Daily wrap-up notes on 2026-07-23, 07-24, and 07-27 each recorded "Beads not available in remote environment" and moved on without investigating why, even though CLAUDE.md requires bd for all task tracking.
Next time → treat a repeated tooling failure as something to diagnose (or at least file a note about) instead of logging the same line again.


