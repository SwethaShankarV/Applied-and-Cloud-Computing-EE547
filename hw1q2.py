from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import datetime
import math
from urllib.parse import urlparse

no_of_errors=0
no_of_reqs=0

def anagrams(s):
    if not s or not s.isalpha():
        return 0
    
    s=s.lower()
    counts={}

    for char in s:
        if (char in counts):
            counts[char]+=1
        else:
            counts[char]=1

    denom=1
    for count in counts.values():
        denom=denom* math.factorial(count)
    unique=math.factorial(len(s))//denom

    return unique

class CustomHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        global no_of_errors, no_of_reqs
        no_of_reqs+=1

        if self.path== '/ping':
            self.send_response(204)
            self.end_headers()

        elif self.path=='/secret':
            if os.path.exists("/tmp/secret.key"):
                self.send_response(200)
                self.end_headers()
                with open('/tmp/secret.key', 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
                no_of_errors+=1

        elif self.path=='/status':
            response={
                "time": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "req": no_of_reqs,
                "err": no_of_errors
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

        elif self.path.startswith('/anagram'):

            if '?' in self.path:
                query= self.path.split('?')[1]
                if 'p=' in query:
                    string =query.split('p=')[1]
                else:
                    string=""
                
                if not string or not string.isalpha():
                    self.send_response(400)
                    self.end_headers()
                    no_of_errors+=1
                    return
            
            count= anagrams(string)
            body={
                "p": string,
                "total": str(count) # NOTE: string type
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
            # self.wfile.write(b"Page not found error")
            no_of_errors+=1

if __name__ =="__main__":
    httpd = HTTPServer(("", 8088), CustomHandler)
    httpd.serve_forever()   