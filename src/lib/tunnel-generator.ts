import type {
  TunnelConfig,
  TunnelSpec,
  TunnelOptions,
  LocalTunnel,
  RemoteTunnel,
  DynamicTunnel,
} from './types';

function formatDestination(opts: TunnelOptions): string {
  const parts: string[] = [];
  if (opts.sshUser) parts.push(opts.sshUser + '@');
  parts.push(opts.sshServer);
  return parts.join('');
}

function formatLocalTunnel(t: LocalTunnel): string {
  const bind = t.bindAddress ? `${t.bindAddress}:` : '';
  return `-L ${bind}${t.localPort}:${t.remoteHost}:${t.remotePort}`;
}

function formatRemoteTunnel(t: RemoteTunnel): string {
  const bind = t.bindAddress ? `${t.bindAddress}:` : '';
  return `-R ${bind}${t.remotePort}:${t.localHost}:${t.localPort}`;
}

function formatDynamicTunnel(t: DynamicTunnel): string {
  const bind = t.bindAddress ? `${t.bindAddress}:` : '';
  return `-D ${bind}${t.localPort}`;
}

function formatTunnel(t: TunnelSpec): string {
  switch (t.type) {
    case 'local':
      return formatLocalTunnel(t);
    case 'remote':
      return formatRemoteTunnel(t);
    case 'dynamic':
      return formatDynamicTunnel(t);
  }
}

function buildFlags(opts: TunnelOptions): string[] {
  const flags: string[] = [];
  if (opts.background) flags.push('-f');
  if (opts.noShell) flags.push('-N');
  if (opts.compression) flags.push('-C');
  return flags;
}

function buildSshOptions(opts: TunnelOptions): string[] {
  const parts: string[] = [];
  if (opts.exitOnForwardFailure) {
    parts.push('-o ExitOnForwardFailure=yes');
  }
  if (opts.serverAliveInterval !== undefined && opts.serverAliveInterval > 0) {
    parts.push(`-o ServerAliveInterval=${opts.serverAliveInterval}`);
  }
  if (opts.serverAliveCountMax !== undefined && opts.serverAliveCountMax > 0) {
    parts.push(`-o ServerAliveCountMax=${opts.serverAliveCountMax}`);
  }
  return parts;
}

export function generateSshCommand(config: TunnelConfig): string {
  const { tunnels, options } = config;
  const parts: string[] = ['ssh'];

  const flags = buildFlags(options);
  if (flags.length > 0) parts.push(flags.join(' '));

  const sshOpts = buildSshOptions(options);
  if (sshOpts.length > 0) parts.push(...sshOpts);

  if (options.sshPort && options.sshPort !== 22) {
    parts.push(`-p ${options.sshPort}`);
  }

  if (options.identityFile) {
    parts.push(`-i ${options.identityFile}`);
  }

  if (options.jumpHost) {
    parts.push(`-J ${options.jumpHost}`);
  }

  for (const tunnel of tunnels) {
    parts.push(formatTunnel(tunnel));
  }

  parts.push(formatDestination(options));

  return parts.join(' ');
}

export function generateAutosshCommand(config: TunnelConfig): string {
  const sshCmd = generateSshCommand(config);
  // Replace 'ssh' with 'autossh -M 0' and ensure ServerAliveInterval is present
  let cmd = sshCmd.replace(/^ssh/, 'autossh -M 0');

  if (!cmd.includes('ServerAliveInterval')) {
    const interval = config.options.serverAliveInterval || 60;
    const count = config.options.serverAliveCountMax || 3;
    const dest = formatDestination(config.options);
    cmd = cmd.replace(
      ` ${dest}`,
      ` -o ServerAliveInterval=${interval} -o ServerAliveCountMax=${count} ${dest}`,
    );
  }

  return cmd;
}

function tunnelToConfigLines(t: TunnelSpec): string[] {
  switch (t.type) {
    case 'local': {
      const bind = t.bindAddress ? `${t.bindAddress}:` : '';
      return [`    LocalForward ${bind}${t.localPort} ${t.remoteHost}:${t.remotePort}`];
    }
    case 'remote': {
      const bind = t.bindAddress ? `${t.bindAddress}:` : '';
      return [`    RemoteForward ${bind}${t.remotePort} ${t.localHost}:${t.localPort}`];
    }
    case 'dynamic':
      return [`    DynamicForward ${t.bindAddress ? t.bindAddress + ':' : ''}${t.localPort}`];
  }
}

export function generateSshConfig(config: TunnelConfig, hostAlias?: string): string {
  const { tunnels, options } = config;
  const alias = hostAlias || 'my-tunnel';
  const lines: string[] = [`Host ${alias}`];

  lines.push(`    HostName ${options.sshServer}`);

  if (options.sshUser) {
    lines.push(`    User ${options.sshUser}`);
  }

  if (options.sshPort && options.sshPort !== 22) {
    lines.push(`    Port ${options.sshPort}`);
  }

  if (options.identityFile) {
    lines.push(`    IdentityFile ${options.identityFile}`);
  }

  if (options.jumpHost) {
    lines.push(`    ProxyJump ${options.jumpHost}`);
  }

  for (const tunnel of tunnels) {
    lines.push(...tunnelToConfigLines(tunnel));
  }

  if (options.exitOnForwardFailure) {
    lines.push('    ExitOnForwardFailure yes');
  }

  if (options.serverAliveInterval !== undefined && options.serverAliveInterval > 0) {
    lines.push(`    ServerAliveInterval ${options.serverAliveInterval}`);
  }

  if (options.serverAliveCountMax !== undefined && options.serverAliveCountMax > 0) {
    lines.push(`    ServerAliveCountMax ${options.serverAliveCountMax}`);
  }

  return lines.join('\n');
}

export interface TunnelDiagram {
  left: string;
  middle: string;
  right: string;
  description: string;
}

export function generateDiagram(tunnel: TunnelSpec, options: TunnelOptions): TunnelDiagram {
  const server = options.sshUser
    ? `${options.sshUser}@${options.sshServer}`
    : options.sshServer;

  switch (tunnel.type) {
    case 'local':
      return {
        left: `localhost:${tunnel.localPort}`,
        middle: server,
        right: `${tunnel.remoteHost}:${tunnel.remotePort}`,
        description: `Traffic on your port ${tunnel.localPort} goes through ${server} to reach ${tunnel.remoteHost}:${tunnel.remotePort}`,
      };
    case 'remote':
      return {
        left: `${tunnel.localHost}:${tunnel.localPort}`,
        middle: server,
        right: `${tunnel.bindAddress || 'localhost'}:${tunnel.remotePort} (on server)`,
        description: `Port ${tunnel.remotePort} on ${options.sshServer} forwards back to your ${tunnel.localHost}:${tunnel.localPort}`,
      };
    case 'dynamic':
      return {
        left: `localhost:${tunnel.localPort} (SOCKS)`,
        middle: server,
        right: 'any destination',
        description: `SOCKS proxy on port ${tunnel.localPort} — all traffic routed through ${server}`,
      };
  }
}
