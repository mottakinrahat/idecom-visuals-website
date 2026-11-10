# syntax=docker/dockerfile:1.7
# NestJS backend — build context is the MONOREPO ROOT (npm workspaces share one lockfile):
#   docker build -f backend/Dockerfile .
ARG NODE_VERSION=22

# ---- 1. all dependencies (for building) ------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
# every workspace manifest must be present for `npm ci` to validate the lockfile
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN --mount=type=cache,target=/root/.npm npm ci -w backend

# ---- 2. compile TypeScript --------------------------------------------------
FROM deps AS build
COPY backend ./backend
RUN npm run build -w backend

# ---- 3. production-only dependencies ---------------------------------------
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN --mount=type=cache,target=/root/.npm npm ci -w backend --omit=dev \
 && mkdir -p backend/node_modules

# ---- 4. runtime image -------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/package.json ./backend/package.json

# runtime data (JSON store + uploaded images) — mounted as named volumes in compose.
# chown here so a fresh named volume inherits the non-root owner.
RUN mkdir -p /app/backend/data /app/backend/uploads \
 && chown -R node:node /app/backend/data /app/backend/uploads
USER node
WORKDIR /app/backend

ENV PORT=5000
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main"]
