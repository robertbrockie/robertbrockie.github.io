---
layout: page
title: Exercises
permalink: /exercises/
---

## Exercise Library

Select a muscle group:

<ul>
  {% assign groups = site.exercises | where: "type", "group" %}
  {% for g in groups %}
    <li><a href="{{ g.url | relative_url }}">{{ g.title }}</a></li>
  {% endfor %}
</ul>