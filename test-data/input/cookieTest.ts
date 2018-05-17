import { Cookie, Cookies, Credentials } from '../../src/types';

export const isConfluenceTest = true;

// Cookies
// -------

const brandNewDayProd =
  'AQIC5wM2LY4Sfcwip_JJiv-jgbFce6cfPMIFUMNFMv4wPUE.*AAJTSQACMDMAAlNLABQtMjc0NzExMzU0Njk3MDgzMTQ2MgACUzEAAjAx*';
const brandNewDayProdCookie: Cookie = {
  name: 'brandNewDayProd',
  value: brandNewDayProd,
};

export const COOKIES_TEST: Cookies = [brandNewDayProdCookie];
