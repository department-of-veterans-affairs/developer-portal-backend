export class DevPortalError extends Error {
  action = '';

  constructor(message: string) {
    super(message);
  }
}
