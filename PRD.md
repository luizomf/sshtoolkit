# SSH Toolkit — Product Requirements Document

> **Status:** Draft v1.0 **Date:** 2026-03-24 **Owner:** Otavio Miranda
> **Repo:** sshconfgen (deploy as `sshtoolkit.otaviomiranda.com.br`)

---

## 1. Vision

A browser-based SSH toolkit that helps developers and sysadmins generate SSH key
pairs, harden servers, configure clients, and build tunnel commands — all in one
place, 100% client-side, nothing leaves the browser.

**Tagline:** _"Everything SSH. Nothing leaves your browser."_

---

## 2. Target Audience

| Persona                    | Needs                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **Beginner dev / student** | Guided experience, explanations of what each option does, safe defaults, "what is this?" tooltips |
| **Experienced dev**        | Speed — fill in the fields, grab the output, move on                                              |
| **Sysadmin**               | Comprehensive options, copy-paste-ready commands, hardening best practices                        |

The UI must serve all three: **sensible defaults for beginners, full control for
experts**. Progressive disclosure — start simple, expand on demand.

---

## 3. Stack & Architecture

| Layer     | Choice             | Rationale                                                     |
| --------- | ------------------ | ------------------------------------------------------------- |
| Framework | **Astro 6.x**      | Same as wgfront, static output, multi-page support            |
| Language  | **TypeScript 5.x** | Type safety, same as wgfront                                  |
| Styling   | **CSS (custom)**   | CRT-inspired dark theme, differentiated from wgfront (see §8) |
| Crypto    | **Web Crypto API** | Ed25519 key generation, no external crypto deps               |
| ZIP       | **fflate**         | Bundle multiple files for download                            |
| Testing   | **Vitest**         | Same as wgfront                                               |
| Deploy    | **GitHub Pages**   | `sshtoolkit.otaviomiranda.com.br` via CNAME                   |
| Node.js   | **>= 22.12.0**     | Matches wgfront                                               |

### Architecture Principles

- **Zero backend** — all logic runs in the browser
- **Zero tracking** — no analytics, no cookies, no external requests
- **Multi-page** — each tool is its own Astro page with shared layout/nav
- **Shared state** — pub/sub store (same pattern as wgfront) scoped per page
- **Progressive disclosure** — basic options visible, advanced behind expandable
  sections

---

## 4. Pages & Navigation

Top-level navigation (persistent header/menu):

```
[Home]  [Key Generator]  [Server Hardening]  [Client Config]  [Tunnels]
```

### 4.1 Home (`/`)

Landing page with:

- Hero: project name, tagline, privacy badge ("runs 100% in your browser")
- Card grid linking to each tool with a one-line description
- Brief "What is SSH?" section for beginners (collapsible)

### 4.2 Key Generator (`/keygen`)

Generate SSH key pairs in the browser.

**Inputs:**

| Field      | Type     | Default         | Notes                                      |
| ---------- | -------- | --------------- | ------------------------------------------ |
| Key type   | Select   | `ed25519`       | Options: `ed25519`, `rsa` (2048/4096)      |
| Comment    | Text     | `user@hostname` | Goes into the public key                   |
| Passphrase | Password | _(empty)_       | Optional. If set, private key is encrypted |

**Outputs:**

- Private key (PEM / OpenSSH format)
- Public key (OpenSSH one-liner)
- Fingerprint (SHA256)
- Equivalent `ssh-keygen` command

**Actions:**

- Copy each output to clipboard
- Download private key as file (e.g., `id_ed25519`)
- Download public key as file (e.g., `id_ed25519.pub`)
- Download both as ZIP

**Technical Notes:**

- Web Crypto API supports Ed25519 (`crypto.subtle.generateKey` with `Ed25519`).
  The challenge is **exporting in OpenSSH format** — Web Crypto exports
  PKCS8/SPKI, so we need a conversion layer to produce the
  `-----BEGIN OPENSSH PRIVATE KEY-----` format that `ssh` actually reads.
- RSA is straightforward via Web Crypto.
- Passphrase encryption of private keys requires implementing `bcrypt-pbkdf` +
  `aes256-ctr` (the OpenSSH key encryption scheme). This is non-trivial.
  **Recommendation:** ship V1 without passphrase support, add it in V2, and
  clearly warn users that the generated private key is unencrypted.

**Beginner UX:**

- Tooltip: "What is a key pair?"
- Tooltip: "Where do I put these files?"
- Show the commands to install the key on a server (`ssh-copy-id` or manual
  `~/.ssh/authorized_keys` append)

---

### 4.3 Server Hardening (`/hardening`)

Generate a hardened `sshd_config` with security best practices.

**Inputs (grouped by section):**

#### Basic

| Field                   | Type   | Default | Notes                                                    |
| ----------------------- | ------ | ------- | -------------------------------------------------------- |
| SSH Port                | Number | `22`    | Warn if using default                                    |
| Permit root login       | Select | `no`    | `yes`, `no`, `prohibit-password`, `forced-commands-only` |
| Password authentication | Toggle | `off`   |                                                          |
| Pubkey authentication   | Toggle | `on`    |                                                          |
| Max auth tries          | Number | `3`     |                                                          |
| Login grace time        | Text   | `30s`   |                                                          |

#### Access Control

| Field          | Type         | Default   | Notes                |
| -------------- | ------------ | --------- | -------------------- |
| Allowed users  | Text (multi) | _(empty)_ | Space-separated list |
| Allowed groups | Text (multi) | _(empty)_ | Space-separated list |
| Deny users     | Text (multi) | _(empty)_ |                      |
| Deny groups    | Text (multi) | _(empty)_ |                      |

#### Network

| Field                  | Type         | Default   | Notes                  |
| ---------------------- | ------------ | --------- | ---------------------- |
| Listen address         | Text (multi) | `0.0.0.0` | Can add multiple       |
| Address family         | Select       | `any`     | `any`, `inet`, `inet6` |
| TCP keepalive          | Toggle       | `on`      |                        |
| Client alive interval  | Number       | `300`     | Seconds                |
| Client alive count max | Number       | `3`       |                        |

#### Security

| Field              | Type         | Default            | Notes |
| ------------------ | ------------ | ------------------ | ----- |
| X11 forwarding     | Toggle       | `off`              |       |
| Agent forwarding   | Toggle       | `off`              |       |
| TCP forwarding     | Toggle       | `on`               |       |
| Gateway ports      | Toggle       | `off`              |       |
| Permit tunnel      | Toggle       | `off`              |       |
| Strict modes       | Toggle       | `on`               |       |
| Accepted key types | Multi-select | `ed25519`, `ecdsa` |       |
| Log level          | Select       | `VERBOSE`          |       |
| Max sessions       | Number       | `10`               |       |
| Max startups       | Text         | `10:30:60`         |       |

#### Banners & Messages

| Field          | Type     | Default   | Notes            |
| -------------- | -------- | --------- | ---------------- |
| Banner         | Textarea | _(empty)_ | Pre-auth message |
| Print MOTD     | Toggle   | `off`     |                  |
| Print last log | Toggle   | `on`      |                  |

**Outputs:**

- Full `sshd_config` file with comments explaining each directive
- Security score/grade (visual indicator: A-F based on choices)
- Warning list (e.g., "root login enabled", "password auth enabled")
- Apply script:
  ```bash
  sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
  sudo cp sshd_config /etc/ssh/sshd_config
  sudo sshd -t && sudo systemctl restart sshd
  ```

**Actions:**

- Copy config to clipboard
- Download `sshd_config`
- Copy apply script to clipboard

**Beginner UX:**

- "Recommended" badge on secure defaults
- Each directive has a "Why?" tooltip
- Warning banner if user enables risky options
- Presets: "Paranoid", "Balanced", "Permissive" (one-click apply)

---

### 4.4 Client Config (`/config`)

Generate `~/.ssh/config` file.

**Host Entry Fields:**

| Field               | Type         | Default             | Notes                           |
| ------------------- | ------------ | ------------------- | ------------------------------- |
| Host alias          | Text         | _(required)_        | The `Host` directive value      |
| HostName            | Text         | _(required)_        | IP or FQDN                      |
| User                | Text         | _(empty)_           |                                 |
| Port                | Number       | `22`                |                                 |
| IdentityFile        | Text         | `~/.ssh/id_ed25519` | Path on client                  |
| ProxyJump           | Select       | _(none)_            | Dropdown of other defined hosts |
| ForwardAgent        | Toggle       | `off`               |                                 |
| ServerAliveInterval | Number       | `0`                 |                                 |
| ServerAliveCountMax | Number       | `3`                 |                                 |
| RequestTTY          | Select       | _(auto)_            | `auto`, `yes`, `no`, `force`    |
| RemoteCommand       | Text         | _(empty)_           |                                 |
| LocalForward        | Text (multi) | _(empty)_           | `port host:port` pairs          |
| RemoteForward       | Text (multi) | _(empty)_           | `port host:port` pairs          |

**Features:**

- Add/remove/reorder host entries
- Wildcard hosts (`Host *.prod`) with shared config
- Visual ProxyJump chain (shows the hop path)
- Import: paste an existing `~/.ssh/config` and parse into editable entries
- Drag-and-drop reorder (hosts are order-dependent in SSH config)

**Outputs:**

- Full `~/.ssh/config` with comments
- Quick-connect command per host (`ssh alias`)
- Install instructions

**Actions:**

- Copy full config to clipboard
- Download `config` file
- Copy individual host block

**Beginner UX:**

- "What is ProxyJump?" tooltip
- "What is agent forwarding?" tooltip with security warning
- Example: "Connect to a database server through a bastion host"

---

### 4.5 Tunnels (`/tunnels`)

Generate SSH tunnel commands with visual explanation.

**Tunnel Types:**

#### Local Forward (`-L`)

| Field              | Type   | Notes                   |
| ------------------ | ------ | ----------------------- |
| Local bind address | Text   | Default: `localhost`    |
| Local port         | Number | Required                |
| Remote host        | Text   | As seen from SSH server |
| Remote port        | Number | Required                |
| SSH server         | Text   | Hostname or alias       |
| SSH user           | Text   | Optional                |
| Jump host          | Text   | Optional (`-J`)         |

**Output:** `ssh -L 8080:db.internal:3306 user@bastion`

#### Remote Forward (`-R`)

| Field               | Type   | Notes                |
| ------------------- | ------ | -------------------- |
| Remote bind address | Text   | Default: `localhost` |
| Remote port         | Number | Required             |
| Local host          | Text   | Default: `localhost` |
| Local port          | Number | Required             |
| SSH server          | Text   | Required             |

**Output:** `ssh -R 9090:localhost:3000 user@server`

#### Dynamic / SOCKS (`-D`)

| Field              | Type   | Notes                |
| ------------------ | ------ | -------------------- |
| Local bind address | Text   | Default: `localhost` |
| Local port         | Number | Default: `1080`      |
| SSH server         | Text   | Required             |

**Output:** `ssh -D 1080 user@server`

**Features for all tunnel types:**

- **Visual diagram** showing the tunnel path:
  ```
  [Your Machine :8080] ──SSH──▶ [bastion] ──▶ [db.internal :3306]
  ```
- Extra flags: `-N` (no shell), `-f` (background), `-C` (compression)
- Equivalent `~/.ssh/config` block (so they can make it permanent)
- "Run in background" toggle (adds `-fN`)
- Autossh wrapper command option

**Beginner UX:**

- "What is a tunnel?" collapsible explainer
- Use case cards: "Access a remote database", "Expose local dev server", "Browse
  through a proxy"
- The visual diagram is the killer feature for understanding

---

## 5. Shared Components

| Component           | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `Header`            | Logo + nav links + current page highlight        |
| `Footer`            | Author, GitHub link, privacy notice              |
| `BaseLayout`        | HTML head, meta tags, shared CSS, nav            |
| `CodePreview`       | Syntax-highlighted output block with copy button |
| `Tooltip`           | "What is this?" hover/click explanations         |
| `ExpandableSection` | Progressive disclosure for advanced options      |
| `WarningBanner`     | Security warnings (e.g., "root login enabled")   |
| `CopyButton`        | One-click copy to clipboard with feedback        |
| `DownloadButton`    | Download file with custom filename               |

---

## 6. Shared Libraries

| Module                 | Purpose                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| `store.ts`             | Per-page pub/sub state management                                              |
| `crypto.ts`            | Ed25519/RSA key generation + OpenSSH format export                             |
| `ssh-config-parser.ts` | Parse existing `~/.ssh/config` into structured data                            |
| `sshd-options.ts`      | Hardening options metadata (name, type, default, description, security impact) |
| `validators.ts`        | Input validation (port ranges, IP formats, hostnames)                          |
| `download.ts`          | Browser file download utility                                                  |
| `clipboard.ts`         | Copy-to-clipboard utility                                                      |
| `zip.ts`               | ZIP bundling via fflate                                                        |
| `syntax-highlight.ts`  | Minimal SSH config syntax highlighter                                          |

---

## 7. Non-Functional Requirements

| Requirement         | Target                                                        |
| ------------------- | ------------------------------------------------------------- |
| **Privacy**         | Zero external requests. No analytics. No cookies.             |
| **Performance**     | < 2s first paint. Key generation < 500ms.                     |
| **Browser support** | Chrome 113+, Firefox 130+, Safari 17.4+ (Ed25519 requirement) |
| **Accessibility**   | Semantic HTML, keyboard navigable, ARIA labels                |
| **Responsive**      | Usable on mobile (though primary use is desktop)              |
| **SEO**             | Meta tags, OpenGraph, structured page titles                  |
| **Offline**         | Works offline after first load (static assets, no API calls)  |

---

## 8. Visual Identity

**Same CRT/cyberpunk family as wgfront, but differentiated:**

| Aspect       | wgfront              | sshtoolkit                                   |
| ------------ | -------------------- | -------------------------------------------- |
| Accent color | Neon green `#00ff9f` | Amber/gold `#ffb000` or cyan `#00d4ff` (TBD) |
| Glow         | Green glow           | Amber/cyan glow                              |
| Font         | JetBrains Mono       | JetBrains Mono (same)                        |
| Background   | Dark gray            | Dark gray (same family)                      |
| Identity     | WireGuard shield     | Terminal/key icon                            |

The color shift alone creates a distinct identity while keeping the family
resemblance. Visitors to both sites will know they're from the same author.

---

## 9. Implementation Phases

### Phase 1 — Foundation + Tunnels

- [ ] Project setup (Astro, TS, Vitest, GitHub Pages deploy)
- [ ] Shared layout, nav, theme (CSS tokens)
- [ ] Home page (landing + cards)
- [ ] Tunnel command builder (Local -L, Remote -R, Dynamic -D)
- [ ] Visual tunnel diagram
- [ ] Extra flags (-N, -f, -C, keepalive, ExitOnForwardFailure, autossh)
- [ ] Multiple tunnels support
- [ ] Equivalent `~/.ssh/config` block output
- [ ] Tests for command generation

**Why tunnels first:** companion to the SSH Tunnels article/video
(published 2026-03-25). Exercises all shared components (form → preview →
copy pattern) without crypto complexity.

### Phase 2 — Server Hardening

- [ ] Server Hardening page (full feature set)
- [ ] Presets (Paranoid / Balanced / Permissive)
- [ ] Security score system
- [ ] Tests for sshd_config generation

### Phase 3 — Client Config

- [ ] Client Config page
- [ ] Host entry CRUD
- [ ] ProxyJump chain visualization
- [ ] Wildcard host support
- [ ] Import/parse existing config
- [ ] Tests for config generation and parser

### Phase 4 — Key Generator

- [ ] Ed25519 key generation via Web Crypto
- [ ] OpenSSH format export (PKCS8 → OpenSSH conversion)
- [ ] RSA key generation (2048/4096)
- [ ] Fingerprint display
- [ ] Download keys (individual + ZIP)
- [ ] Tests for key generation and format conversion
- [ ] _(V2)_ Passphrase encryption support

---

## 10. File Structure (Proposed)

```
src/
├── pages/
│   ├── index.astro                # Home / landing
│   ├── keygen.astro               # Key Generator
│   ├── hardening.astro            # Server Hardening
│   ├── config.astro               # Client Config
│   └── tunnels.astro              # Tunnels
├── layouts/
│   └── Base.astro                 # Shared HTML shell + nav
├── components/
│   ├── Header.astro               # Logo + navigation
│   ├── Footer.astro               # Attribution + privacy
│   ├── CodePreview.astro          # Syntax-highlighted output
│   ├── CopyButton.astro           # Clipboard copy
│   ├── DownloadButton.astro       # File download
│   ├── Tooltip.astro              # Info tooltips
│   ├── ExpandableSection.astro    # Progressive disclosure
│   ├── WarningBanner.astro        # Security warnings
│   ├── SecurityScore.astro        # A-F grade display
│   ├── TunnelDiagram.astro        # Visual tunnel path
│   ├── HostCard.astro             # Client config host entry
│   └── ProxyChain.astro           # Jump host visualization
├── lib/
│   ├── store.ts                   # Pub/sub state management
│   ├── crypto.ts                  # Key generation + format conversion
│   ├── sshd-options.ts            # Hardening options metadata
│   ├── sshd-generator.ts          # sshd_config builder
│   ├── config-generator.ts        # ~/.ssh/config builder
│   ├── config-parser.ts           # Parse existing SSH config
│   ├── tunnel-generator.ts        # Tunnel command builder
│   ├── validators.ts              # Input validation
│   ├── syntax-highlight.ts        # SSH syntax highlighter
│   ├── download.ts                # Browser download utility
│   ├── clipboard.ts               # Clipboard utility
│   ├── zip.ts                     # ZIP bundling
│   └── __tests__/
│       ├── sshd-generator.test.ts
│       ├── config-generator.test.ts
│       ├── config-parser.test.ts
│       ├── tunnel-generator.test.ts
│       ├── crypto.test.ts
│       └── validators.test.ts
├── styles/
│   └── global.css                 # Theme tokens + base styles
└── vendor/
    └── fonts/                     # JetBrains Mono
```

---

## 11. Open Questions

| #   | Question                                                                                  | Impact                                                  |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | **Accent color:** amber `#ffb000` or cyan `#00d4ff`?                                      | Visual identity                                         |
| 2   | **`authorized_keys` manager?** Tool to build/edit `authorized_keys` file from public keys | Could be a 5th page or merged into keygen               |
| 3   | **SSH agent commands?** Generate `ssh-agent` + `ssh-add` commands                         | Small scope, could live on keygen page                  |
| 4   | **SCP/rsync helper?** Generate file transfer commands                                     | Scope creep risk, but useful                            |
| 5   | **Repo rename?** Current repo is `sshconfgen`, deploy domain is `sshtoolkit`              | Cosmetic, can keep repo name and just CNAME differently |
| 6   | **i18n?** PT-BR + EN?                                                                     | Significant effort, recommend EN-only for V1            |

---

## 12. Success Criteria

- All 4 tools fully functional in the browser
- Zero external requests (verifiable via DevTools Network tab)
- Comprehensive test coverage for all generators and parsers
- Lighthouse score > 90 on all categories
- Works offline after first load
