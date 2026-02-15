FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build TypeScript
RUN npm install -g typescript ts-node
RUN npx tsc --skipLibCheck || true

EXPOSE 3003

CMD ["node", "dist/index.js"]
