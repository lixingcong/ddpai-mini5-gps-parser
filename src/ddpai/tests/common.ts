import * as fs from 'fs';
import * as crypto from 'crypto';

export {
    writeFile,
    readFile,
    isObjectEqual,
    md5sum
};

type WriteFileDoneCallback = (content: string) => void;

const writeFile = (path:string, content:string, callback:WriteFileDoneCallback|undefined) => {
    fs.writeFile(path, content, error => {
        let s = 'writeFile(' + path + '): ';

        if(error)
            s += 'Error: ' + error;
        else
            s += 'OK';

        console.log(s);

        if(!error && undefined != callback)
            callback(content);
    });
};

type ReadFileDoneCallback = (content:string) => void;

const readFile = (path:string, callback:ReadFileDoneCallback|undefined) => {
    fs.readFile(path, 'utf-8', (error, content) =>{
        let s = 'readFile(' + path + '): ';

        if(error)
            s += 'Error: ' + error;
        else
            s += 'OK';

        console.log(s);

        if(!error && undefined != callback)
            callback(content);
    });
};

const isObjectEqual = (a:object|undefined, b:object|undefined) => {
    return JSON.stringify(a) === JSON.stringify(b);
};

const md5sum = (str:string) => crypto.createHash('md5').update(str).digest('hex');