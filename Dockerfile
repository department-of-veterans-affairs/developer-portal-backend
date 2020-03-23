# The base stage is used for local development and running
# tests in CI.
FROM vasdvp/lighthouse-node-application-base:node12 AS base
WORKDIR /home/node
ENV NODE_ENV development
# Install app dependencies in a separate layer from source code, as these will change less often
COPY --chown=node:node package*.json ./
RUN npm install && npm cache clean --force
# Add node module binaries (like jest) to path
ENV PATH /home/node/node_modules/.bin:$PATH
COPY --chown=node:node . .
RUN tsc

# The prod stage removes dev dependencies and creates a
# container for production usage.
FROM vasdvp/lighthouse-node-application-base:node12 AS prod
EXPOSE 9999
WORKDIR /home/node
ENV NODE_ENV production
COPY --chown=node:node --from=base /home/node/dist dist
COPY --chown=node:node --from=base /home/node/package*.json ./
COPY --chown=node:node --from=base /home/node/node_modules node_modules
RUN npm prune --production
CMD ["node", "dist/server.js"]

