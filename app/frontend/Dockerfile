FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Pin pnpm explicitly: Node 20 Corepack otherwise resolves its newest default,
# which currently requires Node 22 and fails before dependency installation.
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate && pnpm install --frozen-lockfile
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
