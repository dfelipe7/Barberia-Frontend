# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Variables de entorno para build (Vite las incrusta en el HTML/JS)
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Copiar el código y compilar
COPY . .
RUN npm run build

# Etapa 2: Producción con Nginx
FROM nginx:alpine

# Copiar configuración de nginx para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
