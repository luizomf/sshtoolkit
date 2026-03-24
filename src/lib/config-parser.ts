import type { SshHostEntry } from './types';

const KNOWN_KEYS = new Set([
  'hostname', 'user', 'port', 'identityfile', 'proxyjump',
  'forwardagent', 'localforward', 'remoteforward', 'dynamicforward',
  'serveraliveinterval', 'serveralivecountmax', 'requesttty',
  'remotecommand', 'exitonforwardfailure',
]);

function parseBool(value: string): boolean {
  return value.toLowerCase() === 'yes';
}

export function parseConfig(raw: string): SshHostEntry[] {
  const entries: SshHostEntry[] = [];
  let current: SshHostEntry | null = null;
  let idCounter = 1;

  const lines = raw.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    // Match "Key value" or "Key=value"
    const match = line.match(/^(\S+)\s*[=\s]\s*(.+)$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2].trim();
    const keyLower = key.toLowerCase();

    if (keyLower === 'host') {
      current = {
        id: String(idCounter++),
        host: value,
      };
      entries.push(current);
      continue;
    }

    if (!current) continue;

    switch (keyLower) {
      case 'hostname':
        current.hostName = value;
        break;
      case 'user':
        current.user = value;
        break;
      case 'port':
        current.port = Number(value) || 22;
        break;
      case 'identityfile':
        current.identityFile = value;
        break;
      case 'proxyjump':
        current.proxyJump = value;
        break;
      case 'forwardagent':
        current.forwardAgent = parseBool(value);
        break;
      case 'localforward':
        current.localForward = current.localForward || [];
        current.localForward.push(value);
        break;
      case 'remoteforward':
        current.remoteForward = current.remoteForward || [];
        current.remoteForward.push(value);
        break;
      case 'dynamicforward':
        current.dynamicForward = current.dynamicForward || [];
        current.dynamicForward.push(value);
        break;
      case 'serveraliveinterval':
        current.serverAliveInterval = Number(value) || 0;
        break;
      case 'serveralivecountmax':
        current.serverAliveCountMax = Number(value) || 0;
        break;
      case 'requesttty':
        current.requestTTY = value as SshHostEntry['requestTTY'];
        break;
      case 'remotecommand':
        current.remoteCommand = value;
        break;
      case 'exitonforwardfailure':
        current.exitOnForwardFailure = parseBool(value);
        break;
      default:
        if (!KNOWN_KEYS.has(keyLower)) {
          current.extraOptions = current.extraOptions || {};
          current.extraOptions[key] = value;
        }
        break;
    }
  }

  return entries;
}
