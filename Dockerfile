# BASE STAGE - used for local development
FROM vasdvp/lighthouse-node-application-base:node12 AS base
WORKDIR /home/node
ENV NODE_ENV development
# install app dependencies in a separate layer from source code, as these will change less often
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .
RUN npm install && npm cache clean --force
# NOTE: no commit hash defined in the base image. It can be pulled in from a .env file if desired

# BUILT STAGE - used for local development and running tests in CI
FROM vasdvp/lighthouse-node-application-base:node12 AS built
WORKDIR /home/node
ENV NODE_ENV development
# copy files from base stage
COPY --chown=node:node --from=base /home/node .
# store the commit hash build argument in an environment variable for base
ARG COMMIT_HASH
ENV COMMIT_HASH $COMMIT_HASH
# Add node module binaries (like jest) to path
ENV PATH /home/node/node_modules/.bin:$PATH
RUN npm run build

# PROD STAGE - removed dev dependencies and create a container for production usage
FROM vasdvp/lighthouse-node-application-base:node12 AS prod
EXPOSE 9999
WORKDIR /home/node
ENV NODE_ENV production
RUN openssl x509 \
  -inform der \
  -in /etc/pki/ca-trust/source/anchors/VA-Internal-S2-RCA1-v1.cer \
  -out /home/node/va-internal.pem
ENV NODE_EXTRA_CA_CERTS=/home/node/va-internal.pem
# store the commit hash build argument in an environment variable for prod
ARG COMMIT_HASH
ENV COMMIT_HASH $COMMIT_HASH
# copy files from built stage
COPY --chown=node:node --from=built /home/node/bin bin
COPY --chown=node:node --from=built /home/node/dist dist
COPY --chown=node:node --from=built /home/node/package*.json ./
COPY --chown=node:node --from=built /home/node/node_modules node_modules
RUN npm prune --production
HEALTHCHECK --interval=30s --timeout=4s --start-period=30s \
  CMD node bin/healthcheck.js
CMD ["node", "dist/server.js"]
