FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG APP=api-gateway
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx nest build ${APP}

FROM node:22-alpine AS runner
WORKDIR /app
ARG APP=api-gateway
ENV NODE_ENV=production
ENV APP=${APP}
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY libs/contracts/proto ./libs/contracts/proto
EXPOSE 3000
CMD ["sh", "-c", "node dist/apps/${APP}/main.js"]
