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
