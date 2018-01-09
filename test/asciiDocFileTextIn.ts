import {TextIn, Transcript, Paragraph} from './types';
import * as fs from 'fs';

export class AsciiDocFileTextIn implements TextIn {

    src_base: string;

    constructor (src: string) {
        this.src_base = src;
    }
    
    public async getTranscript(id: string): Promise<Transcript> {
        
        // Reading the file
        const src = this.src_base + '/' + id
        console.log('File to read: ' + src);
        fs.readFile(src, 'utf8', (err, data) => {

            if (err) {
                console.log('Error reading the file!');
                throw err;

            }

            console.log('File readed!');
            //console.log('Data in the file: ');
            //console.log(data);

            // File analysis
            // -------------
            
            // 1. Break data into lines 
            let lines = data.split('\r\n');

            console.log('\n\nMock data splited:\n\n')
            for (let index in lines) {
                console.log(`Line ${(+index+1)}: ${lines[index]}`);
            }
            
            // 2. Looking for patterns
            for (let line of lines) {
                // To do: Analyze lines and look for special characters. Then, nest the content into pre-defined types.
                
                // WARNING -> Not to use low level conversion: Use asciidoctor.js => https://github.com/asciidoctor/asciidoctor.js/blob/master/manual.adoc

            }

            
        
         });

        // Provisional
        const paragraph: Paragraph = {
            kind: 'paragraph',
            text: [],
        };
        
        const transcript: Transcript = {
            segments: [
                paragraph,
            ]
        };
        return transcript;
        
    }

}