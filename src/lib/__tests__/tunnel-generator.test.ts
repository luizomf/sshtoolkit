import { describe, it, expect } from 'vitest';
import {
  generateSshCommand,
  generateAutosshCommand,
  generateSshConfig,
  generateDiagram,
} from '../tunnel-generator';
import type { TunnelConfig, TunnelOptions, TunnelSpec } from '../types';

function makeOptions(overrides: Partial<TunnelOptions> = {}): TunnelOptions {
  return {
    sshServer: 'server',
    noShell: false,
    background: false,
    compression: false,
    exitOnForwardFailure: false,
    ...overrides,
  };
}

function makeConfig(
  tunnels: TunnelSpec[],
  optionOverrides: Partial<TunnelOptions> = {},
): TunnelConfig {
  return { tunnels, options: makeOptions(optionOverrides) };
}

describe('generateSshCommand', () => {
  describe('local forward (-L)', () => {
    it('generates a basic local forward', () => {
      const config = makeConfig([
        { type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -L 8080:localhost:8080 server',
      );
    });

    it('generates local forward with bind address', () => {
      const config = makeConfig([
        {
          type: 'local',
          localPort: 8080,
          remoteHost: 'localhost',
          remotePort: 8080,
          bindAddress: '0.0.0.0',
        },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -L 0.0.0.0:8080:localhost:8080 server',
      );
    });

    it('generates local forward with different ports', () => {
      const config = makeConfig([
        { type: 'local', localPort: 15432, remoteHost: 'localhost', remotePort: 5432 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -L 15432:localhost:5432 server',
      );
    });

    it('generates local forward to a remote host (not localhost)', () => {
      const config = makeConfig([
        { type: 'local', localPort: 3306, remoteHost: 'db.internal', remotePort: 3306 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -L 3306:db.internal:3306 server',
      );
    });
  });

  describe('remote forward (-R)', () => {
    it('generates a basic remote forward', () => {
      const config = makeConfig([
        { type: 'remote', remotePort: 8080, localHost: 'localhost', localPort: 8080 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -R 8080:localhost:8080 server',
      );
    });

    it('generates remote forward with bind address for public access', () => {
      const config = makeConfig([
        {
          type: 'remote',
          remotePort: 8080,
          localHost: 'localhost',
          localPort: 3000,
          bindAddress: '0.0.0.0',
        },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -R 0.0.0.0:8080:localhost:3000 server',
      );
    });

    it('generates remote forward with different local/remote ports', () => {
      const config = makeConfig([
        { type: 'remote', remotePort: 9090, localHost: 'localhost', localPort: 3000 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -R 9090:localhost:3000 server',
      );
    });
  });

  describe('dynamic forward (-D)', () => {
    it('generates a basic SOCKS proxy', () => {
      const config = makeConfig([{ type: 'dynamic', localPort: 1080 }]);
      expect(generateSshCommand(config)).toBe('ssh -D 1080 server');
    });

    it('generates SOCKS proxy with bind address', () => {
      const config = makeConfig([
        { type: 'dynamic', localPort: 1080, bindAddress: '127.0.0.1' },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -D 127.0.0.1:1080 server',
      );
    });
  });

  describe('flags and options', () => {
    it('adds -N flag for no shell', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { noShell: true },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -N -L 8080:localhost:8080 server',
      );
    });

    it('adds -f -N for background tunnel', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { background: true, noShell: true },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -f -N -L 8080:localhost:8080 server',
      );
    });

    it('adds -C for compression', () => {
      const config = makeConfig(
        [{ type: 'dynamic', localPort: 1080 }],
        { compression: true },
      );
      expect(generateSshCommand(config)).toBe('ssh -C -D 1080 server');
    });

    it('adds ExitOnForwardFailure', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { exitOnForwardFailure: true },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -o ExitOnForwardFailure=yes -L 8080:localhost:8080 server',
      );
    });

    it('adds keepalive options', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { serverAliveInterval: 60, serverAliveCountMax: 3 },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -L 8080:localhost:8080 server',
      );
    });

    it('adds custom SSH port', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { sshPort: 2222 },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -p 2222 -L 8080:localhost:8080 server',
      );
    });

    it('does not add -p for default port 22', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { sshPort: 22 },
      );
      expect(generateSshCommand(config)).not.toContain('-p');
    });

    it('adds identity file', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { identityFile: '~/.ssh/id_ed25519' },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -i ~/.ssh/id_ed25519 -L 8080:localhost:8080 server',
      );
    });

    it('adds jump host', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 3306, remoteHost: 'db.internal', remotePort: 3306 }],
        { jumpHost: 'bastion' },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -J bastion -L 3306:db.internal:3306 server',
      );
    });

    it('adds user to destination', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 8080 }],
        { sshUser: 'deploy' },
      );
      expect(generateSshCommand(config)).toBe(
        'ssh -L 8080:localhost:8080 deploy@server',
      );
    });

    it('combines all flags and options', () => {
      const config = makeConfig(
        [{ type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 }],
        {
          sshUser: 'deploy',
          sshPort: 2222,
          background: true,
          noShell: true,
          compression: true,
          exitOnForwardFailure: true,
          serverAliveInterval: 60,
          serverAliveCountMax: 3,
          jumpHost: 'bastion',
          identityFile: '~/.ssh/prod_key',
        },
      );
      const cmd = generateSshCommand(config);
      expect(cmd).toBe(
        'ssh -f -N -C -o ExitOnForwardFailure=yes -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -p 2222 -i ~/.ssh/prod_key -J bastion -L 5432:localhost:5432 deploy@server',
      );
    });
  });

  describe('multiple tunnels', () => {
    it('stacks multiple local forwards', () => {
      const config = makeConfig([
        { type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 },
        { type: 'local', localPort: 8080, remoteHost: 'localhost', remotePort: 80 },
        { type: 'local', localPort: 3000, remoteHost: 'localhost', remotePort: 3000 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -L 5432:localhost:5432 -L 8080:localhost:80 -L 3000:localhost:3000 server',
      );
    });

    it('mixes tunnel types', () => {
      const config = makeConfig([
        { type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 },
        { type: 'remote', remotePort: 8080, localHost: 'localhost', localPort: 3000 },
        { type: 'dynamic', localPort: 1080 },
      ]);
      expect(generateSshCommand(config)).toBe(
        'ssh -L 5432:localhost:5432 -R 8080:localhost:3000 -D 1080 server',
      );
    });
  });
});

describe('generateAutosshCommand', () => {
  it('replaces ssh with autossh -M 0', () => {
    const config = makeConfig(
      [{ type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 }],
      { noShell: true, background: true },
    );
    const cmd = generateAutosshCommand(config);
    expect(cmd).toMatch(/^autossh -M 0/);
    expect(cmd).not.toMatch(/^ssh/);
  });

  it('adds ServerAliveInterval if not present', () => {
    const config = makeConfig(
      [{ type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 }],
      { noShell: true, background: true },
    );
    const cmd = generateAutosshCommand(config);
    expect(cmd).toContain('ServerAliveInterval=60');
    expect(cmd).toContain('ServerAliveCountMax=3');
  });

  it('keeps existing ServerAliveInterval', () => {
    const config = makeConfig(
      [{ type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 }],
      { noShell: true, background: true, serverAliveInterval: 30, serverAliveCountMax: 2 },
    );
    const cmd = generateAutosshCommand(config);
    expect(cmd).toContain('ServerAliveInterval=30');
    expect(cmd).toContain('ServerAliveCountMax=2');
    // Should not duplicate
    const matches = cmd.match(/ServerAliveInterval/g);
    expect(matches).toHaveLength(1);
  });
});

describe('generateSshConfig', () => {
  it('generates a basic config block', () => {
    const config = makeConfig(
      [{ type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 }],
      { sshUser: 'deploy' },
    );
    const result = generateSshConfig(config, 'db-tunnel');
    expect(result).toBe(
      [
        'Host db-tunnel',
        '    HostName server',
        '    User deploy',
        '    LocalForward 5432 localhost:5432',
      ].join('\n'),
    );
  });

  it('uses default alias when none provided', () => {
    const config = makeConfig([{ type: 'dynamic', localPort: 1080 }]);
    const result = generateSshConfig(config);
    expect(result).toMatch(/^Host my-tunnel/);
  });

  it('includes all options', () => {
    const config = makeConfig(
      [
        { type: 'local', localPort: 5432, remoteHost: 'localhost', remotePort: 5432 },
        { type: 'remote', remotePort: 8080, localHost: 'localhost', localPort: 3000 },
      ],
      {
        sshUser: 'deploy',
        sshPort: 2222,
        jumpHost: 'bastion',
        identityFile: '~/.ssh/prod_key',
        exitOnForwardFailure: true,
        serverAliveInterval: 60,
        serverAliveCountMax: 3,
      },
    );
    const result = generateSshConfig(config, 'prod');
    expect(result).toBe(
      [
        'Host prod',
        '    HostName server',
        '    User deploy',
        '    Port 2222',
        '    IdentityFile ~/.ssh/prod_key',
        '    ProxyJump bastion',
        '    LocalForward 5432 localhost:5432',
        '    RemoteForward 8080 localhost:3000',
        '    ExitOnForwardFailure yes',
        '    ServerAliveInterval 60',
        '    ServerAliveCountMax 3',
      ].join('\n'),
    );
  });

  it('generates DynamicForward in config', () => {
    const config = makeConfig([{ type: 'dynamic', localPort: 1080 }]);
    const result = generateSshConfig(config, 'proxy');
    expect(result).toContain('DynamicForward 1080');
  });

  it('includes bind address in forwards', () => {
    const config = makeConfig([
      {
        type: 'remote',
        remotePort: 8080,
        localHost: 'localhost',
        localPort: 3000,
        bindAddress: '0.0.0.0',
      },
    ]);
    const result = generateSshConfig(config, 'public');
    expect(result).toContain('RemoteForward 0.0.0.0:8080 localhost:3000');
  });
});

describe('generateDiagram', () => {
  it('generates local tunnel diagram in PT-BR', () => {
    const tunnel: TunnelSpec = {
      type: 'local',
      localPort: 8080,
      remoteHost: 'db.internal',
      remotePort: 3306,
    };
    const diagram = generateDiagram(tunnel, makeOptions({ sshUser: 'user', sshServer: 'bastion' }));
    expect(diagram.left).toBe('sua máquina :8080');
    expect(diagram.middle).toBe('user@bastion');
    expect(diagram.right).toBe('db.internal:3306');
    expect(diagram.description).toContain('8080');
    expect(diagram.description).toContain('db.internal:3306');
  });

  it('generates remote tunnel diagram in PT-BR', () => {
    const tunnel: TunnelSpec = {
      type: 'remote',
      remotePort: 8080,
      localHost: 'localhost',
      localPort: 3000,
      bindAddress: '0.0.0.0',
    };
    const diagram = generateDiagram(tunnel, makeOptions({ sshServer: 'vps' }));
    expect(diagram.left).toBe('localhost:3000');
    expect(diagram.right).toContain('8080');
    expect(diagram.right).toContain('no servidor');
    expect(diagram.description).toContain('3000');
  });

  it('generates dynamic tunnel diagram in PT-BR', () => {
    const tunnel: TunnelSpec = {
      type: 'dynamic',
      localPort: 1080,
    };
    const diagram = generateDiagram(tunnel, makeOptions({ sshServer: 'vps' }));
    expect(diagram.left).toContain('1080');
    expect(diagram.left).toContain('SOCKS');
    expect(diagram.right).toBe('qualquer destino');
  });
});
