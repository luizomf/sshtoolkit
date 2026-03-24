# SSH Toolkit

Toolkit SSH completo no navegador: gere chaves, endureça servidores, configure
clientes e monte túneis. 100% client-side, zero tracking.

**https://sshtoolkit.otaviomiranda.com.br**

---

## Ferramentas

| Ferramenta | Rota | Status |
|------------|------|--------|
| **Tunnel Builder** | [`/tunnels`](https://sshtoolkit.otaviomiranda.com.br/tunnels/) | Disponivel |
| **Server Hardening** | `/hardening` | Em breve |
| **Client Config** | `/config` | Em breve |
| **Key Generator** | `/keygen` | Em breve |

### Tunnel Builder

Monte comandos de SSH Tunnel com diagramas visuais.

- Local Forward (`-L`) — traga uma porta remota pra sua maquina
- Remote Forward (`-R`) — exponha uma porta local pelo servidor
- Dynamic Forward (`-D`) — proxy SOCKS pelo servidor SSH
- Flags: `-N`, `-f`, `-C`, `ExitOnForwardFailure`, keepalive
- Saida: comando SSH, `autossh` persistente, bloco `~/.ssh/config`
- Diagrama visual do fluxo do tunel

### Server Hardening *(em breve)*

Gere um `sshd_config` endurecido com score de seguranca, presets
(Paranoico / Equilibrado / Permissivo) e script de aplicacao.

### Client Config *(em breve)*

Monte seu `~/.ssh/config` com hosts, ProxyJump chains, forwards e wildcards.
Importe um config existente e edite visualmente.

### Key Generator *(em breve)*

Gere pares de chaves Ed25519 e RSA direto no navegador via Web Crypto API.

---

## Privacidade

Tudo roda no seu navegador. Nenhum dado sai da sua maquina. Sem API, sem
cookies, sem analytics. Abra o DevTools e confira a aba Network.

---

## Stack

- [Astro](https://astro.build/) 6.x — static site generator
- TypeScript 5.x
- Web Crypto API (keygen)
- [fflate](https://github.com/101arrowz/fflate) (ZIP)
- [Vitest](https://vitest.dev/) (testes)
- GitHub Pages (deploy)

---

## Desenvolvimento

```bash
# Requisitos: Node.js >= 22.12.0

# Instalar dependencias
npm install

# Dev server
npm run dev

# Rodar testes
npm test

# Build
npm run build
```

---

## Autor

**Otavio Miranda** — [otaviomiranda.com.br](https://www.otaviomiranda.com.br)

- [YouTube](https://www.youtube.com/@otaboranern)
- [GitHub](https://github.com/luizomf)

---

## Licenca

[MIT](./LICENSE)
