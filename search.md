---
layout: page
title: Search
permalink: /search/
---

<input
  type="search"
  id="search-input"
  placeholder="Search training log…"
  style="width:100%; padding:12px; font-size:16px;">

<ul id="search-results"></ul>

<script src="https://unpkg.com/lunr/lunr.js"></script>
<script>
let idx;
let posts = [];

fetch('{{ "/search.json" | relative_url }}')
  .then(res => res.json())
  .then(data => {
    posts = data;
    idx = lunr(function () {
      this.ref('url');
      this.field('title');
      this.field('content');

      data.forEach(function (doc) {
        this.add(doc);
      }, this);
    });
  });

document.getElementById('search-input').addEventListener('input', function () {
  if (!idx) return;

  const query = this.value;
  const results = idx.search(query);
  const list = document.getElementById('search-results');

  list.innerHTML = '';

  results.forEach(r => {
    const post = posts.find(p => p.url === r.ref);
    const li = document.createElement('li');
    li.innerHTML = `<a href="${post.url}">${post.title}</a>`;
    list.appendChild(li);
  });
});
</script>
