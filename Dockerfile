# Base dependencies layer
FROM node:18-bookworm-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

# ============================
# Development Stage
# ============================
FROM base AS development

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ============================
# Production Stage
# ============================
FROM base AS production

WORKDIR /app

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
