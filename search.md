---
layout: page
title: Search
permalink: /search/
---

<style>
  #search-input {
    width: 100%;
    padding: 16px 20px;
    font-size: 18px;
    border: 2px solid rgba(0,0,0,0.1);
    border-radius: 12px;
    background: #fff;
    transition: all 0.2s;
    outline: none;
    margin-bottom: 30px;
    font-family: inherit;
  }
  #search-input:focus {
    border-color: #d6b84a;
    box-shadow: 0 4px 12px rgba(214, 184, 74, 0.2);
  }
  #search-results {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  #search-results li {
    margin-bottom: 16px;
  }
  .search-result-item {
    display: block;
    background: #fff;
    padding: 22px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid rgba(0,0,0,0.08);
  }
  .search-result-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    text-decoration: none;
  }
  .search-result-title {
    font-size: 20px;
    font-weight: 700;
    color: #000;
    margin-bottom: 4px;
    display: block;
  }
  .search-result-date {
    display: block;
    font-size: 13px;
    color: rgba(0, 0, 0, .5);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>

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
