import sys

# s = input('Enter the string')
if len(sys.argv)!=2:
    sys.stderr.write("Invalid")
    exit()

s=sys.argv[1]

if s=="":
    print("Empty")
    exit()
    
if not (s.isalpha()):
    sys.stderr.write("Invalid")
    exit()

s=s.lower()  
counts={}

for char in s:
    if (char in counts):
        counts[char]+=1
    else:
        counts[char]=1
        
def fact(n):
    if n==1:
        return 1
    return n*fact(n-1)

denom=1
for count in counts.values():
    denom=denom*fact(count)

anagrams= int(fact(len(s))/denom)
print(anagrams)