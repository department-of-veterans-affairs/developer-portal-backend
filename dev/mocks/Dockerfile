FROM node:latest
WORKDIR /home/node
COPY package.json package-lock.json ./
RUN npm install
COPY json-mocks ./json-mocks/
EXPOSE 3001
ENTRYPOINT node json-mocks