# Stage 1: deps — node:24-slim (Debian) evita problemas com native modules no Alpine
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build
FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis necessárias em build time (públicas apenas)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build Next.js app (standalone)
RUN npm run build

# Bundle worker como arquivo JS único (resolve path aliases via tsconfig)
RUN npx esbuild worker/index.ts \
      --bundle \
      --platform=node \
      --target=node24 \
      --tsconfig=tsconfig.json \
      --outfile=worker-bundle.js

# Stage 3: runner — imagem mínima de produção
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

RUN mkdir -p ./public ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Worker bundle — único arquivo, sem dependências externas
COPY --from=builder --chown=nextjs:nodejs /app/worker-bundle.js ./worker-bundle.js

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default: roda o app Next.js
# Para o worker: docker run ... node worker-bundle.js
CMD ["node", "server.js"]
