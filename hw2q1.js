const http =require('http');
const url= require('url');
const fs=require('fs');

let no_of_errors=0;
let no_of_reqs=0;

function anagrams(s){
    if (!s || !/^[a-zA-Z]+$/.test(s)){
        return 0;
    }
        
    s=s.toLowerCase();
    const counts={};

    for (let char of s){
        counts[char]= (counts[char] || 0)+1;
    }

    let denom=1;
    for (let count of Object.values(counts)){
        denom*= factorial(count);
    }
    const unique= factorial(s.length)/denom;

    return unique
}

function factorial(n){
    let fact=1;
    for(let i=2; i<=n; i++){
        fact*=i;
    }
    return fact;
}

const server= http.createServer((request, response)=>{
    no_of_reqs++;

    const parsedUrl= url.parse(request.url, true);
    const query= parsedUrl.query;
    const path= parsedUrl.pathname;

    if (path== '/ping'){
        response.writeHead(204);
        response.end();
    }

    else if(path=='/secret'){
        fs.readFile("/tmp/secret.key", 'utf8', (error, data)=>{
            if(error){
                response.writeHead(404);
                response.end();
                no_of_errors++;
            }
            else{
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(data);
            }
        });
    }

    else if (path=='/status'){
        const statusResponse={
            time: new Date().toISOString(),
            request: no_of_reqs,
            error: no_of_errors
        };
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(statusResponse));
    }

    else if (path.startsWith('/anagram')){
        const string= query.p|| '';
        if (!string || !/^[a-zA-Z]+$/.test(string)){
            response.writeHead(400);
            response.end();
            no_of_errors++;
        }
        else{
            const count=anagrams(string);
            const result={
                p:string,
                total: String(count)
            };
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(result));
        }
    }
        
    else {
    response.writeHead(404);
    response.end();
    no_of_errors++;
    }
});

server.listen(8088, ()=>{
    console.log('server is listening on port 8088');
});
    