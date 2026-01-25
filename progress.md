---
layout: page
title: Progress
permalink: /progress/
---

<div class="progress-selector">
  <label for="exercise-select">Select Exercise: </label>
  <select id="exercise-select">
    <option value="">-- Choose an exercise --</option>
  </select>
</div>

<div id="stats-container" class="progress-stats" style="display: none;">
  <div class="progress-stat">
    <div class="progress-stat__value" id="stat-sessions">-</div>
    <div class="progress-stat__label">Sessions</div>
  </div>
  <div class="progress-stat">
    <div class="progress-stat__value" id="stat-max-weight">-</div>
    <div class="progress-stat__label">Max Weight (lbs)</div>
  </div>
  <div class="progress-stat">
    <div class="progress-stat__value" id="stat-max-volume">-</div>
    <div class="progress-stat__label">Max Volume (lbs)</div>
  </div>
  <div class="progress-stat">
    <div class="progress-stat__value" id="stat-total-sets">-</div>
    <div class="progress-stat__label">Total Sets</div>
  </div>
</div>

<div class="progress-charts">
  <div class="progress-chart">
    <h3>Weight Progression (Max per Session)</h3>
    <canvas id="weightChart"></canvas>
  </div>

  <div class="progress-chart">
    <h3>Volume Progression (Total Weight x Reps per Session)</h3>
    <canvas id="volumeChart"></canvas>
  </div>
</div>

<div id="no-data" class="progress-no-data">
  <p>Select an exercise to view your progress.</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const BASE_URL = '/training_log';
  let weightChart = null;
  let volumeChart = null;

  async function loadExerciseIndex() {
    try {
      const response = await fetch(`${BASE_URL}/index.json`);
      const exercises = await response.json();

      const select = document.getElementById('exercise-select');
      exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.slug;
        option.textContent = exercise.title;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load exercise index:', error);
    }
  }

  async function loadExerciseData(slug) {
    if (!slug) {
      document.getElementById('stats-container').style.display = 'none';
      document.getElementById('no-data').style.display = 'block';
      clearCharts();
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/${slug}.json`);
      const data = await response.json();

      document.getElementById('no-data').style.display = 'none';
      document.getElementById('stats-container').style.display = 'grid';

      renderCharts(data);
      updateStats(data);
    } catch (error) {
      console.error('Failed to load exercise data:', error);
    }
  }

  function updateStats(data) {
    const log = data.log;

    document.getElementById('stat-sessions').textContent = log.length;

    let maxWeight = 0;
    let totalSets = 0;
    let maxVolume = 0;

    log.forEach(session => {
      let sessionVolume = 0;
      session.sets.forEach(set => {
        maxWeight = Math.max(maxWeight, set.weight);
        totalSets++;
        sessionVolume += set.weight * set.reps;
      });
      maxVolume = Math.max(maxVolume, sessionVolume);
    });

    document.getElementById('stat-max-weight').textContent = maxWeight;
    document.getElementById('stat-max-volume').textContent = maxVolume.toLocaleString();
    document.getElementById('stat-total-sets').textContent = totalSets;
  }

  function clearCharts() {
    if (weightChart) {
      weightChart.destroy();
      weightChart = null;
    }
    if (volumeChart) {
      volumeChart.destroy();
      volumeChart = null;
    }
  }

  function renderCharts(data) {
    clearCharts();

    const sortedLog = [...data.log].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sortedLog.map(entry => entry.date);

    const maxWeights = sortedLog.map(entry => {
      return Math.max(...entry.sets.map(set => set.weight));
    });

    const volumes = sortedLog.map(entry => {
      return entry.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    });

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: false }
      }
    };

    const weightCtx = document.getElementById('weightChart').getContext('2d');
    weightChart = new Chart(weightCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Max Weight (lbs)',
          data: maxWeights,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: chartOptions
    });

    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    volumeChart = new Chart(volumeCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Volume (lbs)',
          data: volumes,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: chartOptions
    });
  }

  document.getElementById('exercise-select').addEventListener('change', (e) => {
    loadExerciseData(e.target.value);
  });

  loadExerciseIndex();
</script>
