# P64 OneMap Enumeration Feasibility

## Root Guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Repository State

```text
f98beac docs: record OSM postcode coverage measurement
75129e4 fix: summarize stale freshness source keys
8752851 fix: name stale source categories in title card
20d4ecf fix: disclose source freshness in title card
```

## Credential Check

Command:

```text
@('ONEMAP_EMAIL','ONEMAP_PASSWORD','ONEMAP_TOKEN','ONEMAP_ACCESS_TOKEN') | ForEach-Object { if ([Environment]::GetEnvironmentVariable($_)) { "$($_)=present" } else { "$($_)=missing" } }
```

Output:

```text
ONEMAP_EMAIL=missing
ONEMAP_PASSWORD=missing
ONEMAP_TOKEN=missing
ONEMAP_ACCESS_TOKEN=missing
```

## Existing Project Use

Project code uses OneMap Search as bounded candidate geocoding, not source enumeration:

```text
C:\sgSHIOK2026\pipeline\geocode_universe.py:25:SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search"
C:\sgSHIOK2026\pipeline\geocode_universe.py:159:def fetch_onemap_postal(postal: str, client: httpx.Client) -> dict[str, Any]:
C:\sgSHIOK2026\pipeline\geocode_universe.py:164:            "searchVal": postal,
C:\sgSHIOK2026\pipeline\geocode_universe.py:167:            "pageNum": "1",
```

## Official Documentation Bundle Inspection

Command:

```text
uv run python - <<'PY'
from __future__ import annotations
import httpx
import re
url='https://www.onemap.gov.sg/apidocs/static/js/main.4c62b5c1.js'
r=httpx.get(url, timeout=60.0)
print(f'url={url}')
print(f'status_code={r.status_code}')
print(f'bytes={len(r.content)}')
text=r.text
for needle in ['token-based authentication', 'searchVal', 'returnGeom', 'getAddrDetails', 'pageNum', 'valid for 3 days', 'every 72 hours']:
    print(f'--- needle={needle} ---')
    for m in list(re.finditer(re.escape(needle), text, re.IGNORECASE))[:2]:
        start=max(0, m.start()-260)
        end=min(len(text), m.end()+500)
        snippet=text[start:end]
        print(snippet.replace('\\n',' ')[:1200])
PY
```

Output:

```text
url=https://www.onemap.gov.sg/apidocs/static/js/main.4c62b5c1.js
status_code=200
bytes=1315298
--- needle=token-based authentication ---
,{className:"om-api-updates",children:[(0,yi.jsx)("div",{className:"gradient-banner"}),(0,yi.jsxs)("div",{className:"om-api-text",children:[(0,yi.jsx)("b",{style:{color:"#F5333F"},children:"IMPORTANT:"}),(0,yi.jsx)("b",{children:" Search API"})," now requires token-based authentication. ",(0,yi.jsx)("a",{href:"/apidocs/register",children:"Register your token to ensure uninterrupted service."})]})]}),(0,yi.jsx)("div",{className:"pageBase",children:(0,yi.jsx)("div",{className:"om-container-fluid-padding",children:(0,yi.jsx)(Ob,{})})})]})}),Yb=()=>(0,yi.jsx)(yi.Fragment,{children:(0,yi.jsx)("div",{className:"om-body-footer",children:(0,yi.jsx)("div",{className:"pageBase",children:(0,yi.jsx)("div",{className:"om-container-fluid-padding",children:(0,yi.jsxs)("div",{className:"om-f
,{className:"om-api-updates",children:[(0,yi.jsx)("div",{className:"gradient-banner"}),(0,yi.jsxs)("div",{className:"om-api-text",children:[(0,yi.jsx)("b",{style:{color:"#F5333F"},children:"IMPORTANT:"}),(0,yi.jsx)("b",{children:" Search API"})," now requires token-based authentication. ",(0,yi.jsx)("a",{href:"/apidocs/register",children:"Register your token to ensure uninterrupted service."})]})]})]}),cS=n.p+"static/media/advminimap.2fe8e7e8ed4923b2bb37.png",dS=n.p+"static/media/minimap.a34b1e0c1e16d19634b5.png",uS=n.p+"static/media/static_map_screenshot.b44837fb3610a46adcd8.png",hS=n.p+"static/media/city.cdc5236d396371b76a1e.jpg",pS=n.p+"static/media/Night.a2b27892892c41e18114.jpg",mS=n.p+"static/media/Grey.f39afa367bdea5ff05fc.jpg",fS=n.p+"static/media/classic.0759b9ddf585
--- needle=searchVal ---
getToken","sampleResponse":"{\   \"access_token\": \"***********************\",\   \"expiry_timestamp\": \"1689388144\"\ }"},{"page_section":"search","method":"GET","endpoint":"/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\   \"found\": 1,\   \"totalNumPages\": 1,\   \"pageNum\": 1,\   \"results\": [\     {\       \"SEARCHVAL\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"BLK_NO\": \"640\",\       \"ROAD_NAME\": \"ROWELL ROAD\",\       \"BUILDING\": \"NIL\",\       \"ADDRESS\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"POSTAL\": \"200640\",\       \"X\": \"30381.1007417506\",\       \"Y\"
/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\   \"found\": 1,\   \"totalNumPages\": 1,\   \"pageNum\": 1,\   \"results\": [\     {\       \"SEARCHVAL\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"BLK_NO\": \"640\",\       \"ROAD_NAME\": \"ROWELL ROAD\",\       \"BUILDING\": \"NIL\",\       \"ADDRESS\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"POSTAL\": \"200640\",\       \"X\": \"30381.1007417506\",\       \"Y\": \"32195.1006872542\",\       \"LATITUDE\": \"1.30743547948389\",\       \"LONGITUDE\": \"103.854713903431\"\     }\   ]\ }"},{"page_section":"revgeocodexy","method":"GET",
--- needle=returnGeom ---
Response":"{\   \"access_token\": \"***********************\",\   \"expiry_timestamp\": \"1689388144\"\ }"},{"page_section":"search","method":"GET","endpoint":"/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\   \"found\": 1,\   \"totalNumPages\": 1,\   \"pageNum\": 1,\   \"results\": [\     {\       \"SEARCHVAL\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"BLK_NO\": \"640\",\       \"ROAD_NAME\": \"ROWELL ROAD\",\       \"BUILDING\": \"NIL\",\       \"ADDRESS\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"POSTAL\": \"200640\",\       \"X\": \"30381.1007417506\",\       \"Y\": \"32195.1006872
quired"})]}),(0,yi.jsx)("div",{className:"om-search-desc",children:(0,yi.jsx)("p",{children:"Keywords entered by users to filter the results"})})]}),(0,yi.jsxs)("div",{className:"om-search-item",children:[(0,yi.jsxs)("div",{className:"label-method",children:["returnGeom",(0,yi.jsx)("span",{className:"label-type",children:"string"}),(0,yi.jsx)("span",{className:"label-required",children:"Required"})]}),(0,yi.jsx)("div",{className:"om-search-desc",children:(0,yi.jsx)("p",{children:"Values: Y, N . Enter Y if user wants the geometry value returned."})})]}),(0,yi.jsxs)("div",{className:"om-search-item",children:[(0,yi.jsxs)("div",{className:"label-method",children:["getAddrDetails",(0,yi.jsx)("span",{className:"label-type",children:"string"}),(0,yi.jsx)("span",{cla
--- needle=getAddrDetails ---
   \"access_token\": \"***********************\",\   \"expiry_timestamp\": \"1689388144\"\ }"},{"page_section":"search","method":"GET","endpoint":"/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\   \"found\": 1,\   \"totalNumPages\": 1,\   \"pageNum\": 1,\   \"results\": [\     {\       \"SEARCHVAL\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"BLK_NO\": \"640\",\       \"ROAD_NAME\": \"ROWELL ROAD\",\       \"BUILDING\": \"NIL\",\       \"ADDRESS\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"POSTAL\": \"200640\",\       \"X\": \"30381.1007417506\",\       \"Y\": \"32195.1006872542\",\       \
.jsx)("div",{className:"om-search-desc",children:(0,yi.jsx)("p",{children:"Values: Y, N . Enter Y if user wants the geometry value returned."})})]}),(0,yi.jsxs)("div",{className:"om-search-item",children:[(0,yi.jsxs)("div",{className:"label-method",children:["getAddrDetails",(0,yi.jsx)("span",{className:"label-type",children:"string"}),(0,yi.jsx)("span",{className:"label-required",children:"Required"})]}),(0,yi.jsx)("div",{className:"om-search-desc",children:(0,yi.jsx)("p",{children:"Values: Y, N . Enter Y if user wants address details returned."})})]}),(0,yi.jsxs)("div",{className:"om-search-item",children:[(0,yi.jsxs)("div",{className:"label-method",children:["pageNum",(0,yi.jsx)("span",{className:"label-type",children:"integer"})]}),(0,yi.jsx)("div",{className:
--- needle=pageNum ---
en\": \"***********************\",\   \"expiry_timestamp\": \"1689388144\"\ }"},{"page_section":"search","method":"GET","endpoint":"/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\   \"found\": 1,\   \"totalNumPages\": 1,\   \"pageNum\": 1,\   \"results\": [\     {\       \"SEARCHVAL\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"BLK_NO\": \"640\",\       \"ROAD_NAME\": \"ROWELL ROAD\",\       \"BUILDING\": \"NIL\",\       \"ADDRESS\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"POSTAL\": \"200640\",\       \"X\": \"30381.1007417506\",\       \"Y\": \"32195.1006872542\",\       \"LATITUDE
"},{"page_section":"search","method":"GET","endpoint":"/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\   \"found\": 1,\   \"totalNumPages\": 1,\   \"pageNum\": 1,\   \"results\": [\     {\       \"SEARCHVAL\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"BLK_NO\": \"640\",\       \"ROAD_NAME\": \"ROWELL ROAD\",\       \"BUILDING\": \"NIL\",\       \"ADDRESS\": \"640 ROWELL ROAD SINGAPORE 200640\",\       \"POSTAL\": \"200640\",\       \"X\": \"30381.1007417506\",\       \"Y\": \"32195.1006872542\",\       \"LATITUDE\": \"1.30743547948389\",\       \"LONGITUDE\": \"103.854713903431\"\     }\
--- needle=valid for 3 days ---
om-desc",children:["This API authenticates users' credentials (email and password) as a POST request body to generate an access token."," ",(0,yi.jsx)("i",{children:"The token is not required for the map services."})]}),(0,yi.jsx)("p",{children:"Each token is valid for 3 days. Its expiry timestamp is in UNIX format. When it expires, the user needs to re-authenticate with the same credentials. The token does not auto renew when it expires."}),(0,yi.jsx)("p",{children:(0,yi.jsx)("b",{children:"Developers are strongly encourage to securely store sensitive data such as API keys and passwords in your application. Do not pass the authentication data in plain text."})})]}),(0,yi.jsxs)("div",{className:"om-authentication-wrapper",children:[(0,yi.jsx)("div",{className:"om-au
",language:"javascript",theme:RE,wrapLines:!0,codeBlock:!0})}),(0,yi.jsx)("h4",{children:(0,yi.jsx)("b",{children:"Response (200 OK):"})}),(0,yi.jsx)("div",{class:"codeblock",children:(0,yi.jsx)(TE,{text:'{   "error": "Authentication token expired. Tokens is valid for 3 days. Please implement automatic renewal to ensure your token remains valid.",   "found": 0,   "totalNumPages": 0,   "pageNum": 0,   "results": [] }',className:"abc",language:"javascript",theme:RE,wrapLines:!0,codeBlock:!0})}),(0,yi.jsx)("h3",{style:{margin:"40px 0 20px 0"},children:"3. Invalid Token"}),(0,yi.jsx)("div",{class:"codeblock",children:(0,yi.jsx)(TE,{text:'async function testInvalidToken() {   try {     const response = await axios.get(       "https://www.onemap.gov.sg/api/common
--- needle=every 72 hours ---
)("div",{class:"col-md-10 offset-md-1",children:[(0,yi.jsx)("h1",{children:"Managing and Refreshing OneMap Token Validity in NodeJS"}),(0,yi.jsx)("p",{children:"The OneMap API requires a valid access token for each API request, and tokens need to be refreshed every 72 hours. This tutorial will guide you through the steps to properly authenticate and handle API requests in NodeJS. However the general principle and algorithm applied in this guide is also applicable to other platforms and programming languages."}),(0,yi.jsx)("p",{children:"The tutorial below is based on snippet built on Next.JS with a react frontend framework. We setup a middleware proxy which will take care of calling OneMap API and refreshing the token in a single location."}),(0,yi.jsx)("h3",{chil
xs)("div",{className:"col-md-8 col-12",children:[(0,yi.jsx)("h2",{children:"Managing and Refreshing OneMap Token Validity in NodeJS"}),(0,yi.jsx)("p",{children:"The OneMap API requires a valid access token for each API request, and tokens need to be refreshed every 72 hours. This tutorial will guide you through the steps to properly authenticate and handle API requests in NodeJS..."})]})]})})})]})})})})}),(0,yi.jsx)(Yb,{})]})]})};let JS=NA();jA.Ay.initialize(JS);const WS=()=>((0,t.useEffect)(()=>{jA.Ay.initialize(JS)},[]),(0,yi.jsx)(tn,{reCaptchaKey:"".concat("6Le-LMwsAAAAAMv_E960iBDhJ4PM0s_HUGA7e04g"),children:(0,yi.jsx)(ce,{children:(0,yi.jsx)(Ht,{basename:"/apidocs",children:(0,yi.jsxs)(It,{children:[(0,yi.jsx)(Ct,{path:"/",element:(0,yi.jsx)(DE,{})}),(0,yi.jsx
```

## Read-Only Search Probe

Command:

```text
uv run python - <<'PY'
from __future__ import annotations
import json
import time
import httpx
endpoint = 'https://www.onemap.gov.sg/api/common/elastic/search'
queries = [
    ('exact_missing_hdb_from_p19', {'searchVal':'521400','returnGeom':'Y','getAddrDetails':'Y','pageNum':'1'}),
    ('broad_singapore', {'searchVal':'Singapore','returnGeom':'Y','getAddrDetails':'Y','pageNum':'1'}),
    ('digit_1', {'searchVal':'1','returnGeom':'Y','getAddrDetails':'Y','pageNum':'1'}),
    ('empty', {'searchVal':'','returnGeom':'Y','getAddrDetails':'Y','pageNum':'1'}),
    ('asterisk', {'searchVal':'*','returnGeom':'Y','getAddrDetails':'Y','pageNum':'1'}),
]
headers={'User-Agent':'sgSHIOK2026-P64-onemap-enumeration-feasibility/1.0'}
with httpx.Client(timeout=30.0, follow_redirects=True, headers=headers) as client:
    for name, params in queries:
        print(f'--- {name} ---')
        start=time.perf_counter()
        try:
            r=client.get(endpoint, params=params)
            elapsed=time.perf_counter()-start
            print(f'url={r.url}')
            print(f'status_code={r.status_code}')
            print(f'elapsed_seconds={elapsed:.3f}')
            print(f'content_type={r.headers.get("content-type")}')
            print(f'response_bytes={len(r.content)}')
            text=r.text
            print('response_head=')
            print(text[:1200])
            try:
                payload=r.json()
            except Exception as exc:
                print(f'json_error={type(exc).__name__}: {exc}')
                continue
            if isinstance(payload, dict):
                print(f'keys={sorted(payload.keys())}')
                print(f'found={payload.get("found")} totalNumPages={payload.get("totalNumPages")} pageNum={payload.get("pageNum")} results_len={len(payload.get("results") or []) if isinstance(payload.get("results"), list) else "NA"}')
                if isinstance(payload.get('results'), list) and payload['results']:
                    sample = payload['results'][0]
                    if isinstance(sample, dict):
                        print('first_result_keys=' + ','.join(sorted(sample.keys())))
                        print('first_result_postal=' + str(sample.get('POSTAL')))
                        print('first_result_searchval=' + str(sample.get('SEARCHVAL'))[:200])
        except Exception as exc:
            print(f'error_type={type(exc).__name__}')
            print(f'error={exc}')
PY
```

Output:

```text
--- exact_missing_hdb_from_p19 ---
url=https://www.onemap.gov.sg/api/common/elastic/search?searchVal=521400&returnGeom=Y&getAddrDetails=Y&pageNum=1
status_code=200
elapsed_seconds=0.109
content_type=application/json
response_bytes=469
response_head=
{
  "found": 1,
  "totalNumPages": 1,
  "pageNum": 1,
  "results": [
    {
      "SEARCHVAL": "SUN PLAZA SPRING",
      "BLK_NO": "400A",
      "ROAD_NAME": "TAMPINES STREET 41",
      "BUILDING": "SUN PLAZA SPRING",
      "ADDRESS": "400A TAMPINES STREET 41 SUN PLAZA SPRING SINGAPORE 521400",
      "POSTAL": "521400",
      "X": "40933.2037706887",
      "Y": "37850.6498963386",
      "LATITUDE": "1.3585795422464",
      "LONGITUDE": "103.949531894985"
    }
  ]
}
keys=['found', 'pageNum', 'results', 'totalNumPages']
found=1 totalNumPages=1 pageNum=1 results_len=1
first_result_keys=ADDRESS,BLK_NO,BUILDING,LATITUDE,LONGITUDE,POSTAL,ROAD_NAME,SEARCHVAL,X,Y
first_result_postal=521400
first_result_searchval=SUN PLAZA SPRING
--- broad_singapore ---
url=https://www.onemap.gov.sg/api/common/elastic/search?searchVal=Singapore&returnGeom=Y&getAddrDetails=Y&pageNum=1
status_code=200
elapsed_seconds=0.042
content_type=application/json
response_bytes=4370
response_head=
{
  "error": "Authentication token missing. Please create an account and generate or renew your API Token.",
  "found": 392,
  "totalNumPages": 40,
  "pageNum": 1,
  "results": [
    {
      "SEARCHVAL": "SINGAPORE BUSINESS FEDERATION CENTER (SBF CENTER)",
      "BLK_NO": "160",
      "ROAD_NAME": "ROBINSON ROAD",
      "BUILDING": "SINGAPORE BUSINESS FEDERATION CENTER (SBF CENTER)",
      "ADDRESS": "160 ROBINSON ROAD SINGAPORE BUSINESS FEDERATION CENTER (SBF CENTER) SINGAPORE 068914",
      "POSTAL": "068914",
      "X": "29617.7456732187",
      "Y": "28954.4152733255",
      "LATITUDE": "1.27812790985944",
      "LONGITUDE": "103.847854628243"
    },
    {
      "SEARCHVAL": "SINGAPORE CHINESE GIRLS' SCHOOL",
      "BLK_NO": "190",
      "ROAD_NAME": "DUNEARN ROAD",
      "BUILDING": "SINGAPORE CHINESE GIRLS' SCHOOL",
      "ADDRESS": "190 DUNEARN ROAD SINGAPORE CHINESE GIRLS' SCHOOL SINGAPORE 309437",
      "POSTAL": "309437",
      "X": "27426.4538880838",
      "Y": "33654.5249451734",
      "LATITUDE": "1.3206340835184",
      "LONGITUDE": "103.828164966953"
    },
    {
      "SEARCHVAL": "SINGAPORE EXPO",
      "BLK_NO": "1",
      "ROAD_NAME": "EXPO DRIVE",
      "BUILDI
keys=['error', 'found', 'pageNum', 'results', 'totalNumPages']
found=392 totalNumPages=40 pageNum=1 results_len=10
first_result_keys=ADDRESS,BLK_NO,BUILDING,LATITUDE,LONGITUDE,POSTAL,ROAD_NAME,SEARCHVAL,X,Y
first_result_postal=068914
first_result_searchval=SINGAPORE BUSINESS FEDERATION CENTER (SBF CENTER)
--- digit_1 ---
url=https://www.onemap.gov.sg/api/common/elastic/search?searchVal=1&returnGeom=Y&getAddrDetails=Y&pageNum=1
status_code=429
elapsed_seconds=0.013
content_type=text/html; charset=utf-8
response_bytes=644
response_head=
<html><head><title>429 Too Many Requests</title></head><body><div style='text-align: center;font-family: Roboto, sans-serif;'><div style=' text-align: left; width: 600px; margin: 0 auto;'><h1 style='font-weight: 800;font-family: Open Sans, sans-serif;font-size: 36px;'>Error: 429 </h1><h2>Too Many Requests</h2><div><b>Reason: </b><div style=' font-size: 12px;'>Too Many Requests. As a result, the web page can not be displayed </div></div><div style=' margin: 10px 0;'><b>For visitor of website: </b><div style=' font-size: 12px;'>Please try again to visit for a few minutes</div> </div> </div> </div> </div> </body></html>
</body>
</html>

json_error=JSONDecodeError: Expecting value: line 1 column 1 (char 0)
--- empty ---
url=https://www.onemap.gov.sg/api/common/elastic/search?searchVal=&returnGeom=Y&getAddrDetails=Y&pageNum=1
status_code=429
elapsed_seconds=0.012
content_type=text/html; charset=utf-8
response_bytes=644
response_head=
<html><head><title>429 Too Many Requests</title></head><body><div style='text-align: center;font-family: Roboto, sans-serif;'><div style=' text-align: left; width: 600px; margin: 0 auto;'><h1 style='font-weight: 800;font-family: Open Sans, sans-serif;font-size: 36px;'>Error: 429 </h1><h2>Too Many Requests</h2><div><b>Reason: </b><div style=' font-size: 12px;'>Too Many Requests. As a result, the web page can not be displayed </div></div><div style=' margin: 10px 0;'><b>For visitor of website: </b><div style=' font-size: 12px;'>Please try again to visit for a few minutes</div> </div> </div> </div> </div> </body></html>
</body>
</html>

json_error=JSONDecodeError: Expecting value: line 1 column 1 (char 0)
--- asterisk ---
url=https://www.onemap.gov.sg/api/common/elastic/search?searchVal=%2A&returnGeom=Y&getAddrDetails=Y&pageNum=1
status_code=429
elapsed_seconds=0.009
content_type=text/html; charset=utf-8
response_bytes=644
response_head=
<html><head><title>429 Too Many Requests</title></head><body><div style='text-align: center;font-family: Roboto, sans-serif;'><div style=' text-align: left; width: 600px; margin: 0 auto;'><h1 style='font-weight: 800;font-family: Open Sans, sans-serif;font-size: 36px;'>Error: 429 </h1><h2>Too Many Requests</h2><div><b>Reason: </b><div style=' font-size: 12px;'>Too Many Requests. As a result, the web page can not be displayed </div></div><div style=' margin: 10px 0;'><b>For visitor of website: </b><div style=' font-size: 12px;'>Please try again to visit for a few minutes</div> </div> </div> </div> </div> </body></html>
</body>
</html>

json_error=JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

## Feasibility Judgment

OneMap Search is viable as a candidate validator/geocoder:

```text
521400 -> 1 exact result, Sun Plaza Spring, coordinates returned
```

OneMap Search is not viable as a national postal-universe enumerator from scratch:

```text
The documented required input is searchVal, described as keywords entered by users to filter results.
The documented pagination input only retrieves pages for a given keyword query.
Broad query "Singapore" returned only 392 found results, not registry scale.
Low-specificity query "1" and wildcard/empty queries returned HTTP 429 immediately in this probe.
The environment has no OneMap token credentials, while current docs say Search now requires token-based authentication.
```

## FINDINGS

1. OneMap can validate and geocode candidate postals: the P19 missing HDB postal `521400` returned an exact address and coordinates through Search.
2. OneMap Search does not expose a documented complete-address enumeration endpoint in the inspected official docs bundle; its required selector is `searchVal`, a keyword filter.
3. Low-specificity attempts are not a safe enumeration strategy: `searchVal=1`, empty `searchVal`, and `searchVal=*` each returned HTTP 429 in this probe.
4. A broad `searchVal=Singapore` query returned 392 found results across 40 pages, which is not close to the 124,443-record universe and should not be treated as a national address dump.
5. The correct v2 architecture is candidate-source-first: use HDB, SLA/URA, BCA MCST or other free current sources to propose candidate addresses/postals, then use OneMap Search to validate/geocode them under explicit rate/token controls.
6. No scoring, export, rescore, subset run, ingest, network build, input rebuild, public data write, deployment, or weight change was run.

## DISAGREEMENTS

1. The standing objective says API credentials are available in the environment. They are not: `ONEMAP_EMAIL`, `ONEMAP_PASSWORD`, `ONEMAP_TOKEN`, and `ONEMAP_ACCESS_TOKEN` are all missing in this session.
