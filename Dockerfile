# =========================
# Dockerfile (pnpm + alpine)
# =========================

FROM node:20-alpine

WORKDIR /app

# --- System deps often needed for native Node modules on Alpine ---
# libc6-compat helps with some prebuilt binaries compatibility
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# --- Enable pnpm via corepack and pin a stable pnpm version ---
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
 && corepack prepare pnpm@9.15.0 --activate

# --- Install dependencies using pnpm lockfile ---
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Copy source then build ---
COPY . .
RUN pnpm build

EXPOSE 3000

# --- Start app ---
CMD ["pnpm", "start"]
