import { ConfluenceService, Cookies, Credentials } from './types';
import * as request from 'superagent';

export class ConfluenceServiceImpl implements ConfluenceService {
/**
 * getContentbyCookies
 * get the content in Confluences by the cookies
 * @param {string} URL
 * @param {Cookies} cookies
 * @returns {Promise<JSON>}
 * @memberof ConfluenceServiceImpl
 */
public getContentbyCookies(URL: string, cookies: Cookies): Promise<JSON> {

        return new Promise<JSON>((resolve, reject) => {

            const serializedCookies = this.serializeCookies(cookies);

            request
                .get(URL)
                .type('application/json')
                .set('Cookie', serializedCookies)
                .end((err, res) => {
                    if (err) {
                        reject(err.message);
                    } else if (res && res.ok && res.header['content-type'] === 'application/json' && res.body) {
                        resolve(res.body);
                    } else {
                        const erinfo = new Error('It\'s not possible to get info from \'' + URL + '\'' + '. Make sure you have authorization.');
                        reject(erinfo);
                    }
                });
        });
    }
/**
 * getContentbyCredentials
 * get the content in confluence by credentials
 * @param {string} URL
 * @param {Credentials} credentials
 * @returns {Promise<JSON>}
 * @memberof ConfluenceServiceImpl
 */
public getContentbyCredentials(URL: string, credentials: Credentials): Promise<JSON> {

        return new Promise<JSON>((resolve, reject) => {

            request
                .get(URL)
                .type('application/json')
                .auth(credentials.username, credentials.password)
                .end((err: any, res: any) => {
                    if (err) {
                        reject(err.message);
                    } else if (res && res.statusCode === 200 && res.headers['content-type'] === 'application/json' && res.body) {
                        resolve(res.body);
                    } else {
                        reject(new Error('It\'s not possible to get info from \'' + URL + '\'' + '. Make sure you have authorization.'));
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

}