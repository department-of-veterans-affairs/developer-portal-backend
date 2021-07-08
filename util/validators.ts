import { API_LIST } from '../config/apis';

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
