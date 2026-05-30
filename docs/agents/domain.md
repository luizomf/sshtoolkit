# Domain Docs

This is a single-context repo. Engineering skills should use one shared domain
language for the whole SSH Toolkit codebase.

## Context Sources

Before making architectural, diagnostic, or issue-triage recommendations, read
these files when they exist:

- `CONTEXT.md` at the repo root
- `docs/adr/` at the repo root

If these files do not exist yet, proceed silently. Their absence is not a
blocker and should not trigger speculative documentation work.

## Current Layout

The repo currently uses:

```text
/
├── AGENTS.md
├── PRD.md
├── README.md
└── src/
```

Future domain documentation should follow this single-context layout:

```text
/
├── CONTEXT.md
├── docs/
│   ├── adr/
│   └── agents/
└── src/
```

## Vocabulary

Use the project language from `PRD.md`, `README.md`, and future `CONTEXT.md`.
For this repo, prefer these terms consistently:

- SSH Toolkit
- Client Config
- Server Hardening
- Key Generator
- Tunnel Builder
- `~/.ssh/config`
- `sshd_config`
- ProxyJump
- bastion host
- jump host

## ADRs

When `docs/adr/` exists, read ADRs relevant to the area being changed. If a
recommendation conflicts with an ADR, call out the conflict explicitly instead
of silently overriding it.
