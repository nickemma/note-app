## Stage 1: Build the app
#FROM node:18-alpine AS builder
#WORKDIR /app
#
#COPY package*.json ./
#RUN npm install --frozen-lockfile
#
#COPY . .
#RUN npm run build && npm run export
#
## Stage 2: Serve with Nginx
#FROM nginx:alpine
#COPY --from=builder /app/out /usr/share/nginx/html
#COPY nginx.conf /etc/nginx/conf.d/default.conf
#
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
