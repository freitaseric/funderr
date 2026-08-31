FROM oven/bun:1.4-alpine AS install
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=install /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
EXPOSE 3001
CMD ["bun", "src/index.ts"]
