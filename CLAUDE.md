# Rules

AI context for this repository. Read this before doing anything.

---

## Who / Environment

- **Owner:** Otávio Miranda - Tech Lead, content creator, educator.
- **Stack:** macOS, Neovim, Tmux, Python, Node.js, TypeScript.
- **Tone:** teammate, direct, no corporate fluff.
- **Language:** English everywhere — code, comments, commits, PRs, issues,
  files. Chat is also English. Owner's native language is Brazilian Portuguese;
  expect typos and creative spelling in chat — ignore them. If a topic gets
  complex, either party may switch to PT-BR briefly to avoid miscommunication.

---

## The Project

**SSH Toolkit** (`sshtoolkit.otaviomiranda.com.br`) — a browser-based SSH
toolkit that generates key pairs, hardens servers, configures clients, and
builds tunnel commands. 100% client-side, nothing leaves the browser.

Full requirements in `./PRD.md`.

- **Runtime:** Node.js >= 22.12.0 (build only), Browser (runtime)
- **Interface:** Web — multi-page Astro static site
- **Database:** None — zero backend, zero tracking
- **Build:** Astro 6.x, TypeScript 5.x, Vitest
- **Deploy:** GitHub Pages via CNAME
- **Crypto:** Web Crypto API (Ed25519/RSA key generation)
- **Dependencies:** fflate (ZIP bundling)

### Pages

| Route | Tool | Purpose |
|-------|------|---------|
| `/` | Home | Landing page with tool cards |
| `/keygen` | Key Generator | Generate Ed25519/RSA key pairs |
| `/hardening` | Server Hardening | Generate hardened `sshd_config` |
| `/config` | Client Config | Generate `~/.ssh/config` |
| `/tunnels` | Tunnels | Build SSH tunnel commands with visual diagrams |

---

## Workflow

Our context will be GitHub Issues, commits and PRs (`gh` installed and
available).

Default Workflow: **Issues → branch → PR → merge.** That's it.

1. **Pick an issue** from GitHub Issues. If none exists, create one first using
   the appropriate issue template if available. If no issue template is found,
   we need to create them (warn the owner).
2. **Create a branch** for that issue.
3. **Always Work in small conventional commits** (`feat`, `fix`, `refactor`,
   `chore`, `docs`).
4. **Open a PR** using the PR template and reference the issue in the body
   (`closes #N`). If no PR template is found, we need to create them (warn the
   owner).
5. **Merge** the PR. GitHub closes the linked issue automatically.

Since we are using only `git` for context, we have to be explicit, precise and
concise about every change in this repository. Always describe what matters for
the project in the commits, issues and PRs.

### Commit style

```
type(scope): short imperative description

Optional body describing where, what, why (if it matters for the project understanding).
```

`Co-Authored-By: Agent_Name` is optional for commits. But, since we may use more
than one agent, it would help to know exactly which agent wrote the code.

### Safety rules

Never do any of the (and warn the owner even if asked).

- Never force-push `main`.
- No destructive git ops without explicit user confirmation.
- Never commit `.env` or any secrets.
