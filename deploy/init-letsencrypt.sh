#!/usr/bin/env bash
# One-time HTTPS setup (Docker only). Run ONCE on the VPS after:
#   • DNS A record for $DOMAIN points to this server
#   • ports 80 and 443 are free on the host / open in the firewall
#   • .env.production is filled in and the images exist (./deploy/deploy.sh <tag> OR ./deploy/dc.sh build)
#
#   STAGING=1 ./deploy/init-letsencrypt.sh    # test against Let's Encrypt staging first (no rate limits)
#   ./deploy/init-letsencrypt.sh              # real certificate
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; . ./.env.production; set +a
: "${DOMAIN:?DOMAIN missing in .env.production}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL missing in .env.production}"

VOL=idecom_letsencrypt
dc() { ./deploy/dc.sh "$@"; }

echo "==> 1/4 Temporary self-signed certificate so nginx can start"
docker volume create "$VOL" >/dev/null
docker run --rm -v "$VOL":/etc/letsencrypt --entrypoint sh alpine/openssl -c "
  mkdir -p /etc/letsencrypt/live/$DOMAIN &&
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem -subj '/CN=localhost'"

echo "==> 2/4 Starting backend, frontend and nginx"
dc up -d backend frontend nginx

echo "==> 3/4 Requesting the real certificate from Let's Encrypt"
docker run --rm -v "$VOL":/etc/letsencrypt --entrypoint sh alpine/openssl -c "
  rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf"
dc run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email --non-interactive \
  ${STAGING:+--staging}

echo "==> 4/4 Reloading nginx and starting automatic renewal"
dc exec nginx nginx -s reload
dc up -d certbot
echo "Done. Check: curl -I https://$DOMAIN"
