# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de dependencias y configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar el build desde el stage anterior
COPY --from=builder /usr/src/app/dist ./dist

# Exponer el puerto
EXPOSE 4001

CMD ["node", "dist/main.js"]
