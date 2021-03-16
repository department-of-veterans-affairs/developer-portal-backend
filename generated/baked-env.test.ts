import { getBakedEnv } from './baked-env';

describe('get baked env', () => {
  it ('returns undefined for variables that are not defined', () => {
    expect(getBakedEnv('SOME_VAL_THAT_DOES_NOT_EXIST')).toBeUndefined();
  });

  it('returns the correct value for variables that are defined', () => {
    expect(getBakedEnv('NODE_APP_COMMIT_HASH')).toBe('test commit hash');
  });
});
