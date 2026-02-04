# =========================
# Dockerfile (pnpm + alpine) - fixed
# =========================
FROM node:20-alpine

WORKDIR /app

# Native deps for some packages on Alpine
RUN apk add --no-cache \
  libc6-compat \
  python3 \
  make \
  g++

# pnpm via corepack (pin version to avoid lockfile/tooling drift)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy manifests first (better caching)
COPY package.json pnpm-lock.yaml ./

# Debug versions (helps if build service hides logs)
RUN node -v && pnpm -v

# Install strictly (recommended for CI/prod)
RUN pnpm install --no-frozen-lockfile --reporter=append-only
# Copy source and build
COPY . .
ENV NODE_ENV=production
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
