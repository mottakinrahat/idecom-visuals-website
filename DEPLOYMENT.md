# Docker deployment (Contabo VPS, Ubuntu 24.04)

Nginx (ports 80/443) → **frontend** (Next.js, internal :3000) and **backend** (NestJS, internal :5000).
Docker only: no PM2, no Node on the host. Only nginx publishes ports.

```
Internet ─443→ nginx ─┬─ /api/resolve, /api/thumb → frontend   (Next.js' own API routes)
                      ├─ /api/*, /uploads/*       → backend    (NestJS)
                      └─ everything else          → frontend
```

## What the inspection found (read this first)

| You expected | What the repo actually has | What I did |
|---|---|---|
| Prisma + Neon PostgreSQL | **No Prisma** — the backend talks to Neon PostgreSQL with the `pg` driver and creates its own tables (see "Database" below). | `DATABASE_URL` is passed to the backend; no migration step. |
| — | The backend has **no authentication**. `GET /api/inquiries` returns customers' phone numbers; `DELETE`/`PATCH` endpoints are open. | Not changed (out of scope), but **fix before going public** — see "Before you go live". |
| — | Next.js has its own `/api/resolve` + `/api/thumb` routes that collide with the NestJS `/api` prefix. | Nginx sends those two paths to the frontend. |
| — | `NEXT_PUBLIC_API_URL` is baked into the browser bundle at build time. | It is a Docker **build argument** (`https://<domain>/api`). Changing the domain means rebuilding the frontend image. |

Repo change: `frontend/next.config.ts` now sets `output: "standalone"` (+ `outputFileTracingRoot`) so the image is small.

## Files

| File | Purpose |
|---|---|
| `backend/Dockerfile`, `frontend/Dockerfile` | Multi-stage, non-root, health-checked. Build context = repo root (npm workspaces share one lockfile). |
| `docker-compose.production.yml` | nginx, certbot, frontend, backend; `restart: unless-stopped`; health checks; log rotation; one private network; named volumes. |
| `deploy/nginx/templates/default.conf.template` | Reverse proxy, HTTPS redirect, security headers, rate limit on the contact form. |
| `deploy/env.production.example` | Template for the server-side secrets file. |
| `deploy/init-letsencrypt.sh` | One-time certificate issuing (Docker only). |
| `deploy/deploy.sh`, `deploy/dc.sh` | Deploy / roll back a tag with automatic health-check rollback; compose wrapper. |
| `deploy/vps-inspect.sh` | **Read-only** VPS inspection. |
| `.github/workflows/deploy.yml` | Build → push to GHCR → SSH deploy → smoke test. |

## Step 0 — Inspect the VPS (nothing is changed)

```bash
bash deploy/vps-inspect.sh your-domain.com
```
Send me the output. It shows existing containers, ports 80/443, host nginx/apache, firewall, DNS, PM2. **I will not touch or remove anything on the VPS until you have reviewed it and approved.** If something already listens on 80/443, we decide together how to handle it first.

## Step 1 — Server setup (first time)

```bash
mkdir -p ~/idecom && cd ~/idecom          # use the path you want; set the same in the VPS_APP_DIR GitHub variable
# copy docker-compose.production.yml and deploy/ here (the first GitHub deploy does this automatically)
cp deploy/env.production.example .env.production
chmod 600 .env.production                 # then fill DOMAIN, LETSENCRYPT_EMAIL, GHCR_NAMESPACE
chmod +x deploy/*.sh
```
DNS: create an `A` record for `DOMAIN` → the VPS IP **before** requesting a certificate. Open ports 80 and 443 in the firewall.

## Step 2 — GitHub configuration

Repo → Settings → *Secrets and variables → Actions*:

| Type | Name | Value |
|---|---|---|
| Variable | `DOMAIN` | your domain (no `https://`) |
| Variable | `VPS_APP_DIR` | absolute path from step 1 |
| Variable | `VPS_PORT` | optional, default 22 |
| Secret | `VPS_HOST`, `VPS_USER` | server address / SSH user |
| Secret | `VPS_SSH_KEY` | private key of a **dedicated deploy key** (add its public half to the server's `authorized_keys`) |
| Secret | `VPS_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 <host>` run from a trusted machine |
| Secret | `GHCR_PULL_USER`, `GHCR_PULL_TOKEN` | a GitHub user + classic PAT with only `read:packages` |

Create an Environment called `production` (optionally with required reviewers = manual approval before each deploy).

## Step 3 — First deployment and HTTPS

1. Push to `main` (or run the workflow manually). The images are built, the files are copied and the app containers start and become healthy. The workflow's final **smoke test will fail** the first time — nginx cannot serve HTTPS until a certificate exists. That is expected.
2. On the server (use the same tag the workflow deployed; `./deploy/dc.sh ps` shows it):
   ```bash
   STAGING=1 ./deploy/init-letsencrypt.sh                # test run against Let's Encrypt staging
   ./deploy/init-letsencrypt.sh                          # real certificate
   ```
   The script creates a temporary certificate so nginx can start, obtains the real one via the HTTP challenge, and reloads nginx. Renewal is automatic afterwards (certbot container; nginx reloads every 6 h). Re-run the workflow once to see it go green.

## Step 4 — Verify

```bash
./deploy/dc.sh ps                                   # all "healthy" / "running"
curl -I https://DOMAIN                              # 200, valid certificate
curl https://DOMAIN/api                             # NestJS answers
curl -s https://DOMAIN/api/packages | head -c 200   # JSON, proves nginx → backend → data volume
./deploy/dc.sh logs -f backend frontend nginx       # logs (rotated: 5 × 10 MB per container)
```
Submit the contact form once, then check Dashboard → Requests.

## Day-to-day

* **Deploy:** push to `main`. **Logs:** `./deploy/dc.sh logs -f <service>`. **Restart one service:** `./deploy/dc.sh restart backend`.
* Always use `./deploy/dc.sh` — it loads `.env.production` and the deployed image tag.
* **File uploads:** with the `CLOUDFLARE_*` values in `.env.production`, images and videos go to Cloudflare R2 and the website uses their public R2 URLs. Without them, files are stored in the `idecom_backend_uploads` volume.
* **Backup the data volumes** (JSON store + uploads):
  ```bash
  docker run --rm -v idecom_backend_data:/d -v idecom_backend_uploads:/u -v "$PWD":/b alpine \
    tar czf /b/idecom-data-$(date +%F).tgz /d /u
  ```
* **Move your local data to the server** (equipment, packages, uploads): `docker cp backend/data/. $(./deploy/dc.sh ps -q backend):/app/backend/data/` and the same for `uploads/`, then `./deploy/dc.sh restart backend`. (Don't copy `inquiries.json` if it holds test data.)

## Rollback

* **Automatic:** if a new version isn't healthy within 150 s, `deploy.sh` restarts the previous tag and exits with an error.
* **Manual:** `cat .deploy-state/previous` → `./deploy/deploy.sh <that-tag>`. Every build is tagged with its git SHA (12 chars), so any older tag still in GHCR works.
* **Config change gone wrong:** restore `.env.production` from your password manager; `./deploy/dc.sh up -d`.
* **Remove the whole stack (keeps data):** `./deploy/dc.sh down`. **Also delete data (irreversible):** `./deploy/dc.sh down -v`.
* Nothing in this setup modifies existing containers, volumes or networks: everything is prefixed `idecom_`.

## Before you go live (important)

1. **Add authentication to the API/dashboard.** Right now anyone who finds `https://DOMAIN/dashboard` or `/api/inquiries` can read customer data and delete records. Minimum: protect `/dashboard` and every non-public `/api` route (everything except `POST /api/inquiries`, and the equipment/package reads the public site needs). I can add this next (e.g. admin login with a signed session, or nginx basic-auth as a quick stopgap).
2. Put the real contact details/WhatsApp number in Dashboard → Settings/CMS (they are saved per browser today; see item below).
3. The CMS content is still kept in the **browser's localStorage**, not the server — visitors on other devices don't see CMS edits. Moving it to the backend is a separate task.

## Database (Neon PostgreSQL)

All dashboard data is stored in PostgreSQL, using `DATABASE_URL` from `.env.production` (backend/.env in development). It uses the `pg` driver directly — there is **no Prisma and no migration command**: on first start the backend creates its tables itself (`equipment`, `bookings`, `packages`, `inquiries`, `portfolio_videos`, `crm_leads`, `custom_packages`, `kv_store`) and adds new columns automatically when a field is added.

* On the very first start, old JSON files in `backend/data` (if any) are imported once. Placeholder videos/packages are seeded once.
* CMS content and the package-page texts are stored as JSON documents in `kv_store` (keys `site`, `package-meta`).
* Run **one** backend instance (rows are cached in memory after start). Backups: use Neon's point-in-time restore / branches.
* Only `backend_uploads` remains as a Docker volume (local fallback when Cloudflare R2 is not configured).
