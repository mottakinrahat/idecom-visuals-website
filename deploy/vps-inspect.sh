#!/usr/bin/env bash
# READ-ONLY inspection of the VPS. Changes nothing. Run it, then paste the output back for review:
#   bash deploy/vps-inspect.sh your-domain.com
DOMAIN="${1:-}"
h() { printf '\n===== %s =====\n' "$1"; }

h "OS / resources";   . /etc/os-release && echo "$PRETTY_NAME"; uname -r; nproc; free -h | sed -n 1,2p; df -h / | tail -1
h "Docker";           docker --version; docker compose version
h "Containers (all)"; docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
h "Compose projects"; docker compose ls -a 2>/dev/null
h "Networks";         docker network ls --format 'table {{.Name}}\t{{.Driver}}'
h "Volumes";          docker volume ls --format 'table {{.Name}}\t{{.Driver}}'
h "Listening ports";  (ss -tlnp 2>/dev/null || sudo ss -tlnp) | awk 'NR==1 || /:(22|80|443|3000|5000|5432)\s/'
h "Host web servers"; for s in nginx apache2 caddy; do printf '%s: ' "$s"; systemctl is-active "$s" 2>/dev/null || echo "not installed"; done
h "Firewall";         (sudo -n ufw status 2>/dev/null || echo "ufw: run 'sudo ufw status' manually")
h "Existing certs";   (sudo -n ls /etc/letsencrypt/live 2>/dev/null || echo "none visible")
h "PM2 / host Node";  command -v pm2 >/dev/null && pm2 ls || echo "pm2: not found"; command -v node >/dev/null && node -v || echo "node: not installed (fine)"
if [ -n "$DOMAIN" ]; then
  h "DNS for $DOMAIN"; getent hosts "$DOMAIN" || echo "no A record yet"; echo "this server: $(curl -fsS https://api.ipify.org 2>/dev/null)"
fi
