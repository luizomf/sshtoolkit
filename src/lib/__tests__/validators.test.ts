import { describe, it, expect } from 'vitest';
import {
  isValidPort,
  isPrivilegedPort,
  isValidHostname,
  isValidIpv4,
  isValidHost,
  isValidBindAddress,
  isValidSshTarget,
} from '../validators';

describe('isValidPort', () => {
  it('accepts valid ports', () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(22)).toBe(true);
    expect(isValidPort(8080)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
  });

  it('rejects invalid ports', () => {
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(1.5)).toBe(false);
    expect(isValidPort(NaN)).toBe(false);
  });
});

describe('isPrivilegedPort', () => {
  it('identifies privileged ports', () => {
    expect(isPrivilegedPort(1)).toBe(true);
    expect(isPrivilegedPort(80)).toBe(true);
    expect(isPrivilegedPort(443)).toBe(true);
    expect(isPrivilegedPort(1023)).toBe(true);
  });

  it('identifies non-privileged ports', () => {
    expect(isPrivilegedPort(1024)).toBe(false);
    expect(isPrivilegedPort(8080)).toBe(false);
  });
});

describe('isValidHostname', () => {
  it('accepts valid hostnames', () => {
    expect(isValidHostname('server')).toBe(true);
    expect(isValidHostname('my-server')).toBe(true);
    expect(isValidHostname('db.internal')).toBe(true);
    expect(isValidHostname('a.b.c.d.example.com')).toBe(true);
  });

  it('rejects invalid hostnames', () => {
    expect(isValidHostname('')).toBe(false);
    expect(isValidHostname('-server')).toBe(false);
    expect(isValidHostname('server-')).toBe(false);
    expect(isValidHostname('.server')).toBe(false);
    expect(isValidHostname('ser ver')).toBe(false);
  });
});

describe('isValidIpv4', () => {
  it('accepts valid IPs', () => {
    expect(isValidIpv4('192.168.1.1')).toBe(true);
    expect(isValidIpv4('0.0.0.0')).toBe(true);
    expect(isValidIpv4('255.255.255.255')).toBe(true);
    expect(isValidIpv4('10.0.0.1')).toBe(true);
  });

  it('rejects invalid IPs', () => {
    expect(isValidIpv4('256.0.0.1')).toBe(false);
    expect(isValidIpv4('1.2.3')).toBe(false);
    expect(isValidIpv4('1.2.3.4.5')).toBe(false);
    expect(isValidIpv4('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIpv4('')).toBe(false);
  });
});

describe('isValidHost', () => {
  it('accepts localhost, hostnames, and IPs', () => {
    expect(isValidHost('localhost')).toBe(true);
    expect(isValidHost('server')).toBe(true);
    expect(isValidHost('192.168.1.1')).toBe(true);
    expect(isValidHost('db.internal')).toBe(true);
  });
});

describe('isValidBindAddress', () => {
  it('accepts valid bind addresses', () => {
    expect(isValidBindAddress('*')).toBe(true);
    expect(isValidBindAddress('0.0.0.0')).toBe(true);
    expect(isValidBindAddress('localhost')).toBe(true);
    expect(isValidBindAddress('127.0.0.1')).toBe(true);
    expect(isValidBindAddress('192.168.1.1')).toBe(true);
  });

  it('rejects invalid bind addresses', () => {
    expect(isValidBindAddress('example.com')).toBe(false);
    expect(isValidBindAddress('')).toBe(false);
  });
});

describe('isValidSshTarget', () => {
  it('accepts valid targets', () => {
    expect(isValidSshTarget('server')).toBe(true);
    expect(isValidSshTarget('user@server')).toBe(true);
    expect(isValidSshTarget('deploy@192.168.1.1')).toBe(true);
    expect(isValidSshTarget('my-vps.example.com')).toBe(true);
  });

  it('rejects invalid targets', () => {
    expect(isValidSshTarget('')).toBe(false);
  });
});
