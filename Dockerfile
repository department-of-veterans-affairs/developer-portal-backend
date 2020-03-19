FROM vasdvp/lighthouse-node-application-base:node12

WORKDIR /home/node

# Set build arg to production to only install production dependencies
# in the npm install step
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Install app dependencies in a separate layer from source code, as these will change less often
COPY --chown=node:node package*.json ./
RUN npm install && npm cache clean --force

# Add node module binaries (like jest) to path
ENV PATH /home/node/node_modules/.bin:$PATH

COPY --chown=node:node . .
