import { Cookie, Cookies, Credentials } from '../../src/types';

export const isConfluenceTest = false;

// Cookies
// -------

const brandNewDayProd =
  'AQIC5wM2LY4SfcwsGPSJS8vqDuBKe8z9OPppAJVebkf7qJg.*AAJTSQACMDMAAlNLABM3NzU4MjE2ODQ3NTg3MDI2NzA4AAJTMQACMDI.*';
const brandNewDayProdCookie: Cookie = {
  name: 'brandNewDayProd',
  value: brandNewDayProd,
};

export const COOKIES_TEST: Cookies = [brandNewDayProdCookie];
