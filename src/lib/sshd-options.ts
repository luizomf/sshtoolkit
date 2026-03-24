import type { SshdConfig } from './types';

export type PresetName = 'paranoid' | 'balanced' | 'permissive';

export const PRESETS: Record<PresetName, { label: string; description: string }> = {
  paranoid: {
    label: 'Paranoico',
    description: 'Máxima segurança. Só chave pública, sem forwards, sem root.',
  },
  balanced: {
    label: 'Equilibrado',
    description: 'Seguro com TCP forwarding habilitado. Bom para uso geral.',
  },
  permissive: {
    label: 'Permissivo',
    description: 'Mais aberto. Útil para lab/testes. Não use em produção.',
  },
};

export function getPreset(name: PresetName): SshdConfig {
  const base = getParanoidDefaults();

  switch (name) {
    case 'paranoid':
      return base;
    case 'balanced':
      return {
        ...base,
        allowTcpForwarding: true,
        maxAuthTries: 4,
        loginGraceTime: 60,
        maxSessions: 10,
        clientAliveCountMax: 3,
      };
    case 'permissive':
      return {
        ...base,
        permitRootLogin: 'prohibit-password',
        allowTcpForwarding: true,
        x11Forwarding: true,
        allowAgentForwarding: true,
        gatewayPorts: 'clientspecified',
        permitTunnel: true,
        maxAuthTries: 6,
        loginGraceTime: 120,
        maxSessions: 20,
        maxStartups: '10:30:100',
        logLevel: 'INFO',
        printMotd: true,
      };
  }
}

function getParanoidDefaults(): SshdConfig {
  return {
    port: 22,
    permitRootLogin: 'no',
    passwordAuthentication: false,
    pubkeyAuthentication: true,
    kbdInteractiveAuthentication: false,
    challengeResponseAuthentication: false,
    authenticationMethods: 'publickey',
    maxAuthTries: 3,
    loginGraceTime: 30,
    permitEmptyPasswords: false,

    allowUsers: '',
    allowGroups: '',
    denyUsers: '',
    denyGroups: '',

    listenAddress: '',
    addressFamily: 'any',
    clientAliveInterval: 300,
    clientAliveCountMax: 2,
    useDNS: false,
    usePAM: true,

    x11Forwarding: false,
    allowAgentForwarding: false,
    allowTcpForwarding: false,
    allowStreamLocalForwarding: false,
    gatewayPorts: 'no',
    permitTunnel: false,
    permitUserEnvironment: false,
    permitUserRC: false,
    strictModes: true,
    maxSessions: 5,
    maxStartups: '10:30:60',
    logLevel: 'VERBOSE',

    banner: '',
    printMotd: false,
    printLastLog: true,
  };
}

export interface SecurityWarning {
  message: string;
  severity: 'danger' | 'warn' | 'info';
}

export function calculateSecurityScore(config: SshdConfig): {
  score: number;
  grade: string;
  warnings: SecurityWarning[];
} {
  let score = 100;
  const warnings: SecurityWarning[] = [];

  // Authentication
  if (config.permitRootLogin === 'yes') {
    score -= 25;
    warnings.push({ message: 'Root login está habilitado', severity: 'danger' });
  } else if (config.permitRootLogin === 'prohibit-password') {
    score -= 5;
    warnings.push({ message: 'Root login por chave está habilitado', severity: 'warn' });
  }

  if (config.passwordAuthentication) {
    score -= 20;
    warnings.push({ message: 'Autenticação por senha está habilitada', severity: 'danger' });
  }

  if (!config.pubkeyAuthentication) {
    score -= 30;
    warnings.push({ message: 'Autenticação por chave pública está desabilitada', severity: 'danger' });
  }

  if (config.permitEmptyPasswords) {
    score -= 25;
    warnings.push({ message: 'Senhas vazias são permitidas', severity: 'danger' });
  }

  // Forwarding
  if (config.x11Forwarding) {
    score -= 5;
    warnings.push({ message: 'X11 forwarding está habilitado', severity: 'warn' });
  }

  if (config.allowAgentForwarding) {
    score -= 3;
    warnings.push({ message: 'Agent forwarding está habilitado', severity: 'info' });
  }

  if (config.gatewayPorts === 'yes') {
    score -= 10;
    warnings.push({ message: 'GatewayPorts yes força bind em 0.0.0.0 para todos', severity: 'warn' });
  }

  if (config.permitTunnel) {
    score -= 3;
    warnings.push({ message: 'PermitTunnel está habilitado', severity: 'info' });
  }

  if (config.permitUserEnvironment) {
    score -= 5;
    warnings.push({ message: 'PermitUserEnvironment pode permitir bypass de restrições', severity: 'warn' });
  }

  // Network
  if (config.port === 22) {
    score -= 2;
    warnings.push({ message: 'Porta padrão 22 — considere mudar para reduzir scan', severity: 'info' });
  }

  if (config.maxAuthTries > 5) {
    score -= 3;
    warnings.push({ message: `MaxAuthTries alto (${config.maxAuthTries})`, severity: 'info' });
  }

  if (config.useDNS) {
    score -= 1;
    warnings.push({ message: 'UseDNS pode causar lentidão na autenticação', severity: 'info' });
  }

  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score, grade, warnings };
}
