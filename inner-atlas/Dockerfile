FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs build.mjs ./
COPY --chown=node:node src ./src
COPY --chown=node:node ai ./ai
COPY --chown=node:node api ./api
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node docs ./docs
COPY --chown=node:node index.html favicon.svg ./
USER node
ENV NODE_ENV=production PORT=4173
EXPOSE 4173
CMD ["node", "server.mjs"]
