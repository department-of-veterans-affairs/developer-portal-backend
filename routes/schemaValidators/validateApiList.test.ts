import 'jest';
import validateApiList from './validateApiList';

describe('validateApiList', () => {
  it('allows supported api values', () => {
    const apis = 'benefits';
    const result = validateApiList(apis);
    expect(result).toEqual(apis);
  });

  it('supports comma separated api values', () => {
    const apis = 'benefits,communityCare';
    const result = validateApiList(apis);
    expect(result).toEqual(apis);
  });

  it('only allows supported api values', () => {
    const apis = 'benefits,horsies';
    expect(() => validateApiList(apis)).toThrow('invalid apis in list');
  });

  it('throws error when unable to process the list', () => {
    const apis = 123 as unknown as string;
    expect(() => validateApiList(apis))
      .toThrow('it was unable to process the provided data');
  });
});