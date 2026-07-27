const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../_posts');
const logFile = path.join(__dirname, '../training_log/body-weight.json');

function getMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function backfillBodyWeights() {
  const files = getMarkdownFiles(postsDir);
  const bodyWeights = {}; // date -> weight

  for (const filePath of files) {
    const file = path.basename(filePath);
    const match = file.match(/^(\d{4}-\d{2}-\d{2})-/);
    if (!match) continue;
    const date = match[1];

    const content = fs.readFileSync(filePath, 'utf8');
    
    const lines = content.split('\n');
    let inNotesSection = false;
    
    for (const line of lines) {
      if (line.trim() === '## Notes' || line.trim() === '##Notes') {
        inNotesSection = true;
      }
      
      // Some weights are outside the notes section or just bullets
      if ((line.trim().startsWith('-') && line.toLowerCase().includes('weight')) || line.toLowerCase().includes('weight') && line.toLowerCase().includes('lbs')) {
        const weightMatch = line.match(/(\d+\.\d+|\d{3})\s*lbs/i);
        if (weightMatch) {
           const weight = parseFloat(weightMatch[1]);
           bodyWeights[date] = weight;
           break;
        }
      }
    }
  }

  const logs = Object.keys(bodyWeights).map(date => ({
     date,
     weight: bodyWeights[date]
  })).sort((a, b) => b.date.localeCompare(a.date));

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  console.log(`Backfilled ${logs.length} weight entries to body-weight.json.`);
}

backfillBodyWeights();
