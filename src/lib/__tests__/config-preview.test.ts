import { describe, it, expect } from 'vitest';
import {
  generateProxyJumpCommandPreviews,
  hasActiveProxyJump,
  isConcreteHostAlias,
  resolveProxyJumpChain,
  splitProxyJumpValue,
} from '../config-preview';
import type { SshHostEntry } from '../types';

function makeHost(overrides: Partial<SshHostEntry> = {}): SshHostEntry {
  return {
    id: '1',
    host: 'app',
    hostName: '10.0.10.20',
    user: 'deploy',
    proxyJump: 'bastion',
    ...overrides,
  };
}

describe('splitProxyJumpValue', () => {
  it('splits comma-separated jump hosts into clean hops', () => {
    expect(splitProxyJumpValue(' bastion-edge, bastion-inner,, gateway ')).toEqual([
      'bastion-edge',
      'bastion-inner',
      'gateway',
    ]);
  });

  it('treats ProxyJump none as no active jump', () => {
    expect(splitProxyJumpValue('none')).toEqual([]);
    expect(hasActiveProxyJump(makeHost({ proxyJump: 'none' }))).toBe(false);
  });
});

describe('resolveProxyJumpChain', () => {
  it('renders comma-separated ProxyJump values as ordered hops', () => {
    const entry = makeHost({ proxyJump: 'bastion-edge,bastion-inner' });
    expect(resolveProxyJumpChain(entry, [entry])).toEqual([
      'Você',
      'bastion-edge',
      'bastion-inner',
      'app',
    ]);
  });

  it('includes nested jump-host routes before the referenced jump host', () => {
    const edge = makeHost({
      id: 'edge',
      host: 'bastion-edge',
      hostName: 'bastion.example.com',
      proxyJump: undefined,
    });
    const inner = makeHost({
      id: 'inner',
      host: 'bastion-inner',
      hostName: '10.0.0.5',
      proxyJump: 'bastion-edge',
    });
    const app = makeHost({ id: 'app', host: 'app', proxyJump: 'bastion-inner' });

    expect(resolveProxyJumpChain(app, [edge, inner, app])).toEqual([
      'Você',
      'bastion-edge',
      'bastion-inner',
      'app',
    ]);
  });

  it('guards circular jump-host references', () => {
    const edge = makeHost({ id: 'edge', host: 'edge', proxyJump: 'inner' });
    const inner = makeHost({ id: 'inner', host: 'inner', proxyJump: 'edge' });
    const app = makeHost({ id: 'app', host: 'app', proxyJump: 'edge' });

    const chain = resolveProxyJumpChain(app, [edge, inner, app]);

    expect(chain).toContain('edge (ciclo)');
    expect(chain.at(-1)).toBe('app');
    expect(chain.length).toBeLessThanOrEqual(6);
  });
});

describe('isConcreteHostAlias', () => {
  it('rejects wildcard, negated, comma-separated, and multi-alias patterns', () => {
    expect(isConcreteHostAlias('app')).toBe(true);
    expect(isConcreteHostAlias('*.prod')).toBe(false);
    expect(isConcreteHostAlias('!banned')).toBe(false);
    expect(isConcreteHostAlias('app db')).toBe(false);
    expect(isConcreteHostAlias('app,db')).toBe(false);
  });
});

describe('generateProxyJumpCommandPreviews', () => {
  it('builds SSH, SCP, and rsync previews for concrete ProxyJump hosts', () => {
    const entry = makeHost({
      port: 2222,
      identityFile: '~/.ssh/id_ed25519',
      proxyJump: 'bastion-edge,bastion-inner',
    });

    expect(generateProxyJumpCommandPreviews(entry)).toEqual([
      { kind: 'ssh-alias', command: 'ssh app' },
      {
        kind: 'ssh-direct',
        command:
          'ssh -J bastion-edge,bastion-inner -p 2222 -i ~/.ssh/id_ed25519 deploy@10.0.10.20',
      },
      {
        kind: 'scp',
        command:
          'scp -o ProxyJump=bastion-edge,bastion-inner -P 2222 -i ~/.ssh/id_ed25519 ./local-file deploy@10.0.10.20:/remote/path/',
      },
      {
        kind: 'rsync',
        command:
          "rsync -av -e 'ssh -J bastion-edge,bastion-inner -p 2222 -i ~/.ssh/id_ed25519' ./local-file deploy@10.0.10.20:/remote/path/",
      },
    ]);
  });

  it('falls back to the host alias when HostName is not set', () => {
    const entry = makeHost({ hostName: '', user: '', identityFile: '', port: 22 });
    const previews = generateProxyJumpCommandPreviews(entry);

    expect(previews[1].command).toBe('ssh -J bastion app');
    expect(previews[2].command).toBe(
      'scp -o ProxyJump=bastion ./local-file app:/remote/path/',
    );
    expect(previews[3].command).toBe(
      "rsync -av -e 'ssh -J bastion' ./local-file app:/remote/path/",
    );
  });

  it('does not build misleading previews for ProxyJump none or wildcard hosts', () => {
    expect(generateProxyJumpCommandPreviews(makeHost({ proxyJump: 'none' }))).toEqual([]);
    expect(generateProxyJumpCommandPreviews(makeHost({ host: '*.prod' }))).toEqual([]);
  });
});
