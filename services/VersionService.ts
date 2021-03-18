export default class VersionService {

  get commitHash(): string {
    // COMMIT_HASH is an environment variable that is built into the docker image
    // Anytime we deploy the docker image the same value is present for COMMIT_HASH
    return process.env.COMMIT_HASH ?? 'undefined';
  }
}