# P203 OneMap Candidate Validation Controls

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Official OneMap Documentation Extraction

```text
url=https://www.onemap.gov.sg/apidocs/search
status_code=200
bytes=994
bundle_ref=static/js/main.4c62b5c1.js
bundle_url=https://www.onemap.gov.sg/apidocs/static/js/main.4c62b5c1.js
bundle_status_code=200
bundle_bytes=1315298
needle='higher API call limit capped at 250' found=True
Demonstration on Search APIs"})})]}),(0,yi.jsx)("p",{children:"Users onboard the token-based authentication will have a higher API call limit capped at 250; and further request for higher limits can be discussed on a case-by-case basis."}),(0,yi.jsxs)("p",{children:["Interested parties can contact the SLA team at ",(0,yi.jsx)("a",{href:"mailto:onemap@sla.gov.sg",children:"onemap@sla.gov.sg"}),", and include the 
needle='valid access token for each API request' found=True
hildren:"Managing and Refreshing OneMap Token Validity in NodeJS"}),(0,yi.jsx)("p",{children:"The OneMap API requires a valid access token for each API request, and tokens need to be refreshed every 72 hours. This tutorial will guide you through the steps to properly authenticate and handle API requests in NodeJS. However the general principle and algorithm applied in this guide is also applicable to other platforms
needle='refreshed every 72 hours' found=True
S"}),(0,yi.jsx)("p",{children:"The OneMap API requires a valid access token for each API request, and tokens need to be refreshed every 72 hours. This tutorial will guide you through the steps to properly authenticate and handle API requests in NodeJS. However the general principle and algorithm applied in this guide is also applicable to other platforms and programming languages."}),(0,yi.jsx)("p",{c
needle='Each token is valid for 3 days' found=True
s token."," ",(0,yi.jsx)("i",{children:"The token is not required for the map services."})]}),(0,yi.jsx)("p",{children:"Each token is valid for 3 days. Its expiry timestamp is in UNIX format. When it expires, the user needs to re-authenticate with the same credentials. The token does not auto renew when it expires."}),(0,yi.jsx)("p",{children:(0,yi.jsx)("b",{children:"Developers are strongly encourage to se
needle='searchVal' found=True
ge_section":"search","method":"GET","endpoint":"/api/common/elastic/search","sampleRequest":"/api/common/elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\\n  \\"found\\": 1,\\n  \\"totalNumPages\\": 1,\\n  \\"pageNum\\": 1,\\n  \\"results\\": [\\n    {\\n      \\"SEARCHVAL\\": \\"640 ROWELL ROAD SINGAPORE 200640\\",\\n      \\"BLK_NO\\": \\"64
needle='Keywords entered by users to filter the results' found=True
abel-required",children:"Required"})]}),(0,yi.jsx)("div",{className:"om-search-desc",children:(0,yi.jsx)("p",{children:"Keywords entered by users to filter the results"})})]}),(0,yi.jsxs)("div",{className:"om-search-item",children:[(0,yi.jsxs)("div",{className:"label-method",children:["returnGeom",(0,yi.jsx)("span",{className:"label-type",children:"string"}),(0,yi.jsx)("span",{className:"label-required",children:"Required"}
needle='totalNumPages' found=True
elastic/search?searchVal=200640&returnGeom=Y&getAddrDetails=Y&pageNum=1","sampleResponse":"{\\n  \\"found\\": 1,\\n  \\"totalNumPages\\": 1,\\n  \\"pageNum\\": 1,\\n  \\"results\\": [\\n    {\\n      \\"SEARCHVAL\\": \\"640 ROWELL ROAD SINGAPORE 200640\\",\\n      \\"BLK_NO\\": \\"640\\",\\n      \\"ROAD_NAME\\": \\"ROWELL ROAD\\",\\n      \\"BUILDING\\": \\"NIL\\",\\n      \\"ADDRESS\\": \
terms_url=https://www.onemap.gov.sg/legal/apitermsofservice.html
terms_status_code=200
terms_bytes=12853
terms_needle='Your right to Use APIs may be subject to additional terms' found=True
 <ul class="list-unstyled"> <li> <i class="fa fa-angle-right fa-fw" aria-hidden="true"></i> Your right to Use APIs may be subject to additional terms, including limitations on Use, found on the individual pages of each API. You agree that an Agency may monitor your Use of the API to improve the service, track usage, to ensure compliance with these Terms of Service, or for security purposes. </li> 
terms_needle='must utilise the access control credentials' found=True
 </li> <li> <i class="fa fa-angle-right fa-fw" aria-hidden="true"></i> When you Use the API, you must utilise the access control credentials issued to you if applicable. You agree to keep such credentials secure and confidential. You shall not mis-present or mask your API Client&#39;s identity when Using the API. </li> <li> <i class="fa fa-angle-right fa-fw" aria-hidden="true
```

## Focused Tests

```text
uv run pytest C:\sgSHIOK2026\tests\test_readme.py C:\sgSHIOK2026\tests\test_batch_plan.py C:\sgSHIOK2026\tests\test_production_readiness.py -q -p no:cacheprovider
..................................                                       [100%]
34 passed in 59.98s
```

## CLI Import Checks

```text
uv run python C:\sgSHIOK2026\run.py batch-plan --help
exit_code=0

uv run python C:\sgSHIOK2026\scripts\production_readiness.py --help
exit_code=0
```

## FINDINGS

1. Current OneMap documentation still frames Search as a keyword `searchVal` endpoint with paged results, not a bulk national postal enumerator.
2. Current OneMap documentation says token-backed API access needs valid tokens refreshed every 72 hours, with tokens valid for 3 days.
3. Current OneMap documentation says token-authenticated users have a higher API call limit capped at 250, with higher limits discussed case-by-case with SLA.
4. README, batch-plan source policy, and production-readiness source policy now record those controls instead of vague `rate controls`.

## DISAGREEMENTS

1. None.
