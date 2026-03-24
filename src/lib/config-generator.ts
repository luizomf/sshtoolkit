import type { SshHostEntry } from './types';

function addLine(lines: string[], key: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === '') return;
  if (typeof value === 'boolean') {
    lines.push(`    ${key} ${value ? 'yes' : 'no'}`);
  } else {
    lines.push(`    ${key} ${value}`);
  }
}

export function generateHostBlock(entry: SshHostEntry): string {
  const lines: string[] = [`Host ${entry.host}`];

  addLine(lines, 'HostName', entry.hostName);
  addLine(lines, 'User', entry.user);
  if (entry.port && entry.port !== 22) {
    addLine(lines, 'Port', entry.port);
  }
  addLine(lines, 'IdentityFile', entry.identityFile);
  addLine(lines, 'ProxyJump', entry.proxyJump);

  if (entry.forwardAgent !== undefined) {
    addLine(lines, 'ForwardAgent', entry.forwardAgent);
  }

  if (entry.localForward) {
    for (const fwd of entry.localForward) {
      lines.push(`    LocalForward ${fwd}`);
    }
  }

  if (entry.remoteForward) {
    for (const fwd of entry.remoteForward) {
      lines.push(`    RemoteForward ${fwd}`);
    }
  }

  if (entry.dynamicForward) {
    for (const fwd of entry.dynamicForward) {
      lines.push(`    DynamicForward ${fwd}`);
    }
  }

  if (entry.exitOnForwardFailure !== undefined) {
    addLine(lines, 'ExitOnForwardFailure', entry.exitOnForwardFailure);
  }

  if (entry.serverAliveInterval && entry.serverAliveInterval > 0) {
    addLine(lines, 'ServerAliveInterval', entry.serverAliveInterval);
  }

  if (entry.serverAliveCountMax && entry.serverAliveCountMax > 0) {
    addLine(lines, 'ServerAliveCountMax', entry.serverAliveCountMax);
  }

  if (entry.requestTTY && entry.requestTTY !== 'auto') {
    addLine(lines, 'RequestTTY', entry.requestTTY);
  }

  addLine(lines, 'RemoteCommand', entry.remoteCommand);

  if (entry.extraOptions) {
    for (const [key, value] of Object.entries(entry.extraOptions)) {
      addLine(lines, key, value);
    }
  }

  return lines.join('\n');
}

export function generateFullConfig(entries: SshHostEntry[]): string {
  return entries.map(generateHostBlock).join('\n\n');
}

let nextId = 1;

export function createEmptyHost(): SshHostEntry {
  const id = String(nextId++);
  return {
    id,
    host: '',
    hostName: '',
    user: '',
    port: 22,
    identityFile: '',
    proxyJump: '',
  };
}
