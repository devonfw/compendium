import { Cookie, Cookies, Credentials } from '../../src/types';

export const isConfluenceTest = false;

// Cookies
// -------

const brandNewDayProdCookie: Cookie = {
  name: 'brandNewDayProd',
  value: '',
};

export const COOKIES_TEST: Cookies = [brandNewDayProdCookie];
