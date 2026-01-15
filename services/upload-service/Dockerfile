FROM node:20-alpine AS builder

# Install dependencies for sharp
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

# Runtime dependencies for sharp
RUN apk add --no-cache vips

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production

EXPOSE 4004

CMD ["node", "dist/main"]
