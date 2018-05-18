import { ConfluenceService, Cookies, Credentials, Cookie } from './types';
import * as request from 'superagent';

export class ConfluenceServiceImpl implements ConfluenceService {
  /**
   * get the content json in Confluences by the cookies
   * @param {string} URL
   * @param {Cookies} cookies
   * @returns {Promise<JSON>}
   * @memberof ConfluenceServiceImpl
   */
  public getContentbyCookies(URL: string, cookies: Cookies): Promise<JSON> {
    return new Promise<JSON>((resolve, reject) => {
      const serializedCookies = this.serializeCookies(cookies);
      console.log(serializedCookies);

      request
        .get(URL)
        .type('application/json')
        .set('Cookie', serializedCookies)
        .end((err, res) => {
          if (err) {
            reject(err.message);
          } else if (
            res &&
            res.ok &&
            res.body &&
            res.header['content-type'] === 'application/json'
          ) {
            resolve(res.body);
          } else {
            reject(
              new Error(
                "It's not possible to get info from '" +
                  URL +
                  "'" +
                  '. Make sure you have authorization.',
              ),
            );
          }
        });
    });
  }
  /**
   * get the content json in confluence by credentials
   * @param {string} URL
   * @param {Credentials} credentials
   * @returns {Promise<JSON>}
   * @memberof ConfluenceServiceImpl
   */
  public getContentbyCredentials(
    URL: string,
    credentials: Credentials,
  ): Promise<JSON> {
    return new Promise<JSON>((resolve, reject) => {
      request
        .get(URL)
        .type('application/json')
        .auth(credentials.username, credentials.password)
        .end((err: any, res: any) => {
          if (err) {
            reject(err.message);
          } else if (
            res &&
            res.statusCode === 200 &&
            res.body &&
            res.header['content-type'] === 'application/json'
          ) {
            resolve(res.body);
          } else {
            reject(
              new Error(
                "It's not possible to get info from '" +
                  URL +
                  "'" +
                  '. Make sure you have authorization.',
              ),
            );
          }
        });
    });
  }
  /**
   * serializeCookies
   * Serelized the cookies received
   * @private
   * @param {Cookies} cookies
   * @returns {string}
   * @memberof ConfluenceServiceImpl
   */
  private serializeCookies(cookies: Cookies): string {
    let out = '';
    for (const myCookie of cookies) {
      out += `${myCookie.name}=${myCookie.value};`;
    }
    if (out.length > 0) {
      out = out.substring(0, out.length - 1);
    }
    return out;
  }
  /**
   * get Content json from any kind of auth
   * @public
   * @param {Cookies|Credentials} auth
   * @returns {JSON}
   * @memberof ConfluenceServiceImpl
   */
  public async getContent(
    URL: string,
    auth: Cookies | Credentials,
  ): Promise<JSON> {
    //if the authoritazion are cookies
    if ((auth as Cookies)[0]) {
      return await this.getContentbyCookies(URL, auth as Cookies);
      //if the auth are Credentials
    } else if ((auth as Credentials).username) {
      return await this.getContentbyCredentials(URL, auth as Credentials);
    } else {
      throw new Error('Cookies or Credentials must be included');
    }
  }
  /**
   * get the content type image (buffer) in Confluences by the cookies
   * @param {string} URL
   * @param {Cookies} cookies
   * @returns {Promise<Buffer>}
   * @memberof ConfluenceServiceImpl
   */
  public getImagebyCookies(URL: string, cookies: Cookies): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const serializedCookies = this.serializeCookies(cookies);
      request
        .get(URL)
        .set('Cookie', serializedCookies)
        .end((err, res) => {
          if (err) {
            reject(err.message);
          } else if (res && res.ok && res.body) {
            resolve(res.body);
          } else {
            const erinfo = new Error(
              "It's not possible to get info from '" +
                URL +
                "'" +
                '. Make sure you have authorization.',
            );
            reject(erinfo);
          }
        });
    });
  }
  /**
   * get the content type image buffer in confluence by credentials
   * @param {string} URL
   * @param {Credentials} credentials
   * @returns {Promise<JSON>}
   * @memberof ConfluenceServiceImpl
   */
  public getImagebyCredentials(
    URL: string,
    credentials: Credentials,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      request
        .get(URL)
        .auth(credentials.username, credentials.password)
        .end((err: any, res: any) => {
          if (err) {
            reject(err.message);
          } else if (res && res.statusCode === 200 && res.body) {
            resolve(res.body);
          } else {
            reject(
              new Error(
                "It's not possible to get info from '" +
                  URL +
                  "'" +
                  '. Make sure you have authorization.',
              ),
            );
          }
        });
    });
  }
  /**
   * calls the other methods of get image buffer with the specific authoritazion
   * @public
   * @param {Cookies|Credentials} auth
   * @returns {JSON}
   * @memberof ConfluenceServiceImpl
   */
  public async getImage(
    URL: string,
    auth: Cookies | Credentials,
  ): Promise<Buffer> {
    //if the authoritazion are cookies
    if ((auth as Cookies)[0]) {
      return await this.getImagebyCookies(URL, auth as Cookies);
      //if the auth are Credentials
    } else if ((auth as Credentials).username) {
      return await this.getImagebyCredentials(URL, auth as Credentials);
    } else {
      throw new Error('Cookies or Credentials must be included');
    }
  }
  /**
   * get the session cookie in confluence by credentials
   * @param {string} URL
   * @param {Credentials} credentials
   * @returns {Promise<Cookies>}
   * @memberof ConfluenceServiceImpl
   */
  public getSessionCookiesByCredentials(
    URLlogin: string,
    credentials: Credentials,
  ): Promise<Cookies> {
    return new Promise<Cookies>((resolve, reject) => {
      let cookies: Cookies = [];
      let cookie: Cookie;
      request
        .post(URLlogin)
        .type('application/json')
        .auth(credentials.username, credentials.password)
        .end((err: any, res: any) => {
          if (err) {
            reject(err.message);
          } else if (res) {
            //get cookie
            let aux = res.get('set-cookie');
            cookies = this.buildingCookie(aux);
            //filter error if is empty
            if (cookies.length < 1)
              reject(
                new Error(
                  'There is no cookie available for the source ' + URLlogin,
                ),
              );
            resolve(cookies);
          } else {
            //response is empty
            reject(
              new Error(
                "It's not possible to get the cookie from '" +
                  URLlogin +
                  "'" +
                  '. Make sure you have authorization.',
              ),
            );
          }
        });
    });
  }
  /*
  *Transform JSON response set-cookies into Cookie Object
  * 
  * */
  public buildingCookie(response: JSON): Cookies {
    let cookies: Cookies = [];
    const parsed_content = JSON.parse(JSON.stringify(response));
    console.log(parsed_content);

    let arrayItem = parsed_content[0].split(';');
    //only the first is the cookie
    let arraySubItem = arrayItem[0].split('=');
    let cookie: Cookie = { name: arraySubItem[0], value: '' };
    if (arraySubItem.length > 0) cookie.value = arraySubItem[1];
    cookies.push(cookie);
    console.log(cookie);

    return cookies;
  }
}
