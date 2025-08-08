
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install pm2 -g && npm install --production

COPY . .

EXPOSE 5000
ENV NODE_ENV=production

CMD ["pm2-runtime", "index.js"]
