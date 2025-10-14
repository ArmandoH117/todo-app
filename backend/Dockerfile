ROM node:18-alpine

# Crea usuario no root (mejor práctica)
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp
WORKDIR /app

# Instala dependencias solo con package*.json
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el resto del código
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Ejecuta como usuario no root
USER nodeusr

CMD ["node", "src/index.js"]

