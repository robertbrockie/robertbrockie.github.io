#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TRAINING_LOG_DIR = path.join(__dirname, '../training_log');

// Cache of exercise titles for autocomplete
let exerciseTitles = [];

function loadExerciseTitles() {
  exerciseTitles = [];
  if (!fs.existsSync(TRAINING_LOG_DIR)) return;

  const files = fs.readdirSync(TRAINING_LOG_DIR);
  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json' || file === 'body-weight.json') continue;
    const filePath = path.join(TRAINING_LOG_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.metadata?.title) {
      exerciseTitles.push(data.metadata.title);
    }
  }
  exerciseTitles.sort((a, b) => a.localeCompare(b));
}

function exerciseCompleter(line) {
  const hits = exerciseTitles.filter(title =>
    title.toLowerCase().startsWith(line.toLowerCase())
  );
  return [hits.length ? hits : exerciseTitles, line];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: exerciseCompleter
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAllExercisesForDate(date) {
  const exercises = [];

  if (!fs.existsSync(TRAINING_LOG_DIR)) {
    return exercises;
  }

  const files = fs.readdirSync(TRAINING_LOG_DIR);

  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json' || file === 'body-weight.json') continue;

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

function displayWorkoutSummary(date) {
  const exercises = getAllExercisesForDate(date);

  if (exercises.length === 0) {
    console.log(`No exercises logged for ${date}`);
    return;
  }

  console.log(`\n=== Workout Summary for ${date} ===`);
  exercises.forEach(exercise => {
    console.log(`\n${exercise.title}:`);
    exercise.sets.forEach((set, idx) => {
      console.log(`  Set ${idx + 1}: ${set.weight}lbs x ${set.reps} reps`);
    });
  });
  console.log('');
}

function loadExerciseData(exerciseSlug) {
  const filePath = path.join(TRAINING_LOG_DIR, `${exerciseSlug}.json`);

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  return null;
}

function saveExerciseData(exerciseSlug, data) {
  const filePath = path.join(TRAINING_LOG_DIR, `${exerciseSlug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved to ${exerciseSlug}.json`);
}

function generateExerciseIndex() {
  const exercises = [];
  const files = fs.readdirSync(TRAINING_LOG_DIR);

  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json' || file === 'body-weight.json') continue;

    const filePath = path.join(TRAINING_LOG_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    exercises.push({
      slug: file.replace('.json', ''),
      title: data.metadata.title
    });
  }

  exercises.sort((a, b) => a.title.localeCompare(b.title));

  const indexPath = path.join(TRAINING_LOG_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(exercises, null, 2));
}

function displayPreviousWorkout(exerciseData, specificDate = null) {
  if (!exerciseData || !exerciseData.log || exerciseData.log.length === 0) {
    console.log('  (No previous data)');
    return;
  }

  // If a specific date is provided, try to find that workout
  if (specificDate) {
    const workoutOnDate = exerciseData.log.find(entry => entry.date === specificDate);
    if (workoutOnDate) {
      console.log(`  Workout on ${workoutOnDate.date}:`);
      workoutOnDate.sets.forEach((set, idx) => {
        console.log(`    Set ${idx + 1}: ${set.weight}lbs x ${set.reps} reps`);
      });
      return;
    }
  }

  // Most recent workout is now first in the array (descending order)
  const lastWorkout = exerciseData.log[0];
  console.log(`  Last workout: ${lastWorkout.date}`);
  lastWorkout.sets.forEach((set, idx) => {
    console.log(`    Set ${idx + 1}: ${set.weight}lbs x ${set.reps} reps`);
  });
}

async function logExercise(exerciseName, muscles, workoutDate) {
  const exerciseSlug = slugify(exerciseName);
  let exerciseData = loadExerciseData(exerciseSlug);

  if (!exerciseData) {
    exerciseData = {
      metadata: {
        title: exerciseName,
        muscles: muscles
      },
      log: []
    };
    console.log(`\nCreating new exercise: ${exerciseName}`);
  } else {
    console.log(`\nLogging: ${exerciseData.metadata.title}`);
    displayPreviousWorkout(exerciseData, workoutDate);
  }

  const sets = [];
  let setNumber = 1;

  while (true) {
    const weight = await question(`  Set ${setNumber} - Weight (lbs, or press Enter to finish): `);

    if (weight.trim() === '') {
      break;
    }

    const reps = await question(`  Set ${setNumber} - Reps: `);

    sets.push({
      weight: parseFloat(weight),
      reps: parseInt(reps, 10)
    });

    setNumber++;
  }

  if (sets.length > 0) {
    exerciseData.log.push({
      date: workoutDate,
      timestamp: Date.now(),
      sets: sets
    });

    // Sort log by date in descending order (most recent first)
    exerciseData.log.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    saveExerciseData(exerciseSlug, exerciseData);
  } else {
    console.log('  No sets logged for this exercise.');
  }
}

const STRENGTH_GOALS = [
  { name: 'Weighted Pullups', slug: 'pullups', goalW: 45, goalR: 8 },
  { name: 'Weighted Dips', slug: 'dips', goalW: 135, goalR: 8 },
  { name: 'Hack Squat', slug: 'hack-squat', goalW: 405, goalR: 8 },
  { name: 'Trap Bar Deadlift', slug: 'trapbar-deadlift', goalW: 405, goalR: 8 },
  { name: 'Incline Smith Press', slug: 'incline-smith-press', goalW: 225, goalR: 8 },
  { name: 'Leg Press', slug: 'leg-press', goalW: 800, goalR: 8 },
  { name: 'Overhead Press', slug: 'overhead-press', goalW: 150, goalR: 8 },
  { name: 'Cable Row (Close Grip)', slug: 'cable-row-close-grip', goalW: 200, goalR: 10 }
];

function normalizeSlug(slug) {
  return slug.replace(/-/g, '').replace(/_/g, '').toLowerCase();
}

function calculate1RM(weight, reps) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
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

  let mdContent = `---\nlayout: post\ntitle: "${workoutDate}"\n---\n\n`;

  if (bodyWeight) {
    mdContent += `**Morning Weight:** ${bodyWeight} lbs\n\n`;
  }

  mdContent += `### Workout Log\n\n`;

  exercises.forEach(ex => {
    const exSlug = slugify(ex.title);
    const goal = STRENGTH_GOALS.find(g => normalizeSlug(g.slug) === normalizeSlug(exSlug));

    mdContent += `#### ${ex.title}\n`;
    ex.sets.forEach((set, idx) => {
      mdContent += `- Set ${idx + 1}: ${set.weight} lbs × ${set.reps} reps\n`;
    });

    if (goal) {
      const exData = loadExerciseData(exSlug);
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

      mdContent += `\n* **Goal Progress (${goal.goalW} lbs × ${goal.goalR}):**\n`;
      if (todayBestSet) {
        mdContent += `  * Today's Best: ${todayBestSet.weight} lbs × ${todayBestSet.reps} (${Math.round(todayBest1RM)} lbs Est. 1RM | ${todayPct}% of goal)\n`;
      }
      if (bestSet) {
        mdContent += `  * Lifetime Best: ${bestSet.weight} lbs × ${bestSet.reps} (${Math.round(best1RM)} lbs Est. 1RM | ${lifetimePct}% of goal)\n`;
      }
    }
    mdContent += `\n`;
  });

  fs.writeFileSync(postPath, mdContent, 'utf8');
  console.log(`✓ Generated post: _posts/${postFileName}`);
}

async function main() {
  console.log('=== Workout Logger ===\n');

  if (!fs.existsSync(TRAINING_LOG_DIR)) {
    fs.mkdirSync(TRAINING_LOG_DIR, { recursive: true });
  }

  // Load exercise titles for tab autocomplete
  loadExerciseTitles();

  const todayDate = getTodayDate();
  const dateInput = await question(`Workout date (YYYY-MM-DD, default: ${todayDate}): `);
  const workoutDate = dateInput.trim() === '' ? todayDate : dateInput;

  const weightInput = await question('Morning body weight (lbs, optional): ');
  if (weightInput.trim() !== '') {
    const weight = parseFloat(weightInput);
    if (!isNaN(weight)) {
      const weightLogPath = path.join(TRAINING_LOG_DIR, 'body-weight.json');
      let bodyWeightData = [];
      if (fs.existsSync(weightLogPath)) {
        bodyWeightData = JSON.parse(fs.readFileSync(weightLogPath, 'utf8'));
      }
      
      const existingEntryIndex = bodyWeightData.findIndex(entry => entry.date === workoutDate);
      if (existingEntryIndex >= 0) {
        bodyWeightData[existingEntryIndex].weight = weight;
      } else {
        bodyWeightData.push({ date: workoutDate, weight });
      }
      
      bodyWeightData.sort((a, b) => b.date.localeCompare(a.date));
      fs.writeFileSync(weightLogPath, JSON.stringify(bodyWeightData, null, 2));
      console.log(`✓ Logged body weight: ${weight} lbs for ${workoutDate}\n`);
    } else {
      console.log('! Invalid weight input, skipping.\n');
    }
  }

  // Display any existing workouts for this date
  displayWorkoutSummary(workoutDate);

  console.log(`Logging workout for: ${workoutDate}\n`);

  while (true) {
    const exerciseName = await question('\nExercise name (or press Enter to finish): ');

    if (exerciseName.trim() === '') {
      break;
    }

    // Check if exercise already exists
    const exerciseSlug = slugify(exerciseName);
    const existingData = loadExerciseData(exerciseSlug);

    let muscles = [];
    if (!existingData) {
      const musclesInput = await question('Muscles worked (comma-separated, e.g., "Chest, Triceps"): ');
      muscles = musclesInput.split(',').map(m => m.trim()).filter(m => m);
    }

    await logExercise(exerciseName, muscles, workoutDate);
  }

  // Update the exercise index for the progress page
  generateExerciseIndex();

  // Generate or update the blog post for this workout session
  generateOrUpdatePost(workoutDate);

  console.log('\n✓ Workout logged successfully!\n');
  rl.close();
}

main();
