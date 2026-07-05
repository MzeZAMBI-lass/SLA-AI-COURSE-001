# structure.md

SLA-AI-COURSE-001/
├── CLAUDE.md               → project instructions, hard rules, and stack decisions
├── AGENTS.md               → guidance for AI agents working in this repo
├── planning.md             → full architecture, schema, sprints, and rationale
├── decisions.md            → decision log — what we chose, why, and what we ruled out
├── structure.md            → this file — directory map and purpose of each folder
├── .gitignore              → files excluded from version control
│
├── notes/                  → session notes and persistent memory
│   └── memory.md           → dated lessons learned, kept across sessions
│
├── example_Activities/     → course activity examples and reference material
│   └── agent_loop.md       → explains the agent loop with the Ayesha example
│
└── .beads/                 → beads issue tracker (Dolt-backed, AI-native)
    ├── config.yaml         → bd CLI configuration for this repo
    ├── issues.jsonl        → passive JSONL export of all issues
    ├── interactions.jsonl  → audit log of bd commands run in this session
    └── README.md           → beads quick-start reference
