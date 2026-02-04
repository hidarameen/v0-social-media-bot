FROM node:20-alpine AS base

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

ENV NEXT_FONT_GOOGLE_MOCK=1
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
