import * as http from 'http';
import configureApp from './app';
import { getBakedEnv } from './generated/baked-env';

const app = configureApp();
const server: http.Server = new http.Server(app);
const PORT = process.env.PORT || 9999;

server.listen(PORT);

server.on('error', (e: Error) => {
  console.log('Error starting server' + JSON.stringify(e));
});

const commitHash = getBakedEnv('NODE_APP_COMMIT_HASH') ?? 'undefined';

server.on('listening', () => {
  console.log(
    `Server started on port ${PORT} with commit hash '${commitHash}'`,
  );
});
