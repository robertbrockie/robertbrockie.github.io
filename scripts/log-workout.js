#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TRAINING_LOG_DIR = path.join(__dirname, '../training_log');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
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
  return today.toISOString().split('T')[0];
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

function displayPreviousWorkout(exerciseData) {
  if (!exerciseData || !exerciseData.log || exerciseData.log.length === 0) {
    console.log('  (No previous data)');
    return;
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
    displayPreviousWorkout(exerciseData);
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
      sets: sets
    });

    // Sort log by date in descending order (most recent first)
    exerciseData.log.sort((a, b) => b.date.localeCompare(a.date));

    saveExerciseData(exerciseSlug, exerciseData);
  } else {
    console.log('  No sets logged for this exercise.');
  }
}

async function main() {
  console.log('=== Workout Logger ===\n');

  if (!fs.existsSync(TRAINING_LOG_DIR)) {
    fs.mkdirSync(TRAINING_LOG_DIR, { recursive: true });
  }

  const todayDate = getTodayDate();
  const dateInput = await question(`Workout date (YYYY-MM-DD, default: ${todayDate}): `);
  const workoutDate = dateInput.trim() === '' ? todayDate : dateInput;

  console.log(`\nLogging workout for: ${workoutDate}\n`);

  while (true) {
    const exerciseName = await question('\nExercise name (or press Enter to finish): ');

    if (exerciseName.trim() === '') {
      break;
    }

    const musclesInput = await question('Muscles worked (comma-separated, e.g., "Chest, Triceps"): ');
    const muscles = musclesInput.split(',').map(m => m.trim()).filter(m => m);

    await logExercise(exerciseName, muscles, workoutDate);
  }

  console.log('\n✓ Workout logged successfully!\n');
  rl.close();
}

main();
