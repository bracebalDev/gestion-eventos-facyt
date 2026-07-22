# ==========================================
# ETAPA 1: Compilación de Assets (Builder)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar frontend estático Vite y servidor Express
ENV NODE_ENV=production
RUN npm run build

# ==========================================
# ETAPA 2: Runtime Ligero para Producción
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar solo dependencias necesarias para ejecución
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copiar artefactos compilados y datos base
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Configuración de Entorno
ENV NODE_ENV=production
ENV PORT=3000

# Puerto expuesto
EXPOSE 3000

# Volumen para garantizar la persistencia de data/db.json
VOLUME ["/app/data"]

# Comando de arranque del servidor unificado
CMD ["node", "dist/server.cjs"]
