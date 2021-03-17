import VersionService from './VersionService';

describe('VersionService', () => {

  it('returns commit hash', () => {
    const versionService = new VersionService();
    expect(versionService.commitHash).toBe('test commit hash');
  });
});
