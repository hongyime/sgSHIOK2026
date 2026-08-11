# P1 Licensing Research

Date: 2026-08-11

Scope: read-only licensing and attribution research. This is engineering
research for source attribution, not legal advice.

## Commands

Command:

```powershell
if (Test-Path .agents/STATE.md) { Get-Content .agents/STATE.md } else { 'NO_STATE' }
```

Output:

```text
NO_STATE
```

Command:

```powershell
Invoke-WebRequest https://www.onemap.gov.sg/docs/maps/resources/code-attr.txt | Select-Object StatusCode,Content
```

Output:

```text
StatusCode: 200
Content:
<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>
```

Command:

```powershell
Invoke-WebRequest https://www.onemap.gov.sg/docs/maps/greylite.html | Select-Object StatusCode
Invoke-WebRequest https://www.onemap.gov.sg/legal/termsofuse.html | Select-Object StatusCode
Invoke-WebRequest https://www.onemap.gov.sg/legal/apitermsofservice.html | Select-Object StatusCode
Invoke-WebRequest https://data.gov.sg/open-data-licence | Select-Object StatusCode
Invoke-WebRequest https://datamall.lta.gov.sg/content/datamall/en/term-of-use.html | Select-Object StatusCode
Invoke-WebRequest https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpenDataLicence.html | Select-Object StatusCode
Invoke-WebRequest https://opendatacommons.org/licenses/odbl/1-0/ | Select-Object StatusCode
Invoke-WebRequest https://docs.overturemaps.org/attribution/ | Select-Object StatusCode
```

Output:

```text
StatusCode
----------
       200
       200
       200
       200
       200
       200
       200
       200
```

## Requirements Found

| ID | Source URL | Requirement found |
| --- | --- | --- |
| A1 | https://www.onemap.gov.sg/docs/maps/greylite.html and https://www.onemap.gov.sg/docs/maps/resources/code-attr.txt | GreyLite map display requires the OneMap logo plus attribution. Literal markup retrieved from `code-attr.txt` is shown above and was used unchanged in the map component. |
| A1 | https://www.onemap.gov.sg/legal/termsofuse.html | OneMap/SLA terms prohibit removing, altering, or obscuring SLA/OneMap notices, logos, marks, or disclaimers, and restrict copying, storing, distributing, or modifying services except as permitted. |
| A2 | https://www.onemap.gov.sg/legal/apitermsofservice.html | OneMap API Terms point API datasets to the Singapore Open Data Licence. No separate Search/Routing API logo markup was found in this document; ambiguity remains if individual API pages impose additional source-specific requirements. |
| A3 | https://data.gov.sg/open-data-licence and https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpenDataLicence.html | Singapore Open Data Licence v1.0 allows use, copying, modification, redistribution, analyses, and applications, with a conspicuous notice acknowledging the source and linking to the licence. Example form: `[Contains information from {name of dataset} accessed on {date of access of dataset} from {source of data} which is made available under the terms of the Singapore Open Data Licence version 1.0 {URL link to licence}]`. |
| A4 | https://datamall.lta.gov.sg/content/datamall/en/term-of-use.html and https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpenDataLicence.html | LTA DataMall datasets used by SHIOK are treated as SODL inputs. General LTA website content has separate restrictions and was not treated as content being redistributed by SHIOK. |
| A5 | https://opendatacommons.org/licenses/odbl/1-0/ | For a Produced Work publicly used from an ODbL database, the work must include notice that the content was obtained from an ODbL database and is available under ODbL. For a Derivative Database under section 4.4, public use requires the Derivative Database to be offered under ODbL 1.0, a later ODbL version, or a compatible licence. Whether SHIOK's published route geometry is a Produced Work or Derivative Database was deliberately left unresolved. |
| A6 | https://docs.overturemaps.org/attribution/ and https://overturemaps.org/about/faq/ | Overture data has theme-dependent licensing. Overture recommends using the CDLA Permissive v2 licensed themes where possible, while some OSM-derived themes may be ODbL. SHIOK currently treats Overture as candidate/unshipped in this P1 task. |

## Literal OneMap Markup

```html
<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>
```
