# structure.md

SLA-AI-COURSE-001/
├── CLAUDE.md               → project instructions, hard rules, and stack decisions
├── AGENTS.md               → guidance for AI agents working in this repo
├── SKILL.md                → project skills reference: core, stack, conventions, tasks, constraints
├── planning.md             → full architecture, schema, sprints, and rationale
├── decisions.md            → decision log — what we chose, why, and what we ruled out
├── structure.md            → this file — directory map and purpose of each folder
├── .gitignore              → files excluded from version control
│
├── .claude/                → Claude Code configuration for this repo
│   ├── settings.json       → hooks: SessionStart/PreCompact (bd prime), Stop (close guard)
│   ├── SKILL.md            → Claude Code workflow skills: beads, hooks, session close
│   ├── agents/             → autonomous agent definitions
│   │   ├── sprint-planner.md  → reads planning.md §16, creates/audits sprint issues in beads
│   │   ├── health-check.md    → daily audit: bd doctor, stale/orphans, git status, dolt push
│   │   ├── session-close.md   → enforces mandatory close protocol (commit → push → verify)
│   │   └── daily-wrapup.md    → end-of-session summary: reads notes/, beads, git log → log/
│   └── hooks/              → shell scripts invoked by Claude Code hooks
│       └── session-close-check.sh  → Stop hook: warns on uncommitted or unpushed work
│
├── notes/                  → session notes and persistent memory
│   └── memory.md           → dated lessons learned, kept across sessions
│
├── log/                    → daily wrap-up summaries written by daily-wrapup agent
│   └── YYYY-MM-DD.md       → one file per day: done / doing / next
│
├── example_Activities/     → course activity examples and reference material
│   └── agent_loop.md       → explains the agent loop with the Ayesha example
│
└── .beads/                 → beads issue tracker (Dolt-backed, AI-native)
    ├── config.yaml         → bd CLI configuration for this repo
    ├── issues.jsonl        → passive JSONL export of all issues
    ├── interactions.jsonl  → audit log of bd commands run in this session
    └── README.md           → beads quick-start reference
