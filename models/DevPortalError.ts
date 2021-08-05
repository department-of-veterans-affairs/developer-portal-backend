/* eslint-disable no-useless-constructor */

export class DevPortalError extends Error {
  public action: string = '';

  public constructor(message: string) {
    super(message);
  }
}
