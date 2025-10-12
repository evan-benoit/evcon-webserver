# Stage 1: build
FROM node:20 as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build   

# Stage 2: serve
FROM nginx:latest
COPY ./dist/* /usr/share/nginx/html/
