const fs = require('fs');
const path = require('path');

const TRAINING_LOG_DIR = path.join(__dirname, '../training_log');
const CONFIG_PATH = path.join(TRAINING_LOG_DIR, 'config.json');

// Load config
let strengthGoals = [];
if (fs.existsSync(CONFIG_PATH)) {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  strengthGoals = config.strengthGoals || [];
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSlug(slug) {
  return slug.replace(/-/g, '').replace(/_/g, '').toLowerCase();
}

function calculate1RM(weight, reps) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function getSetTrend(todaySet, prevSet) {
  if (!todaySet || !prevSet) return null;

  const w1 = todaySet.weight;
  const r1 = todaySet.reps;
  const w2 = prevSet.weight;
  const r2 = prevSet.reps;

  if (w1 > w2) return 'up';
  if (w1 < w2) return 'down';

  if (r1 > r2) return 'up';
  if (r1 < r2) return 'down';

  return null;
}

function getExerciseMuscles(exSlug, exData) {
  let muscles = exData?.metadata?.muscles || [];
  if (muscles.length === 0) {
    const slug = exSlug.toLowerCase();
    if (slug.includes('press') || slug.includes('dip') || slug.includes('pec') || slug.includes('fly')) {
      if (slug.includes('shoulder') || slug.includes('overhead')) {
        return ['Shoulders'];
      } else if (slug.includes('leg') || slug.includes('bench') || slug.includes('hack')) {
        if (slug.includes('bench') || slug.includes('press')) {
          if (slug.includes('leg')) {
            return ['Legs'];
          } else {
            return ['Chest'];
          }
        }
      } else {
        return ['Chest'];
      }
    } else if (slug.includes('row') || slug.includes('pull') || slug.includes('chin') || slug.includes('shrug') || slug.includes('deadlift')) {
      return ['Back'];
    } else if (slug.includes('curl') || slug.includes('extension') || slug.includes('skull')) {
      if (slug.includes('leg') || slug.includes('calf') || slug.includes('hamstring')) {
        return ['Legs'];
      } else {
        return ['Arms'];
      }
    } else if (slug.includes('squat') || slug.includes('calf') || slug.includes('raise') || slug.includes('thrust') || slug.includes('lunge') || slug.includes('leg') || slug.includes('glute')) {
      return ['Legs'];
    }
  }
  return muscles;
}

function loadExerciseData(exerciseSlug) {
  const filePath = path.join(TRAINING_LOG_DIR, `${exerciseSlug}.json`);

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  return null;
}

function getWorkoutPrefix(exercises) {
  let chestCount = 0;
  let backCount = 0;
  let legCount = 0;

  exercises.forEach(ex => {
    const exSlug = slugify(ex.title);
    const exData = loadExerciseData(exSlug);
    const muscles = getExerciseMuscles(exSlug, exData);

    muscles.forEach(m => {
      const lowerM = m.toLowerCase();
      if (lowerM === 'chest') {
        chestCount++;
      } else if (lowerM === 'back' || lowerM === 'lats') {
        backCount++;
      } else if (['legs', 'leg', 'hamstrings', 'glutes', 'calves', 'quads', 'thighs'].includes(lowerM)) {
        legCount++;
      }
    });
  });

  if (chestCount > 0 && backCount > 0) {
    return 'Upper Body';
  }
  if (legCount >= 2) {
    return '🦵';
  }
  if (backCount >= 2) {
    return 'Pull';
  }
  if (chestCount >= 2) {
    return 'Push';
  }
  return '';
}

function getAllExercisesForDate(date) {
  const exercises = [];

  if (!fs.existsSync(TRAINING_LOG_DIR)) {
    return exercises;
  }

  const files = fs.readdirSync(TRAINING_LOG_DIR);

  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json' || file === 'body-weight.json' || file === 'config.json') continue;

    const filePath = path.join(TRAINING_LOG_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const workoutOnDate = data?.log?.find(entry => entry.date === date);
    if (workoutOnDate) {
      exercises.push({
        title: data.metadata.title,
        sets: workoutOnDate.sets,
        timestamp: workoutOnDate.timestamp || 0
      });
    }
  }

  exercises.sort((a, b) => a.timestamp - b.timestamp);

  return exercises;
}

function generateOrUpdatePost(workoutDate) {
  const postFileName = `${workoutDate}-project-168.md`;
  const postPath = path.join(__dirname, '../_posts', postFileName);

  // Get body weight
  const weightLogPath = path.join(TRAINING_LOG_DIR, 'body-weight.json');
  let bodyWeight = null;
  if (fs.existsSync(weightLogPath)) {
    const weightLog = JSON.parse(fs.readFileSync(weightLogPath, 'utf8'));
    const entry = weightLog.find(e => e.date === workoutDate);
    if (entry) bodyWeight = entry.weight;
  }

  // Get all exercises logged on this date
  const exercises = getAllExercisesForDate(workoutDate);
  if (exercises.length === 0) {
    return;
  }

  const prefix = getWorkoutPrefix(exercises);
  const titleStr = prefix ? `${prefix} - ${workoutDate}` : workoutDate;

  let mdContent = `---\nlayout: post\ntitle: "${titleStr}"\n---\n\n`;

  mdContent += `<div class="workout-post">\n\n`;

  if (bodyWeight) {
    mdContent += `<div class="workout-post__weight">⚖️ Morning Weight: <strong>${bodyWeight} lbs</strong></div>\n\n`;
  }

  exercises.forEach(ex => {
    const exSlug = slugify(ex.title);
    const goal = strengthGoals.find(g => normalizeSlug(g.slug) === normalizeSlug(exSlug));
    const exData = loadExerciseData(exSlug);

    let prevWorkout = null;
    if (exData && exData.log) {
      const currentEntryIndex = exData.log.findIndex(entry => entry.date === workoutDate);
      if (currentEntryIndex !== -1 && currentEntryIndex + 1 < exData.log.length) {
        prevWorkout = exData.log[currentEntryIndex + 1];
      }
    }

    mdContent += `<div class="workout-exercise-card">\n`;
    mdContent += `  <h3 class="workout-exercise-card__title">${ex.title}</h3>\n\n`;
    
    mdContent += `  <table class="workout-sets-table">\n`;
    mdContent += `    <thead>\n      <tr>\n        <th>Set</th>\n        <th>Weight</th>\n        <th>Reps</th>\n      </tr>\n    </thead>\n    <tbody>\n`;
    
    ex.sets.forEach((set, idx) => {
      let trendHtml = '';
      if (prevWorkout && prevWorkout.sets && prevWorkout.sets[idx]) {
        const prevSet = prevWorkout.sets[idx];
        const trend = getSetTrend(set, prevSet);
        if (trend === 'up') {
          trendHtml = ` <span class="workout-trend workout-trend--up" title="Previous: ${prevSet.weight} lbs x ${prevSet.reps} reps">↑</span>`;
        } else if (trend === 'down') {
          trendHtml = ` <span class="workout-trend workout-trend--down" title="Previous: ${prevSet.weight} lbs x ${prevSet.reps} reps">↓</span>`;
        }
      }
      mdContent += `      <tr>\n        <td>Set ${idx + 1}</td>\n        <td><strong>${set.weight} lbs</strong></td>\n        <td>${set.reps} reps${trendHtml}</td>\n      </tr>\n`;
    });
    mdContent += `    </tbody>\n  </table>\n`;

    if (goal) {
      let best1RM = 0;
      let bestSet = null;

      if (exData && exData.log) {
        exData.log.forEach(session => {
          session.sets.forEach(set => {
            const oneRM = calculate1RM(set.weight, set.reps);
            if (oneRM > best1RM) {
              best1RM = oneRM;
              bestSet = set;
            }
          });
        });
      }

      let todayBest1RM = 0;
      let todayBestSet = null;
      ex.sets.forEach(set => {
        const oneRM = calculate1RM(set.weight, set.reps);
        if (oneRM > todayBest1RM) {
          todayBest1RM = oneRM;
          todayBestSet = set;
        }
      });

      const target1RM = calculate1RM(goal.goalW, goal.goalR);
      const todayPct = target1RM > 0 ? Math.round((todayBest1RM / target1RM) * 100) : 0;
      const lifetimePct = target1RM > 0 ? Math.round((best1RM / target1RM) * 100) : 0;

      mdContent += `\n  <div class="workout-goal-progress">\n`;
      mdContent += `    <div class="workout-goal-progress__title">🎯 Goal Progress (${goal.goalW} lbs × ${goal.goalR})</div>\n`;
      mdContent += `    <div class="workout-goal-progress__metrics">\n`;
      if (todayBestSet) {
        mdContent += `      <div>Today's Best: <strong>${todayBestSet.weight} lbs × ${todayBestSet.reps}</strong> (${Math.round(todayBest1RM)} lbs Est. 1RM | ${todayPct}% of goal)</div>\n`;
      }
      if (bestSet) {
        mdContent += `      <div>Lifetime Best: <strong>${bestSet.weight} lbs × ${bestSet.reps}</strong> (${Math.round(best1RM)} lbs Est. 1RM | ${lifetimePct}% of goal)</div>\n`;
      }
      mdContent += `    </div>\n`;
      mdContent += `    <div class="workout-goal-progress__bar-bg">\n`;
      mdContent += `      <div class="workout-goal-progress__bar-fill" style="width: ${Math.min(lifetimePct, 100)}%;"></div>\n`;
      mdContent += `    </div>\n`;
      mdContent += `  </div>\n`;
    }
    mdContent += `</div>\n\n`;
  });

  mdContent += `</div>\n`;

  fs.writeFileSync(postPath, mdContent, 'utf8');
  console.log(`✓ Generated post: _posts/${postFileName}`);
}

module.exports = {
  slugify,
  normalizeSlug,
  calculate1RM,
  getSetTrend,
  getExerciseMuscles,
  getWorkoutPrefix,
  generateOrUpdatePost,
  loadExerciseData,
  getAllExercisesForDate
};
