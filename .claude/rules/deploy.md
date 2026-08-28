---
paths:
  - "Dockerfile"
  - ".dockerignore"
---

# Deployment

`Dockerfile` is multi-stage: the build stage needs devDependencies (Nuxt modules
are build-time), the runtime stage copies only `.output`.

- **Both stages must use the same base image.** sharp ships native binaries per
  libc, and a glibc build dropped into an Alpine runtime fails on the first
  image request, not at build time.
- **The Node version is pinned via `ARG NODE_VERSION`.** Auto-detecting builders
  (Nixpacks and friends) still guess Node 18 while Nuxt needs ≥ 22.19.
