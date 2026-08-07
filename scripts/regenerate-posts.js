const fs = require('fs');
const path = require('path');
const { generateOrUpdatePost } = require('./post-generator');

const postsDir = path.join(__dirname, '../_posts');

function main() {
  console.log('=== Regenerating Workout Posts ===\n');

  if (!fs.existsSync(postsDir)) {
    console.error(`Error: _posts directory does not exist at ${postsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(postsDir);
  const workoutPosts = [];

  for (const file of files) {
    // Match files of format YYYY-MM-DD-project-168.md
    const match = file.match(/^(\d{4}-\d{2}-\d{2})-project-168\.md$/);
    if (match) {
      workoutPosts.push({
        fileName: file,
        date: match[1]
      });
    }
  }

  if (workoutPosts.length === 0) {
    console.log('No workout posts found to regenerate.');
    return;
  }

  // Sort chronologically (ascending)
  workoutPosts.sort((a, b) => a.date.localeCompare(b.date));

  console.log(`Found ${workoutPosts.length} posts to regenerate:`);
  workoutPosts.forEach(post => console.log(` - ${post.fileName}`));
  console.log('');

  let successCount = 0;
  for (const post of workoutPosts) {
    try {
      generateOrUpdatePost(post.date);
      successCount++;
    } catch (err) {
      console.error(`✗ Failed to regenerate ${post.fileName}:`, err.message);
    }
  }

  console.log(`\nSuccessfully regenerated ${successCount}/${workoutPosts.length} posts!`);
}

main();
