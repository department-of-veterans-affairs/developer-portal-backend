import * as http from 'http';
import configureApp from './app';
import { bakedEnv } from './generated/baked-env';

const app = configureApp();
const server: http.Server = new http.Server(app);
const PORT = process.env.PORT || 9999;

server.listen(PORT);

server.on('error', (e: Error) => {
  console.log('Error starting server' + JSON.stringify(e));
});

const commitHash = bakedEnv.NODE_APP_COMMIT_HASH ?? 'undefined';
const version = bakedEnv.NODE_APP_VERSION ?? 'undefined;

server.on('listening', () => {
  console.log(
    `Server started on port ${PORT} with version ${version} and hash ${commitHash}`,
  );
});
