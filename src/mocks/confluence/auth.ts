import { Cookie, Cookies, Credentials } from './../../types';

export const isConfluenceTest = false;

// Cookies
// -------

const brandNewDayProd = 'AQIC5wM2LY4SfcwFZc9dcx9OLQwZYnXD8-krxs93LwqZUQs.*AAJTSQACMDMAAlNLABM2NDAzOTYwODAzNTM0OTcxMTE1AAJTMQACMDE.*';
const brandNewDayProdCookie: Cookie = { name: 'brandNewDayProd', value: brandNewDayProd };

// const SESSIONID = 'AQIC5wM2LY4Sfcxsr_XVr_eCtJLWlFNwUU3n3mjHrBkqEpk.*AAJTSQACMDMAAlNLABQtNjMwMzU1NDgwOTg0MDg1OTMwNQACUzEAAjAy*';
// const SESIONIDCookie: Cookie = { name: 'SESSIONID', value: SESSIONID };

export const COOKIES_TEST: Cookies = [brandNewDayProdCookie];
// export const COOKIES_TEST_EXTRA: Cookies = [brandNewDayProdCookie, SESIONIDCookie];