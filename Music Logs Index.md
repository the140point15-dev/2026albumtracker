---
title: Music Logs what is this
---

```base
type: list
filter: file.folder == "Music Logs" && publish == true
sort:
  - property: listen-date
    direction: desc
columns:
  - file.name
  - listen-date
  - rating
  - release-year
    