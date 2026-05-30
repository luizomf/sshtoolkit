import type { SshHostEntry } from './types';

const MAX_CHAIN_HOPS = 20;
const LOCAL_FILE_PLACEHOLDER = './local-file';
const REMOTE_PATH_PLACEHOLDER = '/remote/path/';

export type ProxyJumpCommandKind = 'ssh-alias' | 'ssh-direct' | 'scp' | 'rsync';

export interface ProxyJumpCommandPreview {
  kind: ProxyJumpCommandKind;
  command: string;
}

export function splitProxyJumpValue(proxyJump: string | undefined): string[] {
  const raw = proxyJump?.trim();
  if (!raw || raw.toLowerCase() === 'none') return [];

  return raw
    .split(',')
    .map((hop) => hop.trim())
    .filter((hop) => hop && hop.toLowerCase() !== 'none');
}

export function hasActiveProxyJump(entry: SshHostEntry): boolean {
  return splitProxyJumpValue(entry.proxyJump).length > 0;
}

export function isConcreteHostAlias(host: string | undefined): boolean {
  const value = host?.trim();
  return Boolean(value && !/[\s!*?\[\],]/.test(value));
}

export function resolveProxyJumpChain(entry: SshHostEntry, entries: SshHostEntry[]): string[] {
  const chain = ['Você'];
  const nodes: string[] = [];
  const resolving = new Set<string>();

  function pushHop(hop: string): void {
    if (nodes.length >= MAX_CHAIN_HOPS) return;
    nodes.push(hop);
  }

  function resolveValue(proxyJump: string | undefined): void {
    for (const hop of splitProxyJumpValue(proxyJump)) {
      resolveHop(hop);
    }
  }

  function resolveHop(hop: string): void {
    if (nodes.length >= MAX_CHAIN_HOPS) return;

    const key = hop.toLowerCase();
    if (resolving.has(key)) {
      pushHop(`${hop} (ciclo)`);
      return;
    }

    const jumpHost = entries.find((candidate) => candidate.host.trim() === hop);
    if (jumpHost && hasActiveProxyJump(jumpHost)) {
      resolving.add(key);
      resolveValue(jumpHost.proxyJump);
      resolving.delete(key);
    }

    pushHop(hop);
  }

  resolveValue(entry.proxyJump);
  chain.push(...nodes);
  chain.push(entry.host.trim() || 'destino');

  return chain;
}

export function generateProxyJumpCommandPreviews(entry: SshHostEntry): ProxyJumpCommandPreview[] {
  const proxyJump = entry.proxyJump?.trim();
  if (!proxyJump || !hasActiveProxyJump(entry) || !isConcreteHostAlias(entry.host)) return [];

  const target = formatTarget(entry);
  if (!target) return [];

  return [
    { kind: 'ssh-alias', command: `ssh ${entry.host.trim()}` },
    { kind: 'ssh-direct', command: buildSshDirectCommand(entry, proxyJump, target) },
    { kind: 'scp', command: buildScpCommand(entry, proxyJump, target) },
    { kind: 'rsync', command: buildRsyncCommand(entry, proxyJump, target) },
  ];
}

function buildSshDirectCommand(entry: SshHostEntry, proxyJump: string, target: string): string {
  const parts = ['ssh', `-J ${proxyJump}`];

  if (entry.port && entry.port !== 22) parts.push(`-p ${entry.port}`);
  if (entry.identityFile) parts.push(`-i ${entry.identityFile}`);

  parts.push(target);
  return parts.join(' ');
}

function buildScpCommand(entry: SshHostEntry, proxyJump: string, target: string): string {
  const parts = ['scp', `-o ProxyJump=${proxyJump}`];

  if (entry.port && entry.port !== 22) parts.push(`-P ${entry.port}`);
  if (entry.identityFile) parts.push(`-i ${entry.identityFile}`);

  parts.push(LOCAL_FILE_PLACEHOLDER, `${target}:${REMOTE_PATH_PLACEHOLDER}`);
  return parts.join(' ');
}

function buildRsyncCommand(entry: SshHostEntry, proxyJump: string, target: string): string {
  const sshParts = ['ssh', `-J ${proxyJump}`];

  if (entry.port && entry.port !== 22) sshParts.push(`-p ${entry.port}`);
  if (entry.identityFile) sshParts.push(`-i ${entry.identityFile}`);

  return [
    'rsync',
    '-av',
    `-e '${sshParts.join(' ')}'`,
    LOCAL_FILE_PLACEHOLDER,
    `${target}:${REMOTE_PATH_PLACEHOLDER}`,
  ].join(' ');
}

function formatTarget(entry: SshHostEntry): string {
  const host = (entry.hostName || entry.host).trim();
  const user = entry.user?.trim();

  if (!host) return '';
  return user ? `${user}@${host}` : host;
}
