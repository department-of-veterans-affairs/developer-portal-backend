FROM vasdvp/lighthouse-node-application-base:node12

WORKDIR /home/node

# Install app dependencies in a separate layer from source code, as these will change less often
COPY --chown=node:node package*.json ./
RUN npm install && npm cache clean --force

# Add node module binaries (like jest) to path
ENV PATH /opt/app/node_modules/.bin:$PATH

COPY --chown=node:node . .
