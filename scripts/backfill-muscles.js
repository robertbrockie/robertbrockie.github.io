const fs = require('fs');
const path = require('path');
const { getExerciseMuscles } = require('./post-generator');

const TRAINING_LOG_DIR = path.join(__dirname, '../training_log');

function backfillMuscles() {
  console.log('=== Backfilling Muscle Groups ===\n');

  if (!fs.existsSync(TRAINING_LOG_DIR)) {
    console.error(`Error: training_log directory does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(TRAINING_LOG_DIR);
  let backfilledCount = 0;
  let totalCount = 0;

  for (const file of files) {
    if (!file.endsWith('.json') || file === 'index.json' || file === 'body-weight.json' || file === 'config.json') continue;

    const filePath = path.join(TRAINING_LOG_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    totalCount++;

    const exSlug = file.replace('.json', '');
    const currentMuscles = data.metadata?.muscles || [];

    if (currentMuscles.length === 0) {
      const detectedMuscles = getExerciseMuscles(exSlug, data);
      if (detectedMuscles.length > 0) {
        if (!data.metadata) data.metadata = {};
        data.metadata.muscles = detectedMuscles;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ Backfilled muscles for ${data.metadata.title || exSlug}: ${JSON.stringify(detectedMuscles)}`);
        backfilledCount++;
      } else {
        console.log(`! No muscles detected for ${data.metadata.title || exSlug}`);
      }
    }
  }

  console.log(`\nProcessed ${totalCount} exercise logs. Backfilled ${backfilledCount} files.`);
}

backfillMuscles();
