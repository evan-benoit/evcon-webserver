# Stage 1: build
FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build   

# Stage 2: serve
FROM nginx:latest
COPY --from=builder /app/dist/* /usr/share/nginx/html/
