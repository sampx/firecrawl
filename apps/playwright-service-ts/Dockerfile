FROM ghcr.io/firecrawl/playwright-service:latest

WORKDIR /usr/src/app

COPY api.ts ./api.ts
COPY helpers ./helpers
COPY tsconfig.json ./tsconfig.json
COPY package.json ./package.json
RUN npm run build

ARG PORT=3000
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["npm", "start"]
