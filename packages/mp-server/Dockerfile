# Shared matchmaking + relay server for every online game (Lawn Gnome Panic, Gnome Front, Gnaft).
# Build from the repo root (it needs packages/mp/src/protocol.ts and textFilter.ts):
#   docker build -f packages/mp-server/Dockerfile -t lawn-gnome-mm .
FROM node:22-alpine AS build
WORKDIR /app/packages/mp-server
COPY packages/mp-server/package.json ./
RUN npm install --no-audit --no-fund
COPY packages/mp/src/protocol.ts packages/mp/src/textFilter.ts /app/packages/mp/src/
# packages/mp/src/textFilter.ts imports 'obscenity': let it resolve from the server's node_modules.
RUN ln -s /app/packages/mp-server/node_modules /app/packages/mp/node_modules
COPY packages/mp-server/tsconfig.json ./
COPY packages/mp-server/src ./src
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /srv
COPY packages/mp-server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/packages/mp-server/dist/server.mjs ./server.mjs
USER node
EXPOSE 8080
# SIGTERM drains: no new matches, running ones finish (see src/index.ts).
CMD ["node", "server.mjs"]
