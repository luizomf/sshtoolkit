import type { SshdConfig } from './types';

function line(key: string, value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return `${key} ${value ? 'yes' : 'no'}`;
  }
  return `${key} ${value}`;
}

export function generateSshdConfig(config: SshdConfig): string {
  const lines: string[] = [];

  lines.push('# ============================================================');
  lines.push('# sshd_config — gerado por SSH Toolkit');
  lines.push('# https://sshtoolkit.otaviomiranda.com.br');
  lines.push('# ============================================================');
  lines.push('');

  // Basic Authentication
  lines.push('# --- Autenticação ---');
  lines.push(line('Port', config.port));

  if (config.listenAddress) {
    for (const addr of config.listenAddress.split(/[,\s]+/).filter(Boolean)) {
      lines.push(line('ListenAddress', addr));
    }
  }

  if (config.addressFamily !== 'any') {
    lines.push(line('AddressFamily', config.addressFamily));
  }

  lines.push(line('PermitRootLogin', config.permitRootLogin));
  lines.push(line('PubkeyAuthentication', config.pubkeyAuthentication));
  lines.push(line('PasswordAuthentication', config.passwordAuthentication));
  lines.push(line('KbdInteractiveAuthentication', config.kbdInteractiveAuthentication));
  lines.push(line('ChallengeResponseAuthentication', config.challengeResponseAuthentication));
  lines.push(line('PermitEmptyPasswords', config.permitEmptyPasswords));

  if (config.authenticationMethods) {
    lines.push(line('AuthenticationMethods', config.authenticationMethods));
  }

  lines.push(line('MaxAuthTries', config.maxAuthTries));
  lines.push(line('LoginGraceTime', config.loginGraceTime));
  lines.push(line('UsePAM', config.usePAM));

  // Access Control
  if (config.allowUsers || config.allowGroups || config.denyUsers || config.denyGroups) {
    lines.push('');
    lines.push('# --- Controle de Acesso ---');
    if (config.allowUsers) lines.push(line('AllowUsers', config.allowUsers));
    if (config.allowGroups) lines.push(line('AllowGroups', config.allowGroups));
    if (config.denyUsers) lines.push(line('DenyUsers', config.denyUsers));
    if (config.denyGroups) lines.push(line('DenyGroups', config.denyGroups));
  }

  // Security
  lines.push('');
  lines.push('# --- Segurança ---');
  lines.push(line('X11Forwarding', config.x11Forwarding));
  lines.push(line('AllowAgentForwarding', config.allowAgentForwarding));
  lines.push(line('AllowTcpForwarding', config.allowTcpForwarding));
  lines.push(line('AllowStreamLocalForwarding', config.allowStreamLocalForwarding));
  lines.push(line('GatewayPorts', config.gatewayPorts));
  lines.push(line('PermitTunnel', config.permitTunnel));
  lines.push(line('PermitUserEnvironment', config.permitUserEnvironment));
  lines.push(line('PermitUserRC', config.permitUserRC));
  lines.push(line('StrictModes', config.strictModes));

  // Sessions & Limits
  lines.push('');
  lines.push('# --- Sessões e Limites ---');
  lines.push(line('MaxSessions', config.maxSessions));
  lines.push(line('MaxStartups', config.maxStartups));
  lines.push(line('ClientAliveInterval', config.clientAliveInterval));
  lines.push(line('ClientAliveCountMax', config.clientAliveCountMax));
  lines.push(line('UseDNS', config.useDNS));
  lines.push(line('LogLevel', config.logLevel));

  // Banners
  lines.push('');
  lines.push('# --- Banners ---');
  lines.push(line('PrintMotd', config.printMotd));
  lines.push(line('PrintLastLog', config.printLastLog));

  if (config.banner) {
    lines.push(line('Banner', config.banner));
  }

  lines.push('');
  return lines.join('\n');
}

export function generateApplyScript(): string {
  return `#!/bin/bash
# Script para aplicar o sshd_config gerado
# Execute com: sudo bash apply-sshd.sh

set -e

echo "Fazendo backup do sshd_config atual..."
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

echo "Copiando novo sshd_config..."
sudo cp sshd_config /etc/ssh/sshd_config

echo "Testando configuração..."
sudo sshd -t

if [ $? -eq 0 ]; then
  echo "Configuração válida. Reiniciando sshd..."
  if command -v systemctl &> /dev/null; then
    sudo systemctl restart sshd
  elif command -v launchctl &> /dev/null; then
    sudo launchctl kickstart -k system/com.openssh.sshd
  else
    sudo service sshd restart
  fi
  echo "sshd reiniciado com sucesso!"
else
  echo "ERRO: configuração inválida. Restaurando backup..."
  sudo cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config
  echo "Backup restaurado."
  exit 1
fi`;
}
