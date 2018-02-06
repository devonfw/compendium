import { ConfluenceService, Cookies } from "../types";


export class ConfluenceServiceImpl implements ConfluenceService {
    
    getContent(URL: string, cookies: Cookies): Promise<JSON> {
    
        const promise = new Promise<JSON>((resolve, reject) => {
            
            const request = require('superagent');

            const serializedCookies = this.serializeCookies(cookies);

            request
                .get(URL)
                .type('application/json')
                .set('Cookie', serializedCookies)
                .end((err: any, res: any) => {
                
                    if (err) {
                        
                        console.log('!');
                        console.log(err.message);
                        // Something was wrong with the request
                        reject(err.message); 

                    } else if (res && res.statusCode == 200 && res.headers['content-type'] === 'application/json' && res.body) {

                        // console.log('Response from confluenceService:');
                        // console.log(res);
                        // console.log(JSON.stringify(res.body));
                        resolve(res.body);
    
                    } else {

                        // Something went wrong with the received data. If the there are problems with authentication, a html-content/type response is given.
                        reject(new Error('It\'s not possible to get info from \'' + URL + '\'' + '. Make sure you have authorization.')); 
                    }        
            });

        });

        return promise;
    }

    private serializeCookies(cookies: Cookies): string {

        let out = '';
        for (let myCookie of cookies) {
            out += `${myCookie.name}=${myCookie.value};`;
        }
        if (out.length > 0) {
            out = out.substring(0, out.length - 1);
        }

        return out;
    }
 
}
