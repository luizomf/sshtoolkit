export type TunnelType = 'local' | 'remote' | 'dynamic';

export interface LocalTunnel {
  type: 'local';
  localPort: number;
  remoteHost: string;
  remotePort: number;
  bindAddress?: string;
}

export interface RemoteTunnel {
  type: 'remote';
  remotePort: number;
  localHost: string;
  localPort: number;
  bindAddress?: string;
}

export interface DynamicTunnel {
  type: 'dynamic';
  localPort: number;
  bindAddress?: string;
}

export type TunnelSpec = LocalTunnel | RemoteTunnel | DynamicTunnel;

export interface TunnelOptions {
  sshServer: string;
  sshUser?: string;
  sshPort?: number;
  jumpHost?: string;
  noShell: boolean;
  background: boolean;
  compression: boolean;
  exitOnForwardFailure: boolean;
  serverAliveInterval?: number;
  serverAliveCountMax?: number;
  identityFile?: string;
}

export interface TunnelConfig {
  tunnels: TunnelSpec[];
  options: TunnelOptions;
}

// --- SSH Client Config types ---

export interface SshHostEntry {
  id: string;
  host: string;
  hostName?: string;
  user?: string;
  port?: number;
  identityFile?: string;
  proxyJump?: string;
  forwardAgent?: boolean;
  localForward?: string[];
  remoteForward?: string[];
  dynamicForward?: string[];
  serverAliveInterval?: number;
  serverAliveCountMax?: number;
  requestTTY?: 'auto' | 'yes' | 'no' | 'force';
  remoteCommand?: string;
  exitOnForwardFailure?: boolean;
  extraOptions?: Record<string, string>;
}

// --- SSHD Hardening types ---

export interface SshdConfig {
  // Basic
  port: number;
  permitRootLogin: 'yes' | 'no' | 'prohibit-password' | 'forced-commands-only';
  passwordAuthentication: boolean;
  pubkeyAuthentication: boolean;
  kbdInteractiveAuthentication: boolean;
  challengeResponseAuthentication: boolean;
  authenticationMethods: string;
  maxAuthTries: number;
  loginGraceTime: number;
  permitEmptyPasswords: boolean;

  // Access Control
  allowUsers: string;
  allowGroups: string;
  denyUsers: string;
  denyGroups: string;

  // Network
  listenAddress: string;
  addressFamily: 'any' | 'inet' | 'inet6';
  clientAliveInterval: number;
  clientAliveCountMax: number;
  useDNS: boolean;
  usePAM: boolean;

  // Security
  x11Forwarding: boolean;
  allowAgentForwarding: boolean;
  allowTcpForwarding: boolean;
  allowStreamLocalForwarding: boolean;
  gatewayPorts: 'no' | 'yes' | 'clientspecified';
  permitTunnel: boolean;
  permitUserEnvironment: boolean;
  permitUserRC: boolean;
  strictModes: boolean;
  maxSessions: number;
  maxStartups: string;
  logLevel: string;

  // Banners
  banner: string;
  printMotd: boolean;
  printLastLog: boolean;
}
