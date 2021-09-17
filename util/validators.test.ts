import 'jest';
import { emailValidator, validatePhoneFormat } from './validators';

describe('validatePhoneFormat', () => {
  const errorString =
    'phone number format invalid. Valid format examples: 222-333-4444, (222) 333-4444, 2223334444';
  it('allows valid phone formats', () => {
    expect(validatePhoneFormat('222-333-4444')).toBe('222-333-4444');
    expect(validatePhoneFormat('(222) 333 4444')).toBe('(222) 333 4444');
    expect(validatePhoneFormat('222.333.4444')).toBe('222.333.4444');
    expect(validatePhoneFormat('(222) 333 4444')).toBe('(222) 333 4444');
    expect(validatePhoneFormat('(222) 333-4444')).toBe('(222) 333-4444');
    expect(validatePhoneFormat('222.333.4444x5')).toBe('222.333.4444x5');
    expect(validatePhoneFormat('222.333.4444x12')).toBe('222.333.4444x12');
    expect(validatePhoneFormat('222.333.4444x123')).toBe('222.333.4444x123');
    expect(validatePhoneFormat('222.333.4444x1234')).toBe('222.333.4444x1234');
    expect(validatePhoneFormat('222.333.4444x12345')).toBe('222.333.4444x12345');
    expect(validatePhoneFormat('222.333.4444x123456')).toBe('222.333.4444x123456');
    expect(validatePhoneFormat('222.333.4444 (extension 1234)')).toBe(
      '222.333.4444 (extension 1234)',
    );
    expect(validatePhoneFormat('222.333.4444 (ext.1234)')).toBe('222.333.4444 (ext.1234)');
    expect(validatePhoneFormat('222.333.4444 ext.1234')).toBe('222.333.4444 ext.1234');
  });
  it('throws an error when passed an invalid phone format', () => {
    expect(() => {
      // phone numbers can't start with 1 in the US
      validatePhoneFormat('111.222.333');
    }).toThrowError(errorString);
    expect(() => {
      // must consist solely of digits
      validatePhoneFormat('notaphonenumber');
    }).toThrowError(errorString);
    expect(() => {
      // extension can be a max of 6 digits
      validatePhoneFormat('222-333-4444x1234567');
    }).toThrowError(errorString);
    expect(() => {
      // must be 10 digits (not counting delimiters && extension)
      validatePhoneFormat('222-333-44');
    }).toThrowError(errorString);
  });
  it("doesn't allow for international numbers", () => {
    expect(() => {
      validatePhoneFormat('8 601 12345');
    }).toThrowError(errorString);
    expect(() => {
      validatePhoneFormat('020 1234 1234');
    }).toThrowError(errorString);
  });
});

describe('emailValidator', () => {
  it('allows valid emails', () => {
    expect(emailValidator('jim@companyname.com')).toBe('jim@companyname.com');
    expect(emailValidator('dave@google.com')).toBe('dave@google.com');
    expect(emailValidator('john.stamos@oddball.io')).toBe('john.stamos@oddball.io');
  });
  it('throws an error when passed an email with common fake substrings', () => {
    const errorString = 'Email is not valid. Please check that a real email has been submitted';
    expect(() => {
      emailValidator('text@test.com');
    }).toThrowError(errorString);
    expect(() => {
      emailValidator('sample@google.com');
    }).toThrowError(errorString);
    expect(() => {
      emailValidator('fake@fake.com');
    }).toThrowError(errorString);
    expect(() => {
      emailValidator('jim@email.com');
    }).toThrowError(errorString);
  });
});
