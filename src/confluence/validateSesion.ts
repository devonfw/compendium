import { Cookies, Cookie } from "../types";

export async function validateSesionCORP(cookies: Cookies): Promise<boolean> {

    const promise = new Promise<boolean>((resolve, reject) => {

        // I. Cookie value
        let brandNewDayProd_cookie: Cookie = { name: 'brandNewDayProd', value: ''};

        for (let cookie of cookies) {
            if (cookie.name === brandNewDayProd_cookie.name) {
                brandNewDayProd_cookie.value = cookie.value;
            }
        }

        if (brandNewDayProd_cookie.value === '') {
            resolve (false);
        }
        
        // II. Server request
        const request = require('superagent');

        const url = `https://signincorp.capgemini.com/opensso/json/sessions/${brandNewDayProd_cookie.value}?_action=validate`;
        // console.log(url);
        
        request
            .post(url)
            .type('application/json')
            .end((err: any, res: any) => {       
                if (res && res.statusCode == 200 ) {
                    //console.log('Response from validateSesionCORP');
                    //console.log(JSON.stringify(res.body));
                    resolve(res.body.valid);
                } else {
                    reject(err);
                }   
            });
  
    });
    
    return promise;
}
