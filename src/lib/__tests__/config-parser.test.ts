import { describe, it, expect } from 'vitest';
import { parseConfig } from '../config-parser';

describe('parseConfig', () => {
  it('parses a single basic host', () => {
    const input = `
Host prod
    HostName 192.168.1.10
    User deploy
    Port 2222
`;
    const result = parseConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].host).toBe('prod');
    expect(result[0].hostName).toBe('192.168.1.10');
    expect(result[0].user).toBe('deploy');
    expect(result[0].port).toBe(2222);
  });

  it('parses multiple hosts', () => {
    const input = `
Host prod
    HostName 10.0.0.1
    User deploy

Host staging
    HostName 10.0.0.2
    User stage
`;
    const result = parseConfig(input);
    expect(result).toHaveLength(2);
    expect(result[0].host).toBe('prod');
    expect(result[1].host).toBe('staging');
    expect(result[1].user).toBe('stage');
  });

  it('parses IdentityFile and ProxyJump', () => {
    const input = `
Host bastion
    HostName bastion.example.com
    User admin
    IdentityFile ~/.ssh/bastion_key
    ProxyJump gateway
`;
    const result = parseConfig(input);
    expect(result[0].identityFile).toBe('~/.ssh/bastion_key');
    expect(result[0].proxyJump).toBe('gateway');
  });

  it('parses IdentitiesOnly into a dedicated field', () => {
    const input = `
Host prod
    HostName app.internal
    IdentitiesOnly yes

Host staging
    HostName staging.example.com
    IdentitiesOnly no
`;
    const result = parseConfig(input);
    expect(result[0].identitiesOnly).toBe('yes');
    expect(result[1].identitiesOnly).toBe('no');
    expect(result[0].extraOptions).toBeUndefined();
  });

  it('parses AddKeysToAgent common and custom values', () => {
    const input = `
Host app
    HostName app.internal
    AddKeysToAgent confirm

Host app-short
    HostName app-short.internal
    AddKeysToAgent 5m
`;
    const result = parseConfig(input);
    expect(result[0].addKeysToAgent).toBe('confirm');
    expect(result[1].addKeysToAgent).toBe('5m');
    expect(result[0].extraOptions).toBeUndefined();
  });

  it('parses ForwardAgent', () => {
    const input = `
Host dev
    HostName dev.local
    ForwardAgent yes
`;
    const result = parseConfig(input);
    expect(result[0].forwardAgent).toBe(true);
  });

  it('parses LocalForward, RemoteForward, DynamicForward', () => {
    const input = `
Host tunnel
    HostName server
    LocalForward 5432 localhost:5432
    LocalForward 8080 localhost:80
    RemoteForward 0.0.0.0:9090 localhost:3000
    DynamicForward 1080
`;
    const result = parseConfig(input);
    expect(result[0].localForward).toEqual(['5432 localhost:5432', '8080 localhost:80']);
    expect(result[0].remoteForward).toEqual(['0.0.0.0:9090 localhost:3000']);
    expect(result[0].dynamicForward).toEqual(['1080']);
  });

  it('parses keepalive options', () => {
    const input = `
Host prod
    HostName server
    ServerAliveInterval 60
    ServerAliveCountMax 3
`;
    const result = parseConfig(input);
    expect(result[0].serverAliveInterval).toBe(60);
    expect(result[0].serverAliveCountMax).toBe(3);
  });

  it('parses RequestTTY and RemoteCommand', () => {
    const input = `
Host tmux-server
    HostName server
    RequestTTY force
    RemoteCommand tmux attach -t main
`;
    const result = parseConfig(input);
    expect(result[0].requestTTY).toBe('force');
    expect(result[0].remoteCommand).toBe('tmux attach -t main');
  });

  it('parses ExitOnForwardFailure', () => {
    const input = `
Host tunnel
    HostName server
    ExitOnForwardFailure yes
`;
    const result = parseConfig(input);
    expect(result[0].exitOnForwardFailure).toBe(true);
  });

  it('parses logging and compatibility options into dedicated fields', () => {
    const input = `
Host verbose
    HostName verbose.example.com
    LogLevel DEBUG1
    IgnoreUnknown UseKeychain,AddKeysToAgent
`;
    const result = parseConfig(input);
    expect(result[0].logLevel).toBe('DEBUG1');
    expect(result[0].ignoreUnknown).toBe('UseKeychain,AddKeysToAgent');
    expect(result[0].extraOptions).toBeUndefined();
  });

  it('parses repeated environment directives into arrays', () => {
    const input = `
Host env-app
    HostName app.internal
    SendEnv LANG LC_*
    SendEnv TERM
    SetEnv TERM=xterm-256color
    SetEnv APP_ENV=prod
`;
    const result = parseConfig(input);
    expect(result[0].sendEnv).toEqual(['LANG LC_*', 'TERM']);
    expect(result[0].setEnv).toEqual(['TERM=xterm-256color', 'APP_ENV=prod']);
    expect(result[0].extraOptions).toBeUndefined();
  });

  it('parses host key policy options into dedicated fields', () => {
    const input = `
Host private-db
    HostName 10.0.10.20
    StrictHostKeyChecking accept-new
    UserKnownHostsFile ~/.ssh/known_hosts
`;
    const result = parseConfig(input);
    expect(result[0].strictHostKeyChecking).toBe('accept-new');
    expect(result[0].userKnownHostsFile).toBe('~/.ssh/known_hosts');
    expect(result[0].extraOptions).toBeUndefined();
  });

  it('parses HostKeyAlias into a dedicated field', () => {
    const input = `
Host private-db
    HostName 10.0.10.20
    HostKeyAlias prod-db-private
`;
    const result = parseConfig(input);
    expect(result[0].hostKeyAlias).toBe('prod-db-private');
    expect(result[0].extraOptions).toBeUndefined();
  });

  it('stores unknown options in extraOptions', () => {
    const input = `
Host strict
    HostName server
    CanonicalizeHostname yes
    ConnectTimeout 10
`;
    const result = parseConfig(input);
    expect(result[0].extraOptions).toEqual({
      CanonicalizeHostname: 'yes',
      ConnectTimeout: '10',
    });
  });

  it('ignores comments and blank lines', () => {
    const input = `
# This is a comment
Host prod
    # Another comment
    HostName server

    User deploy
`;
    const result = parseConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('deploy');
  });

  it('handles equal sign syntax', () => {
    const input = `
Host prod
    HostName=server.example.com
    User=deploy
    Port=2222
`;
    const result = parseConfig(input);
    expect(result[0].hostName).toBe('server.example.com');
    expect(result[0].user).toBe('deploy');
    expect(result[0].port).toBe(2222);
  });

  it('ignores lines before first Host', () => {
    const input = `
User globaluser
HostName globalhost

Host actual
    HostName real-server
`;
    const result = parseConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].host).toBe('actual');
    expect(result[0].hostName).toBe('real-server');
  });

  it('returns empty array for empty input', () => {
    expect(parseConfig('')).toEqual([]);
    expect(parseConfig('   \n\n   ')).toEqual([]);
  });

  it('handles wildcard hosts', () => {
    const input = `
Host *.prod
    User deploy
    IdentityFile ~/.ssh/prod_key
`;
    const result = parseConfig(input);
    expect(result[0].host).toBe('*.prod');
    expect(result[0].user).toBe('deploy');
  });

  it('roundtrips with config-generator', async () => {
    const { generateFullConfig } = await import('../config-generator');
    const input = `
Host prod-db
    HostName db.internal
    User deploy
    Port 2222
    IdentityFile ~/.ssh/prod_key
    ProxyJump bastion
    ForwardAgent no
    LocalForward 5432 localhost:5432
    ExitOnForwardFailure yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host staging
    HostName staging.example.com
    User stage
`;
    const parsed = parseConfig(input);
    const regenerated = generateFullConfig(parsed);
    const reparsed = parseConfig(regenerated);

    expect(reparsed).toHaveLength(2);
    expect(reparsed[0].host).toBe('prod-db');
    expect(reparsed[0].hostName).toBe('db.internal');
    expect(reparsed[0].port).toBe(2222);
    expect(reparsed[0].proxyJump).toBe('bastion');
    expect(reparsed[0].localForward).toEqual(['5432 localhost:5432']);
    expect(reparsed[1].host).toBe('staging');
    expect(reparsed[1].user).toBe('stage');
  });
});
