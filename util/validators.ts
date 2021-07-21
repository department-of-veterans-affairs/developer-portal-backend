import { API_LIST } from '../config/apis';
// disabling because eslint acts weird with literals in regex patterns

/* eslint-disable no-useless-escape */
/* Matches for all valid NANP phone formats.
 The following formats are valid:
 222-333-4444
 222.333.4444
 (222) 333 4444
 (222) 333-4444
 222.333.4444x555555
 222 222 2222 (ext.1234)
 222 222 2222 (extension 1234)
*/
const VALID_PHONE_REGEX = /^(?:\([2-9]\d{2}\)\ ?|[2-9]\d{2}(?:\-?|\ ?|\.?))[2-9]\d{2}[- .]?\d{4}((\ )?(\()?(ext|x|extension)([- .:])?\d{1,6}(\))?)?$/;

export function validateApiList(val: string): string {
  let result: boolean;
  try {
    const apis = val.split(',');
    result = apis.every(api => API_LIST.includes(api));
  } catch {
    throw new Error('it was unable to process the provided data');
  }

  if (!result) {
    throw new Error('invalid apis in list');
  }

  return val;
}

export function validatePhoneFormat(number: string): string {
  let result: boolean;
  try {
    result = VALID_PHONE_REGEX.test(number);
  } catch {
    throw new Error('it was unable to process the provided data');
  }

  if (!result) {
    throw new Error('phone number format invalid. Valid format examples: 222-333-4444, (222) 333-4444, 2223334444');
  }

  return number;

}

export function emailValidator(email: string): string {
  let result: boolean;
  // any email that matches this pattern is most likely fake.
  // IE: 'test@email.com', 'email@fake.com', etc
  const pattern = /test|sample|fake|email/i;
  try {
    result = pattern.test(email);
  } catch {
    throw new Error('it was unable to process the provided data');
  }

  if (result) {
    throw new Error('Email is not valid. Please check that a real email has been submitted');
  }

  return email;
}
