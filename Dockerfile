# -------------------------
# Stage 1: Frontend deps
# -------------------------
FROM node:20-alpine AS frontend-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------
# Stage 2: Frontend build
# -------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY --from=frontend-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# -------------------------
# Stage 3: API deps
# -------------------------
FROM node:20-alpine AS api-deps

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# -------------------------
# Stage 4: Production image
# -------------------------
FROM node:20-alpine AS runner

RUN apk add --no-cache nginx

WORKDIR /app

COPY --from=api-deps /app/server/node_modules ./server/node_modules
COPY server/package.json server/package-lock.json ./server/
COPY server/src ./server/src

COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1/api/health || exit 1

CMD ["/docker-entrypoint.sh"]
