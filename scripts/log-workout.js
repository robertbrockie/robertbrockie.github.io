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
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(TRAINING_LOG_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const workoutOnDate = data?.log?.find(entry => entry.date === date);
    if (workoutOnDate) {
      exercises.push({
        title: data.metadata.title,
        sets: workoutOnDate.sets
      });
    }
  }

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
    if (!file.endsWith('.json') || file === 'index.json') continue;

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

  console.log('\n✓ Workout logged successfully!\n');
  rl.close();
}

main();
