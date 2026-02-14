FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback
RUN echo 'server { listen 80; root /usr/share/nginx/html; location / { try_files $uri /index.html; } location /api { proxy_pass http://backend:4000; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
