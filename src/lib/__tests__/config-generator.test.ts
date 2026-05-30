import { describe, it, expect } from 'vitest';
import { generateHostBlock, generateFullConfig, createEmptyHost } from '../config-generator';
import type { SshHostEntry } from '../types';

function makeHost(overrides: Partial<SshHostEntry> = {}): SshHostEntry {
  return {
    id: '1',
    host: 'prod',
    hostName: '192.168.1.10',
    user: 'deploy',
    ...overrides,
  };
}

describe('generateHostBlock', () => {
  it('generates a minimal host block', () => {
    const entry = makeHost();
    expect(generateHostBlock(entry)).toBe(
      ['Host prod', '    HostName 192.168.1.10', '    User deploy'].join('\n'),
    );
  });

  it('includes port when not 22', () => {
    const entry = makeHost({ port: 2222 });
    const result = generateHostBlock(entry);
    expect(result).toContain('Port 2222');
  });

  it('omits port when 22', () => {
    const entry = makeHost({ port: 22 });
    const result = generateHostBlock(entry);
    expect(result).not.toContain('Port');
  });

  it('includes IdentityFile', () => {
    const entry = makeHost({ identityFile: '~/.ssh/id_ed25519' });
    const result = generateHostBlock(entry);
    expect(result).toContain('IdentityFile ~/.ssh/id_ed25519');
  });

  it('includes IdentitiesOnly yes/no when selected', () => {
    expect(generateHostBlock(makeHost({ identitiesOnly: 'yes' }))).toContain(
      'IdentitiesOnly yes',
    );
    expect(generateHostBlock(makeHost({ identitiesOnly: 'no' }))).toContain('IdentitiesOnly no');
  });

  it('includes AddKeysToAgent common and custom values', () => {
    expect(generateHostBlock(makeHost({ addKeysToAgent: 'confirm' }))).toContain(
      'AddKeysToAgent confirm',
    );
    expect(generateHostBlock(makeHost({ addKeysToAgent: '5m' }))).toContain(
      'AddKeysToAgent 5m',
    );
  });

  it('includes ProxyJump', () => {
    const entry = makeHost({ proxyJump: 'bastion' });
    const result = generateHostBlock(entry);
    expect(result).toContain('ProxyJump bastion');
  });

  it('includes ForwardAgent yes/no', () => {
    expect(generateHostBlock(makeHost({ forwardAgent: true }))).toContain('ForwardAgent yes');
    expect(generateHostBlock(makeHost({ forwardAgent: false }))).toContain('ForwardAgent no');
  });

  it('does not include ForwardAgent when undefined', () => {
    const result = generateHostBlock(makeHost());
    expect(result).not.toContain('ForwardAgent');
  });

  it('includes logging and compatibility options', () => {
    const entry = makeHost({
      logLevel: 'VERBOSE',
      ignoreUnknown: 'UseKeychain,AddKeysToAgent',
    });
    const result = generateHostBlock(entry);
    expect(result).toContain('LogLevel VERBOSE');
    expect(result).toContain('IgnoreUnknown UseKeychain,AddKeysToAgent');
  });

  it('includes repeated environment directives', () => {
    const entry = makeHost({
      sendEnv: ['LANG LC_*', 'TERM'],
      setEnv: ['TERM=xterm-256color', 'APP_ENV=prod'],
    });
    const result = generateHostBlock(entry);
    expect(result).toContain('SendEnv LANG LC_*');
    expect(result).toContain('SendEnv TERM');
    expect(result).toContain('SetEnv TERM=xterm-256color');
    expect(result).toContain('SetEnv APP_ENV=prod');
  });

  it('includes host key policy options', () => {
    const entry = makeHost({
      strictHostKeyChecking: 'accept-new',
      userKnownHostsFile: '~/.ssh/known_hosts',
    });
    const result = generateHostBlock(entry);
    expect(result).toContain('StrictHostKeyChecking accept-new');
    expect(result).toContain('UserKnownHostsFile ~/.ssh/known_hosts');
  });

  it('includes HostKeyAlias', () => {
    const result = generateHostBlock(makeHost({ hostKeyAlias: 'prod-db-private' }));
    expect(result).toContain('HostKeyAlias prod-db-private');
  });

  it('includes LocalForward entries', () => {
    const entry = makeHost({
      localForward: ['5432 localhost:5432', '8080 localhost:80'],
    });
    const result = generateHostBlock(entry);
    expect(result).toContain('LocalForward 5432 localhost:5432');
    expect(result).toContain('LocalForward 8080 localhost:80');
  });

  it('includes RemoteForward entries', () => {
    const entry = makeHost({
      remoteForward: ['0.0.0.0:8080 localhost:3000'],
    });
    const result = generateHostBlock(entry);
    expect(result).toContain('RemoteForward 0.0.0.0:8080 localhost:3000');
  });

  it('includes DynamicForward entries', () => {
    const entry = makeHost({ dynamicForward: ['1080'] });
    const result = generateHostBlock(entry);
    expect(result).toContain('DynamicForward 1080');
  });

  it('includes ExitOnForwardFailure', () => {
    const entry = makeHost({ exitOnForwardFailure: true });
    const result = generateHostBlock(entry);
    expect(result).toContain('ExitOnForwardFailure yes');
  });

  it('includes keepalive options', () => {
    const entry = makeHost({ serverAliveInterval: 60, serverAliveCountMax: 3 });
    const result = generateHostBlock(entry);
    expect(result).toContain('ServerAliveInterval 60');
    expect(result).toContain('ServerAliveCountMax 3');
  });

  it('includes RequestTTY when not auto', () => {
    expect(generateHostBlock(makeHost({ requestTTY: 'force' }))).toContain('RequestTTY force');
    expect(generateHostBlock(makeHost({ requestTTY: 'auto' }))).not.toContain('RequestTTY');
  });

  it('includes RemoteCommand', () => {
    const entry = makeHost({ remoteCommand: 'tmux attach' });
    const result = generateHostBlock(entry);
    expect(result).toContain('RemoteCommand tmux attach');
  });

  it('includes extra options', () => {
    const entry = makeHost({
      extraOptions: { CanonicalizeHostname: 'yes', ConnectTimeout: '10' },
    });
    const result = generateHostBlock(entry);
    expect(result).toContain('CanonicalizeHostname yes');
    expect(result).toContain('ConnectTimeout 10');
  });

  it('generates a full featured host', () => {
    const entry: SshHostEntry = {
      id: '1',
      host: 'prod-db',
      hostName: 'db.internal',
      user: 'deploy',
      port: 2222,
      identityFile: '~/.ssh/prod_key',
      proxyJump: 'bastion',
      forwardAgent: false,
      localForward: ['5432 localhost:5432'],
      exitOnForwardFailure: true,
      serverAliveInterval: 60,
      serverAliveCountMax: 3,
    };
    expect(generateHostBlock(entry)).toBe(
      [
        'Host prod-db',
        '    HostName db.internal',
        '    User deploy',
        '    Port 2222',
        '    IdentityFile ~/.ssh/prod_key',
        '    ProxyJump bastion',
        '    ForwardAgent no',
        '    LocalForward 5432 localhost:5432',
        '    ExitOnForwardFailure yes',
        '    ServerAliveInterval 60',
        '    ServerAliveCountMax 3',
      ].join('\n'),
    );
  });

  it('handles wildcard hosts', () => {
    const entry = makeHost({ host: '*.dev', hostName: undefined, user: 'dev' });
    const result = generateHostBlock(entry);
    expect(result).toMatch(/^Host \*\.dev/);
    expect(result).not.toContain('HostName');
  });

  it('omits empty string values', () => {
    const entry: SshHostEntry = {
      id: '1',
      host: 'test',
      hostName: '',
      user: '',
      identityFile: '',
      proxyJump: '',
    };
    const result = generateHostBlock(entry);
    expect(result).toBe('Host test');
  });
});

describe('generateFullConfig', () => {
  it('joins multiple hosts with blank line', () => {
    const entries = [
      makeHost({ host: 'prod', hostName: '10.0.0.1' }),
      makeHost({ host: 'staging', hostName: '10.0.0.2', user: 'stage' }),
    ];
    const result = generateFullConfig(entries);
    expect(result).toContain('Host prod');
    expect(result).toContain('Host staging');
    expect(result).toContain('\n\n');
  });

  it('returns empty string for no entries', () => {
    expect(generateFullConfig([])).toBe('');
  });
});

describe('createEmptyHost', () => {
  it('creates a host with unique id', () => {
    const a = createEmptyHost();
    const b = createEmptyHost();
    expect(a.id).not.toBe(b.id);
    expect(a.host).toBe('');
  });
});
