# syntax=docker/dockerfile:1.7
# Next.js frontend — build context is the MONOREPO ROOT:
#   docker build -f frontend/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://example.com/api .
ARG NODE_VERSION=22

# ---- 1. dependencies --------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN --mount=type=cache,target=/root/.npm npm ci -w frontend

# ---- 2. build ---------------------------------------------------------------
FROM deps AS build
# NEXT_PUBLIC_* values are inlined into the browser bundle at BUILD time,
# so the public API URL must be a build argument (not a runtime variable).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY frontend ./frontend
RUN npm run build -w frontend \
 # fail early with a clear message if the standalone layout is not what the runner expects
 && test -f frontend/.next/standalone/frontend/server.js

# ---- 3. runtime image (standalone output only) ------------------------------
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/frontend/.next/static ./frontend/.next/static
COPY --from=build --chown=node:node /app/frontend/public ./frontend/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "frontend/server.js"]
