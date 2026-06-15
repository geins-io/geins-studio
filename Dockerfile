FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
WORKDIR /app
ARG GEINS_API_URL
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 --ingroup app app
COPY --from=build --chown=app:app /app/.output ./.output
USER app
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
