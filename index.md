---
layout: page
title: Project 168
---

<div class="mission-card">
  <h3>Mission Statement</h3>
  <p>Build the strongest, most muscular version of myself at approximately 168 pounds. Prioritize quality muscle, strength, health, and consistency while maintaining a physique I'm proud of year-round.</p>
</div>

<h2 class="project-section-title">Strength Goals</h2>
<p>These are challenging but realistic over the next 6–12 months.</p>

<div class="goals-container">
  <table class="goals-table">
    <thead>
      <tr>
        <th>Lift</th>
        <th>Current</th>
        <th>Project 168 Goal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Weighted Pull-up</strong></td>
        <td>+25 × 8</td>
        <td>+45 × 8</td>
      </tr>
      <tr>
        <td><strong>Weighted Dip</strong></td>
        <td>+100 × 10</td>
        <td>+135 × 8</td>
      </tr>
      <tr>
        <td><strong>Incline Smith Press</strong></td>
        <td>185 × 10</td>
        <td>225 × 8</td>
      </tr>
      <tr>
        <td><strong>Overhead Press</strong></td>
        <td>125 × 8</td>
        <td>150 × 8</td>
      </tr>
      <tr>
        <td><strong>Cable Row</strong></td>
        <td>175 × 11</td>
        <td>200 × 10</td>
      </tr>
      <tr>
        <td><strong>Trap Bar Deadlift</strong></td>
        <td>365 × 5</td>
        <td>405 × 8</td>
      </tr>
      <tr>
        <td><strong>Hack Squat</strong></td>
        <td>370 × 4</td>
        <td>405 × 8</td>
      </tr>
      <tr>
        <td><strong>Leg Press</strong></td>
        <td>707 × 8</td>
        <td>800 × 8</td>
      </tr>
    </tbody>
  </table>
</div>

<h2 class="project-section-title">Project 168 Journal Logs</h2>

{% assign has_project_posts = false %}
{% for post in site.posts %}
  {% unless post.categories contains 'first-show' %}
    {% assign has_project_posts = true %}
  {% endunless %}
{% endfor %}

{% if has_project_posts %}
  <ul class="post-list">
    {% for post in site.posts %}
      {% unless post.categories contains 'first-show' %}
        <li>
          <span class="post-meta">{{ post.date | date: "%b %d, %Y" }}</span>
          <h3>
            <a class="post-link" href="{{ post.url | relative_url }}">
              {{ post.title | escape }}
            </a>
          </h3>
        </li>
      {% endunless %}
    {% endfor %}
  </ul>
{% else %}
  <p>No log updates for Project 168 yet. Logs will appear here as I begin this new phase.</p>
{% endif %}

<p style="margin-top: 2rem; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 1rem;">
  Looking for my preparation logs leading to the bodybuilding show on July 19, 2026? 
  Check out the complete <a href="{{ '/first-show/' | relative_url }}">First Show Prep Archive</a>.
</p>
