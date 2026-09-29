# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copiamos package.json y lockfile
COPY package*.json ./

# Desactiva husky dentro de Docker
ENV HUSKY=0

# Instala todas las dependencias (incluidas dev)
RUN npm ci

# sharp necesita su binario nativo para Alpine (musl). El lockfile se generó en
# otra plataforma y omite @img/sharp-linuxmusl-*, así que lo instalamos aquí
# explícitamente para que la generación de miniaturas funcione en runtime.
RUN npm install --no-save --os=linux --libc=musl --cpu=x64 sharp

# Copiamos el resto del proyecto
COPY . .

# Compila la app
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HUSKY=0

# Copiamos solo lo necesario desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]

