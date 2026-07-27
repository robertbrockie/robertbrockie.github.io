---
layout: page
title: "Road to the Stage (First Show Prep)"
permalink: /first-show/
---

This page archives all 178 daily preparation logs, nutrition updates, and lifting diaries leading up to my first bodybuilding competition (WWA Physique Sports) on **July 19, 2026**.

---

<ul class="post-list">
  {% assign show_posts = site.posts | where_exp: "item", "item.categories contains 'first-show'" %}
  {% for post in show_posts %}
    <li>
      <span class="post-meta">{{ post.date | date: "%b %d, %Y" }}</span>
      <h3>
        <a class="post-link" href="{{ post.url | relative_url }}">
          {{ post.title | escape }}
        </a>
      </h3>
    </li>
  {% endfor %}
</ul>
