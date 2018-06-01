import * as request from 'request';
import { CookieJar, Cookie } from 'tough-cookie';

/**
 * @author msanjuan
 * Api to access capgemini SSO with Credentials
 * translated from Java conector project @author pajimene
 */

let escapeHtml = require('escape-html');
//TO DEBUG
//require('request-debug')(request);

export class ConnectorApi {
  private username: string;
  private password: string;
  private host: string;
  private cookies: Cookie[] = [];

  public constructor(username: string, password: string, host: string) {
    this.username = username;
    this.password = password;
    this.host = host;
  }

  //API METHOD
  public async connect(): Promise<string> {
    //first request
    let body: string;
    try {
      body = await this.firstRequest();
    } catch (error) {
      throw error;
    }
    console.log('Second Request OK');

    //params for the second request
    let objectForm = [
      { name: 'IDToken0', value: '' },
      {
        name: 'IDToken1',
        value: this.username,
      },
      {
        name: 'IDToken2',
        value: this.password,
      },
      {
        name: 'IDButton',
        value: 'Submit',
      },
      {
        name: 'goto',
        value: this.extractValueFromTag(body, 'goto'),
      },
      {
        name: 'gotoOnFail',
        value: this.extractValueFromTag(body, 'gotoOnFail'),
      },
      {
        name: 'encoded',
        value: this.extractValueFromTag(body, 'encoded'),
      },
      {
        name: 'gx_charset',
        value: this.extractValueFromTag(body, 'gx_charset'),
      },
      {
        name: 'SunQueryParamsString',
        value: this.extractValueFromTag(body, 'SunQueryParamsString'),
      },
    ];
    //second request
    return await this.secondRequest(objectForm);
  }

  //FIRST REQUEST
  private firstRequest(): Promise<string> {
    let jar = request.jar();
    //options
    let url: string =
      'https://signincorp.capgemini.com/opensso/UI/Login?service=intranetSequence&realm=/Capgemini&locale=en&goto=https%3A%2F%2Fsignincorp.capgemini.com%2Fopensso%2FWSFederationServlet%2FmetaAlias%2FCapgemini%2Fidpddwint%3Fwa%3Dwsignin1.0%26wtrealm%3Dhttps%253a%252f%252fddw-int.capgemini.com%253a443%252f%26wctx%3Dhttps%253a%252f%252fddw-int.capgemini.com%252fsites%252fGENI%252fStep66%252f_layouts%252f15%252fAuthenticate.aspx%253fSource%253d%25252Fsites%25252FGENI%25252FStep66%25252F';
    let options = {
      url: url,
      jar: jar,
      headers: {
        Authorization:
          'Negotiate TlRMTVNTUAABAAAAl4II4gAAAAAAAAAAAAAAAAAAAAAGAbEdAAAADw==',
      },
    };
    console.log('Executing first Request...');
    //request
    return new Promise<string>((resolve, reject) => {
      request.get(options, (error, response, body) => {
        if (error) {
          reject(error.message);
        }
        if (response && response.statusCode === 200) {
          //save the cookie for 2nd request
          this.cookies = jar.getCookies(url);
          resolve(response.body);
        } else {
          reject('error when requesting ' + URL);
        }
        resolve('');
      });
    });
  }

  //SECOND REQUEST
  private secondRequest(params: any): Promise<string> {
    //url
    let url: string = 'https://signincorp.capgemini.com/opensso/UI/Login';
    //get cookies ready
    let cookiesHar = this.cookies.map((item: Cookie) => {
      let cookieString: string = item.cookieString();
      let arrayAux = cookieString.split('=');
      let name = arrayAux[0];
      let value = arrayAux[1];
      let cookie1 = {
        name: name,
        value: value,
        path: item.path,
        domain: item.domain,
        httpOnly: item.httpOnly,
        secure: item.secure,
      };
      return cookie1;
    });

    console.log('Executing second Request...');
    //request
    return new Promise<any>((resolve, reject) => {
      request(
        {
          har: {
            url: url,
            method: 'POST',
            postData: {
              mimeType: 'application/x-www-form-urlencoded',
              params: params,
            },
            headers: [
              { name: 'host', value: 'signincorp.capgemini.com' },
              { name: 'connection', value: 'keep-alive' },
              { name: 'Upgrade-Insecure-Requests', value: '1' },
              {
                name: 'Content-Type',
                value: 'application/x-www-form-urlencoded',
              },
              {
                name: 'User-Agent',
                value:
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
              },
              {
                name: 'Accept',
                value:
                  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
              },
              { name: 'Accept-Encoding', value: 'gzip, deflate, br' },
              {
                name: 'Accept-Language',
                value: 'en-US,en;q=0.9,es;q=0.8',
              },
            ],
            cookies: cookiesHar,
          },

          uri: url,
          method: 'POST',
        },
        (error, response) => {
          if (error) {
            reject(error.message);
          }
          resolve(response.headers['set-cookie']);
        },
      );
    });
  }

  //auxiliar method of First Request
  private extractValueFromTag(html: string, tag: string): string {
    const tagIndex = html.indexOf('name="' + tag + '"');
    if (tagIndex <= 0) return 'null';
    const beginIndex: number =
      html.indexOf('value="', tagIndex) + 'index="'.length;
    const endIndex: number = html.indexOf('"', beginIndex);
    if (endIndex < beginIndex) return 'null';
    return escapeHtml.escapeHtml(html.substring(beginIndex, endIndex));
  }
}
