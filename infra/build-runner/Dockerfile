FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app
ENV COREPACK_HOME=/opt/corepack
RUN mkdir -p "$COREPACK_HOME" && chown app:app "$COREPACK_HOME"
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate
WORKDIR /opt/dependencies
COPY templates/react-vite-tailwind/package.json templates/react-vite-tailwind/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false
WORKDIR /workspace
USER app

# The image intentionally contains no platform credentials. Its fixed template
# dependencies are installed during image build, then copied into a networkless
# temporary worktree at runtime.
ENTRYPOINT ["/bin/sh", "-lc"]
