const assert = require('assert');
const { getSetTrend, getWorkoutPrefix } = require('./log-workout');

console.log('Running trend logic unit tests...');

const testCases = [
  // 1. Same weight, more reps -> 'up'
  { today: { weight: 375, reps: 7 }, prev: { weight: 375, reps: 6 }, expected: 'up' },
  
  // 2. Same weight, fewer reps -> 'down'
  { today: { weight: 375, reps: 5 }, prev: { weight: 375, reps: 6 }, expected: 'down' },
  
  // 3. Same weight, same reps -> null
  { today: { weight: 375, reps: 6 }, prev: { weight: 375, reps: 6 }, expected: null },
  
  // 4. Weight increased, fewer reps -> 'up' (user's Calf Raises case: 470x12 vs 460x14)
  { today: { weight: 470, reps: 12 }, prev: { weight: 460, reps: 14 }, expected: 'up' },
  
  // 5. Weight increased, same reps -> 'up'
  { today: { weight: 200, reps: 10 }, prev: { weight: 190, reps: 10 }, expected: 'up' },
  
  // 6. Weight decreased, more reps -> 'down' (weight-priority logic)
  { today: { weight: 150, reps: 12 }, prev: { weight: 160, reps: 9 }, expected: 'down' },
  
  // 7. Missing prev set -> null
  { today: { weight: 325, reps: 8 }, prev: null, expected: null },
  
  // 8. Missing today set -> null
  { today: null, prev: { weight: 325, reps: 8 }, expected: null }
];

let failed = 0;
testCases.forEach((tc, idx) => {
  const result = getSetTrend(tc.today, tc.prev);
  try {
    assert.strictEqual(result, tc.expected);
    console.log(`✓ Trend Test ${idx + 1} passed`);
  } catch (err) {
    console.error(`✗ Trend Test ${idx + 1} failed: expected '${tc.expected}', got '${result}'`);
    console.error(`  Input: today=${JSON.stringify(tc.today)}, prev=${JSON.stringify(tc.prev)}`);
    failed++;
  }
});

console.log('\nRunning workout classification unit tests...');

const classificationCases = [
  {
    name: 'Leg Day (Multiple Legs exercises)',
    exercises: [
      { title: 'Trapbar Deadlift' }, // Back
      { title: 'Leg Curls - Seated' }, // Legs
      { title: 'Calf Raises' }, // Legs
      { title: 'Hip Thrusts (Front loaded plates)' }, // Legs, Glutes
      { title: 'Single Leg Curl' } // Legs
    ],
    expected: '🦵'
  },
  {
    name: 'Pull Day (Multiple Back exercises)',
    exercises: [
      { title: 'Pullups' },
      { title: 'Tbar Rows - Chest Supported' },
      { title: 'Low Rows' }
    ],
    expected: 'Pull'
  },
  {
    name: 'Push Day (Multiple Chest exercises)',
    exercises: [
      { title: 'Incline DB Press' },
      { title: 'Dips' },
      { title: 'Pec Deck' }
    ],
    expected: 'Push'
  },
  {
    name: 'Upper Body (Mix of Chest and Back)',
    exercises: [
      { title: 'Pullups' },
      { title: 'Dips' }
    ],
    expected: 'Upper Body'
  },
  {
    name: 'Undefined / Other Workout (Doesn\'t fit criteria)',
    exercises: [
      { title: 'Wrist Curls' }
    ],
    expected: ''
  }
];

classificationCases.forEach((tc, idx) => {
  const result = getWorkoutPrefix(tc.exercises);
  try {
    assert.strictEqual(result, tc.expected);
    console.log(`✓ Classification Test ${idx + 1} passed (${tc.name})`);
  } catch (err) {
    console.error(`✗ Classification Test ${idx + 1} failed (${tc.name}): expected '${tc.expected}', got '${result}'`);
    failed++;
  }
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\nAll tests passed successfully!');
}
