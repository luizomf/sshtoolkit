# SSH Toolkit

Browser-based SSH toolkit for developers, students, and sysadmins. It generates
SSH keys, hardened `sshd_config` files, client-side `~/.ssh/config` entries, and
SSH tunnel commands.

Everything runs in the browser. There is no backend, no database, no cookies,
no analytics, and no tracking. Sensitive SSH data should never leave the user's
machine.

Live site: **https://sshtoolkit.otaviomiranda.com.br**

## Tools

| Tool | Route | Purpose |
| --- | --- | --- |
| Tunnel Builder | [`/tunnels`](https://sshtoolkit.otaviomiranda.com.br/tunnels/) | Build SSH tunnel commands with visual diagrams. |
| Server Hardening | [`/hardening`](https://sshtoolkit.otaviomiranda.com.br/hardening/) | Generate hardened `sshd_config` output with presets and a security score. |
| Client Config | [`/config`](https://sshtoolkit.otaviomiranda.com.br/config/) | Build, import, preview, copy, and download `~/.ssh/config` entries. |
| Key Generator | [`/keygen`](https://sshtoolkit.otaviomiranda.com.br/keygen/) | Generate Ed25519 and RSA key pairs with Web Crypto. |

## Privacy Model

- Static Astro site. The browser is the runtime.
- No API calls are needed for any tool.
- No user SSH key, config, hostname, command, or generated file is sent to a
  server by the app.
- The generated output is shown locally and can be copied or downloaded from the
  browser.
- You can verify this by opening DevTools and checking the Network tab while
  using the tools.

## Client Config

The Client Config tool builds a `~/.ssh/config` file from editable host cards.
Each card can be collapsed, removed, reordered with drag-and-drop, copied through
the final output, and included in a downloaded `config` file.

Supported basic fields:

- `Host`
- `HostName`
- `User`
- `Port`
- `IdentityFile`
- `ProxyJump`

Supported advanced fields:

- `ForwardAgent`
- `IdentitiesOnly`
- `AddKeysToAgent`
- `HostKeyAlias`
- `StrictHostKeyChecking`
- `UserKnownHostsFile`
- `LogLevel`
- `IgnoreUnknown`
- `RequestTTY`
- `ServerAliveInterval`
- `ServerAliveCountMax`
- `LocalForward`
- `RemoteForward`
- `SendEnv`
- `SetEnv`
- `RemoteCommand`
- `ExitOnForwardFailure`

Generation behavior:

- Empty values are omitted.
- `Port 22` is omitted because it is the SSH default.
- `ForwardAgent` and `ExitOnForwardFailure` are emitted as `yes` or `no` when
  set.
- `RequestTTY auto` is omitted because it is the default UI state.
- Multiline fields emit one directive per non-empty line.
- Unknown imported directives are preserved and emitted through `extraOptions`.

Import behavior:

- The import modal accepts an existing `~/.ssh/config` pasted as text.
- `Key value` and `Key=value` syntax are both accepted.
- Blank lines and comments are ignored.
- Lines before the first `Host` block are ignored.
- Known directives populate dedicated fields.
- Unknown directives, for example `CanonicalizeHostname yes` and
  `ConnectTimeout 10`, are preserved as extra options.

## ProxyJump Workflow

The current Client Config workflow includes a video-ready ProxyJump recipe and
preview helpers for bastion/private-host setups.

Click the `Receita ProxyJump para vídeo` card on `/config` to load:

```sshconfig
Host bastion
    HostName bastion.example.com
    User deploy
    IdentityFile ~/.ssh/id_ed25519

Host prod-db
    HostName 10.0.10.20
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ProxyJump bastion
    HostKeyAlias prod-db-private
```

Expected visible behavior:

- Both `bastion` and `prod-db` host cards are created and opened.
- The `prod-db` card shows the visual chain `Você -> bastion -> prod-db`.
- The generated config keeps `IdentitiesOnly yes`, `ProxyJump bastion`, and
  `HostKeyAlias prod-db-private`.
- ProxyJump command previews appear for `prod-db`.
- Copy buttons work for the final config and each generated preview.

Expected command previews from the recipe:

```bash
ssh prod-db
ssh -J bastion -i ~/.ssh/id_ed25519 deploy@10.0.10.20
scp -o ProxyJump=bastion -i ~/.ssh/id_ed25519 ./local-file deploy@10.0.10.20:/remote/path/
rsync -av -e 'ssh -J bastion -i ~/.ssh/id_ed25519' ./local-file deploy@10.0.10.20:/remote/path/
```

ProxyJump edge cases:

- A comma-separated value such as `bastion-edge,bastion-inner` is rendered as
  separate hops in the chain.
- The raw `ProxyJump` value is preserved in the generated config and in direct
  command previews.
- `ProxyJump none` is preserved in the generated config, but it is treated as no
  active jump for chain visualization and command previews.
- Nested jump-host aliases are resolved in the visual chain. For example, if
  `app` jumps to `inner` and `inner` jumps to `edge`, the route is displayed as
  `Você -> edge -> inner -> app`.
- Circular jump-host references are guarded and marked in the chain.
- Command previews are hidden for wildcard, negated, comma-separated, or
  multi-alias `Host` patterns because those are not concrete SSH targets.
- Preview commands are practical templates. Replace placeholder paths such as
  `./local-file` and `/remote/path/` before using `scp` or `rsync`.

## Tunnel Builder

The Tunnel Builder creates SSH commands, `autossh` commands, equivalent
`~/.ssh/config` blocks, and visual diagrams for tunnel direction.

Supported tunnel types:

- Local forward: `-L localPort:remoteHost:remotePort`
- Remote forward: `-R remotePort:localHost:localPort`
- Dynamic SOCKS proxy: `-D localPort`

Supported SSH options:

- SSH server, optional user, optional non-default port.
- Optional private key through `-i`.
- Optional jump host through `-J`.
- `-N` for no remote shell.
- `-f` for background mode.
- `-C` for compression.
- `ExitOnForwardFailure=yes`.
- `ServerAliveInterval` and `ServerAliveCountMax`.
- Multiple tunnels in a single command.

Use-case cards load examples for:

- Remote database access through a local forward.
- Exposing a local development server through a remote forward.
- Browsing through a remote SOCKS proxy.

## Server Hardening

The Server Hardening tool generates an `sshd_config` and an application script.
It is designed for review before copying the generated file to a server.

Presets:

- Paranoid: public-key-only defaults, root login disabled, forwarding disabled.
- Balanced: secure general-purpose defaults with TCP forwarding enabled.
- Permissive: lab/testing defaults with more features enabled.

Config areas:

- Authentication: port, root login, public key auth, password auth,
  keyboard-interactive auth, challenge-response auth, empty passwords,
  authentication methods, max auth tries, login grace time, and PAM.
- Access control: `AllowUsers`, `AllowGroups`, `DenyUsers`, and `DenyGroups`.
- Network: `ListenAddress`, `AddressFamily`, client alive settings, and
  `UseDNS`.
- Security: X11 forwarding, agent forwarding, TCP forwarding, stream local
  forwarding, gateway ports, tunnel permission, user environment, user RC,
  strict modes, session limits, startups, and log level.
- Banners: `PrintMotd`, `PrintLastLog`, and `Banner`.

Review helpers:

- Security score from 0 to 100 with grade `A` through `F`.
- Warnings for dangerous, risky, or informational choices.
- Copy button for the generated `sshd_config`.
- Download button for `sshd_config`.
- Download button for `apply-sshd.sh`, which backs up the current config, runs
  `sshd -t`, and restarts the service when the generated config is valid.

## Key Generator

The Key Generator creates SSH key pairs locally with the Web Crypto API.

Supported key types:

- Ed25519, recommended for modern systems.
- RSA 2048 for compatibility.
- RSA 4096 for RSA-specific setups that want a larger key.

Generated output:

- Private key.
- Public key.
- SHA256 fingerprint.
- Equivalent `ssh-keygen` command.
- `ssh-copy-id` install command.
- File permission commands for `~/.ssh`, private key, public key, and
  `authorized_keys`.

Download behavior:

- Public key downloads as `id_ed25519.pub` or `id_rsa.pub`.
- Private key downloads as `id_ed25519` or `id_rsa`.
- ZIP download includes the private key, public key, and `README.txt` setup
  instructions.

Important limitation:

- Generated keys are currently not encrypted with a passphrase. Protect the
  downloaded private key and never share it.

## Local Review Checklist

Use this checklist to review the current behavior before merging a PR.

```bash
git fetch origin
git switch codex/proxyjump-client-config-stack
npm install
npm test
npm run build
npm run dev -- --host 127.0.0.1 --port 4321
```

Open `http://127.0.0.1:4321/config/` and verify:

- Clicking `Receita ProxyJump para vídeo` creates `bastion` and `prod-db`.
- The generated config matches the recipe shown in this README.
- The visual route is `Você -> bastion -> prod-db`.
- The `ssh`, `scp`, and `rsync` previews match the commands shown above.
- Expanding advanced options on `prod-db` shows `IdentitiesOnly yes` and
  `HostKeyAlias prod-db-private`.
- Setting `ProxyJump` to `none` keeps `ProxyJump none` in the generated config
  and hides the visual chain and previews.
- Setting `ProxyJump` to `bastion-edge,bastion-inner` displays separate hop
  nodes and keeps the raw comma-separated value in the direct command preview.
- Importing a host with `IdentitiesOnly`, `AddKeysToAgent`, `LogLevel`,
  `IgnoreUnknown`, `SendEnv`, `SetEnv`, `StrictHostKeyChecking`,
  `UserKnownHostsFile`, and `HostKeyAlias` fills dedicated fields and
  regenerates them as first-class directives.
- Adding an unrelated unknown option still preserves it in generated output.
- A wildcard host such as `*.prod` can keep `ProxyJump` in generated config, but
  does not show command previews.

Then spot-check the other routes:

- `/keygen`: generate an Ed25519 key, verify fingerprint/public/private outputs,
  copy buttons, individual downloads, ZIP download, install command, and
  permission commands.
- `/hardening`: switch each preset, verify score/warnings update, copy the
  generated config, and download `sshd_config` plus `apply-sshd.sh`.
- `/tunnels`: load each use-case card, verify the diagram, SSH command,
  `autossh` command, equivalent config block, and copy buttons.

## Out of Scope for the ProxyJump Stack

The current ProxyJump Client Config stack does not implement:

- `Match` blocks.
- Bastion server hardening recipes.
- `PermitOpen` or jump-only user generation.
- Ansible previews.
- SFTP previews.
- Cloud-provider alternatives.
- MFA, SSO, RBAC, audit/session recording, or governance workflows.
- A site redesign.
- Backend services.

## Development

Requirements:

- Node.js >= 22.12.0

Commands:

```bash
npm install
npm run dev
npm test
npm run build
```

Project stack:

- Astro 6.x
- TypeScript 5.x
- Web Crypto API
- fflate for ZIP generation
- Vitest
- GitHub Pages

## Author

**Otavio Miranda** - [otaviomiranda.com.br](https://www.otaviomiranda.com.br)

- [YouTube](https://www.youtube.com/@otaboranern)
- [GitHub](https://github.com/luizomf)

## License

[MIT](./LICENSE)
