import { describe, it, expect } from 'vitest';
import { generateSshdConfig, generateApplyScript } from '../sshd-generator';
import { getPreset, calculateSecurityScore } from '../sshd-options';
import type { SshdConfig } from '../types';

function getParanoid(): SshdConfig {
  return getPreset('paranoid');
}

describe('generateSshdConfig', () => {
  it('generates header comments', () => {
    const result = generateSshdConfig(getParanoid());
    expect(result).toContain('gerado por SSH Toolkit');
    expect(result).toContain('sshtoolkit.otaviomiranda.com.br');
  });

  it('generates paranoid defaults correctly', () => {
    const result = generateSshdConfig(getParanoid());
    expect(result).toContain('Port 22');
    expect(result).toContain('PermitRootLogin no');
    expect(result).toContain('PubkeyAuthentication yes');
    expect(result).toContain('PasswordAuthentication no');
    expect(result).toContain('KbdInteractiveAuthentication no');
    expect(result).toContain('ChallengeResponseAuthentication no');
    expect(result).toContain('PermitEmptyPasswords no');
    expect(result).toContain('AuthenticationMethods publickey');
    expect(result).toContain('MaxAuthTries 3');
    expect(result).toContain('LoginGraceTime 30');
    expect(result).toContain('X11Forwarding no');
    expect(result).toContain('AllowAgentForwarding no');
    expect(result).toContain('AllowTcpForwarding no');
    expect(result).toContain('AllowStreamLocalForwarding no');
    expect(result).toContain('GatewayPorts no');
    expect(result).toContain('PermitTunnel no');
    expect(result).toContain('PermitUserEnvironment no');
    expect(result).toContain('PermitUserRC no');
    expect(result).toContain('StrictModes yes');
    expect(result).toContain('ClientAliveInterval 300');
    expect(result).toContain('ClientAliveCountMax 2');
    expect(result).toContain('UseDNS no');
    expect(result).toContain('UsePAM yes');
    expect(result).toContain('LogLevel VERBOSE');
    expect(result).toContain('PrintMotd no');
    expect(result).toContain('PrintLastLog yes');
    expect(result).toContain('MaxSessions 5');
    expect(result).toContain('MaxStartups 10:30:60');
  });

  it('generates balanced preset', () => {
    const result = generateSshdConfig(getPreset('balanced'));
    expect(result).toContain('AllowTcpForwarding yes');
    expect(result).toContain('MaxAuthTries 4');
    expect(result).toContain('MaxSessions 10');
  });

  it('generates permissive preset', () => {
    const result = generateSshdConfig(getPreset('permissive'));
    expect(result).toContain('PermitRootLogin prohibit-password');
    expect(result).toContain('X11Forwarding yes');
    expect(result).toContain('AllowAgentForwarding yes');
    expect(result).toContain('GatewayPorts clientspecified');
    expect(result).toContain('PermitTunnel yes');
    expect(result).toContain('PrintMotd yes');
  });

  it('includes custom port', () => {
    const config = { ...getParanoid(), port: 2222 };
    const result = generateSshdConfig(config);
    expect(result).toContain('Port 2222');
  });

  it('includes listen addresses', () => {
    const config = { ...getParanoid(), listenAddress: '0.0.0.0 ::' };
    const result = generateSshdConfig(config);
    expect(result).toContain('ListenAddress 0.0.0.0');
    expect(result).toContain('ListenAddress ::');
  });

  it('omits listen address when empty', () => {
    const result = generateSshdConfig(getParanoid());
    expect(result).not.toContain('ListenAddress');
  });

  it('includes address family when not any', () => {
    const config = { ...getParanoid(), addressFamily: 'inet' as const };
    const result = generateSshdConfig(config);
    expect(result).toContain('AddressFamily inet');
  });

  it('omits address family when any', () => {
    const result = generateSshdConfig(getParanoid());
    expect(result).not.toContain('AddressFamily');
  });

  it('includes access control directives', () => {
    const config = {
      ...getParanoid(),
      allowUsers: 'deploy admin',
      allowGroups: 'ssh-users',
      denyUsers: 'root',
      denyGroups: 'nogroup',
    };
    const result = generateSshdConfig(config);
    expect(result).toContain('AllowUsers deploy admin');
    expect(result).toContain('AllowGroups ssh-users');
    expect(result).toContain('DenyUsers root');
    expect(result).toContain('DenyGroups nogroup');
    expect(result).toContain('Controle de Acesso');
  });

  it('omits access control section when empty', () => {
    const result = generateSshdConfig(getParanoid());
    expect(result).not.toContain('AllowUsers');
    expect(result).not.toContain('Controle de Acesso');
  });

  it('includes banner when set', () => {
    const config = { ...getParanoid(), banner: '/etc/ssh/banner.txt' };
    const result = generateSshdConfig(config);
    expect(result).toContain('Banner /etc/ssh/banner.txt');
  });

  it('omits Banner directive when empty', () => {
    const result = generateSshdConfig(getParanoid());
    expect(result).not.toMatch(/^Banner /m);
  });
});

describe('calculateSecurityScore', () => {
  it('gives A grade to paranoid preset', () => {
    const { score, grade, warnings } = calculateSecurityScore(getParanoid());
    expect(grade).toBe('A');
    expect(score).toBeGreaterThanOrEqual(90);
    // Only info-level warnings for paranoid
    const dangerWarnings = warnings.filter((w) => w.severity === 'danger');
    expect(dangerWarnings).toHaveLength(0);
  });

  it('penalizes root login yes', () => {
    const config = { ...getParanoid(), permitRootLogin: 'yes' as const };
    const { score, warnings } = calculateSecurityScore(config);
    expect(score).toBeLessThan(80);
    expect(warnings.some((w) => w.message.includes('Root login'))).toBe(true);
  });

  it('penalizes password authentication', () => {
    const config = { ...getParanoid(), passwordAuthentication: true };
    const { warnings } = calculateSecurityScore(config);
    expect(warnings.some((w) => w.message.includes('senha') && w.severity === 'danger')).toBe(true);
  });

  it('penalizes disabled pubkey auth', () => {
    const config = { ...getParanoid(), pubkeyAuthentication: false };
    const { score } = calculateSecurityScore(config);
    expect(score).toBeLessThan(75);
  });

  it('penalizes empty passwords', () => {
    const config = { ...getParanoid(), permitEmptyPasswords: true };
    const { warnings } = calculateSecurityScore(config);
    expect(warnings.some((w) => w.message.includes('vazias'))).toBe(true);
  });

  it('warns about x11 forwarding', () => {
    const config = { ...getParanoid(), x11Forwarding: true };
    const { warnings } = calculateSecurityScore(config);
    expect(warnings.some((w) => w.message.includes('X11'))).toBe(true);
  });

  it('warns about gateway ports yes', () => {
    const config = { ...getParanoid(), gatewayPorts: 'yes' as const };
    const { warnings } = calculateSecurityScore(config);
    expect(warnings.some((w) => w.message.includes('GatewayPorts'))).toBe(true);
  });

  it('gives F grade to worst case', () => {
    const config: SshdConfig = {
      ...getParanoid(),
      permitRootLogin: 'yes',
      passwordAuthentication: true,
      pubkeyAuthentication: false,
      permitEmptyPasswords: true,
      x11Forwarding: true,
      allowAgentForwarding: true,
      gatewayPorts: 'yes',
      permitTunnel: true,
      permitUserEnvironment: true,
      maxAuthTries: 10,
    };
    const { grade } = calculateSecurityScore(config);
    expect(grade).toBe('F');
  });

  it('gives balanced preset a good score', () => {
    const { grade } = calculateSecurityScore(getPreset('balanced'));
    expect(['A', 'B']).toContain(grade);
  });

  it('gives permissive preset a lower score', () => {
    const { score } = calculateSecurityScore(getPreset('permissive'));
    expect(score).toBeLessThan(90);
  });
});

describe('getPreset', () => {
  it('returns different configs per preset', () => {
    const paranoid = getPreset('paranoid');
    const balanced = getPreset('balanced');
    const permissive = getPreset('permissive');

    expect(paranoid.allowTcpForwarding).toBe(false);
    expect(balanced.allowTcpForwarding).toBe(true);
    expect(permissive.x11Forwarding).toBe(true);
  });
});

describe('generateApplyScript', () => {
  it('generates a bash script', () => {
    const script = generateApplyScript();
    expect(script).toContain('#!/bin/bash');
    expect(script).toContain('sshd -t');
    expect(script).toContain('sshd_config.bak');
    expect(script).toContain('systemctl');
    expect(script).toContain('launchctl');
  });
});
