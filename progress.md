---
layout: page
title: Progress
permalink: /progress/
---

<div class="progress-chart" style="margin-bottom: 2rem;">
  <h3>Body Weight Over Time</h3>
  <canvas id="bodyWeightChart"></canvas>
</div>

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

<h2 class="goals-dashboard-title">Project 168 Strength Goals</h2>
<div class="goals-dashboard" id="goals-dashboard">
  <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #888;">
    Loading strength goals progress...
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const BASE_URL = '/training_log';
  let weightChart = null;
  let volumeChart = null;
  let bodyWeightChart = null;
  let bodyWeightData = [];

  function getBodyWeightForDate(dateStr) {
    if (!bodyWeightData || bodyWeightData.length === 0) return null;
    let lastWeight = bodyWeightData[0].weight;
    for (const entry of bodyWeightData) {
      if (entry.date <= dateStr) {
        lastWeight = entry.weight;
      } else {
        break;
      }
    }
    return lastWeight;
  }

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

    const exerciseBodyWeights = dates.map(date => getBodyWeightForDate(date));

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
        datasets: [
          {
            label: 'Body Weight (lbs)',
            data: exerciseBodyWeights,
            borderColor: 'rgba(255, 152, 0, 0.4)',
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 0,
            borderWidth: 2
          },
          {
            label: 'Max Weight (lbs)',
            data: maxWeights,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        ...chartOptions,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 15,
              boxHeight: 15
            }
          }
        }
      }
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

  async function loadBodyWeightData() {
    try {
      const response = await fetch(`${BASE_URL}/body-weight.json`);
      const data = await response.json();
      
      bodyWeightData = [...data].sort((a, b) => a.date.localeCompare(b.date));
      const dates = bodyWeightData.map(entry => entry.date);
      const weights = bodyWeightData.map(entry => entry.weight);
      
      const ctx = document.getElementById('bodyWeightChart').getContext('2d');
      bodyWeightChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Body Weight (lbs)',
            data: weights,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: false }
          }
        }
      });
    } catch (error) {
      console.error('Failed to load body weight data:', error);
    }
  }

  const STRENGTH_GOALS = [
    { name: 'Weighted Pull-ups', slug: 'pullups', goalW: 45, goalR: 8 },
    { name: 'Weighted Dips', slug: 'dips', goalW: 135, goalR: 8 },
    { name: 'Hack Squat', slug: 'hack-squat', goalW: 405, goalR: 8 },
    { name: 'Trap Bar Deadlift', slug: 'trapbar-deadlift', goalW: 405, goalR: 8 },
    { name: 'Incline Smith Press', slug: 'incline-smith-press', goalW: 225, goalR: 8 },
    { name: 'Leg Press', slug: 'leg-press', goalW: 800, goalR: 8 },
    { name: 'Overhead Press', slug: 'overhead-press', goalW: 150, goalR: 8 }
  ];

  function calculate1RM(weight, reps) {
    if (reps <= 0) return 0;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }

  async function loadGoalsProgress() {
    const dashboard = document.getElementById('goals-dashboard');
    try {
      const promises = STRENGTH_GOALS.map(async goal => {
        try {
          const res = await fetch(`${BASE_URL}/${goal.slug}.json`);
          if (!res.ok) throw new Error('Not found');
          const data = await res.json();
          
          let best1RM = 0;
          let bestSet = { weight: 0, reps: 0 };
          let bestDate = 'N/A';

          data.log.forEach(session => {
            session.sets.forEach(set => {
              const oneRM = calculate1RM(set.weight, set.reps);
              if (oneRM > best1RM) {
                best1RM = oneRM;
                bestSet = set;
                bestDate = session.date;
              }
            });
          });

          const target1RM = calculate1RM(goal.goalW, goal.goalR);
          const pct = target1RM > 0 ? Math.min(Math.round((best1RM / target1RM) * 100), 150) : 0;

          return {
            ...goal,
            bestSet,
            bestDate,
            pct,
            target1RM,
            best1RM
          };
        } catch (err) {
          return {
            ...goal,
            bestSet: { weight: 0, reps: 0 },
            bestDate: 'N/A',
            pct: 0,
            target1RM: calculate1RM(goal.goalW, goal.goalR),
            best1RM: 0
          };
        }
      });

      const results = await Promise.all(promises);
      dashboard.innerHTML = '';

      results.forEach(res => {
        const card = document.createElement('div');
        card.className = 'goal-card';
        
        const bestLabel = res.bestSet.reps > 0 ? `${res.bestSet.weight} lbs × ${res.bestSet.reps}` : 'N/A';
        const goalLabel = `${res.goalW} lbs × ${res.goalR}`;

        card.innerHTML = `
          <div class="goal-card__header">
            <h4 class="goal-card__title">${res.name}</h4>
            <span class="goal-card__pct">${res.pct}%</span>
          </div>
          <div class="goal-card__details">
            <div>Goal: <strong>${goalLabel}</strong></div>
            <div>Best: <strong>${bestLabel}</strong></div>
          </div>
          <div class="goal-card__details" style="grid-template-columns: 1fr; margin-bottom: 0;">
            <div style="font-size: 0.75rem; color: #999;">Best Est. 1RM: <strong>${Math.round(res.best1RM)} lbs</strong> (Goal 1RM: ${Math.round(res.target1RM)} lbs)</div>
          </div>
          <div class="goal-card__bar-bg">
            <div class="goal-card__bar-fill" style="width: ${Math.min(res.pct, 100)}%;"></div>
          </div>
        `;
        dashboard.appendChild(card);
      });
    } catch (error) {
      console.error('Failed loading goals dashboard:', error);
      dashboard.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ff5252;">Error loading goals dashboard.</div>';
    }
  }

  loadExerciseIndex();
  loadBodyWeightData();
  loadGoalsProgress();
</script>
