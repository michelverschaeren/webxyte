# syntax=docker/dockerfile:1

# Pin the Node version explicitly. Auto-detecting builders (Nixpacks, some PaaS
# defaults) still guess Node 18, while recent Nuxt requires >= 22.19 -- the
# build then fails, or worse, succeeds with a runtime that misbehaves.
#
# Build and runtime MUST use the same base image: sharp (used by @nuxt/image's
# IPX provider) ships prebuilt native binaries per libc. A glibc build copied
# into a musl/Alpine runtime fails at first image request, not at build time.
ARG NODE_VERSION=22.20.0
ARG BASE_IMAGE=node:${NODE_VERSION}-bookworm-slim

# ---------- build stage ----------
FROM ${BASE_IMAGE} AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# devDependencies are required here: Nuxt modules, ESLint config, vue-tsc and
# the Nuxt build itself all live in devDependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm rebuild sharp
RUN pnpm build

# ---------- runtime stage ----------
FROM ${BASE_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# .output is fully self-contained: server bundle, node_modules it actually
# needs, and the prerendered/compressed public assets (.gz/.br included).
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.NITRO_PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
