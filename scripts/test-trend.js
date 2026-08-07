const assert = require('assert');
const { getSetTrend } = require('./log-workout');

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
    console.log(`✓ Test ${idx + 1} passed`);
  } catch (err) {
    console.error(`✗ Test ${idx + 1} failed: expected '${tc.expected}', got '${result}'`);
    console.error(`  Input: today=${JSON.stringify(tc.today)}, prev=${JSON.stringify(tc.prev)}`);
    failed++;
  }
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\nAll tests passed successfully!');
}
