---
layout: page
title: Search
permalink: /search/
---

<div class="search-wrap">
  <input
    type="search"
    id="search-input"
    placeholder="Search training log…"
    autocomplete="off">

  <ul id="search-results"></ul>
</div>

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
  })
  .catch(err => console.error("Error loading search data:", err));

document.getElementById('search-input').addEventListener('input', function () {
  const list = document.getElementById('search-results');
  list.innerHTML = '';
  
  if (!idx || !this.value.trim()) return;

  const query = this.value;
  // Use a fuzzy match or wildcard if desired, plain search for now
  const results = idx.search(query);

  results.forEach(r => {
    const post = posts.find(p => p.url === r.ref);
    if (!post) return;

    const li = document.createElement('li');
    
    // Format date nicely if available
    let dateStr = '';
    if (post.date) {
        const d = new Date(post.date);
        dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    li.innerHTML = `
      <a href="${post.url}" class="search-result-item">
        <span class="search-result-title">${post.title}</span>
        ${dateStr ? `<span class="search-result-date">${dateStr}</span>` : ''}
      </a>
    `;
    list.appendChild(li);
  });
});
</script>
