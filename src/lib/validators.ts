export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function isPrivilegedPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port < 1024;
}

export function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) return false;
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  return pattern.test(hostname);
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return /^\d{1,3}$/.test(part) && num >= 0 && num <= 255;
  });
}

export function isValidHost(host: string): boolean {
  return host === 'localhost' || isValidHostname(host) || isValidIpv4(host);
}

export function isValidBindAddress(addr: string): boolean {
  return addr === '*' || addr === '0.0.0.0' || addr === 'localhost' || addr === '127.0.0.1' || isValidIpv4(addr);
}

export function isValidSshTarget(target: string): boolean {
  if (!target) return false;
  const withUser = target.includes('@');
  const host = withUser ? target.split('@')[1] : target;
  return isValidHost(host);
}
