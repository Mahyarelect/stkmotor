# ==============================================================================
# STK Motors - Production Multi-stage Dockerfile (PostgreSQL)
# Optimized for minimal image size, fast startup, and non-root security.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests & prisma schema for dependency caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client for PostgreSQL and create optimized Next.js standalone bundle
RUN npx prisma generate
RUN npm run build

# Strip unused database query engine WASM files and source maps from standalone bundle
RUN find /app/.next/standalone/node_modules/@prisma/client/runtime -name "*query_compiler_bg.*.wasm-base64*" ! -name "*postgresql*" -delete 2>/dev/null || true && \
    find /app/.next/standalone/node_modules/@prisma/client/runtime -name "*query_engine_bg.*.wasm-base64*" ! -name "*postgresql*" -delete 2>/dev/null || true && \
    find /app/.next/standalone -name "*.map" -delete 2>/dev/null || true

# ------------------------------------------------------------------------------
# Stage 3: Runner (Minimal production runtime)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn* /usr/local/bin/corepack /root/.npm /var/cache/apk/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="postgresql://stkuser:stkpassword@db:5432/stkmotor?schema=public"

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone bundle and essential runtime assets from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Health check to ensure API is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/stats || exit 1

CMD ["node", "server.js"]
