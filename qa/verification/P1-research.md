# P1 Licensing Research Summary

Date: 2026-08-11

Subagent A reported the following licensing obligations and source notes for
the P1 implementation task:

- OneMap GreyLite documentation requires visible OneMap logo and attribution.
  Literal required markup from
  https://www.onemap.gov.sg/docs/maps/resources/code-attr.txt:

```html
<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>
```

- OneMap API Terms point API datasets to the Singapore Open Data Licence; no
  separate Search/Routing logo markup was found.
- Singapore Open Data Licence v1.0 requires conspicuous notice acknowledging
  source and linking to the licence. Example:
  `[Contains information from {name of dataset} accessed on {date} from {source} which is made available under the terms of the Singapore Open Data Licence version 1.0 {URL}]`
- LTA DataMall datasets use SODL. General LTA website contents have additional
  restrictions, so SHIOK attribution must not imply LTA site content
  redistribution.
- ODbL Produced Work public use requires notice that content was obtained from
  an ODbL database and is available under ODbL. A Derivative Database publicly
  used must be under ODbL or a later compatible licence; this report did not
  provide a legal opinion on which category SHIOK falls into.
- Overture licensing varies; if not shipped, note it as probed/candidate only.
