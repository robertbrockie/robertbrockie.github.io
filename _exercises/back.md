---
title: Back
type: group
group: back
---

## Back exercises

<ul>
  {% assign items = site.exercises | where: "type", "exercise" | where: "group", "back" | sort: "title" %}
  {% for ex in items %}
    <li><a href="{{ ex.url | relative_url }}">{{ ex.title }}</a></li>
  {% endfor %}
</ul>