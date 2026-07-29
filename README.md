# Brock's Bodybuilding Journal





This is the repository of a GitHub blog that documents my training as I prepare for a bodybuilding show in July and track my progress for **Project 168**.

## Local Development

To run this blog locally and manage your logs, you can choose between two methods:

### Method A: With Ruby (Native)
Ensure you have **Ruby** (with Bundler) and **Node.js** installed on your machine.
1. Install dependencies:
   ```bash
   bundle install
   ```
2. Start the local server:
   ```bash
   npm run dev
   ```

### Method B: Without Ruby (Using Docker)
If you don't have Ruby installed, you can use **Docker** to build and serve the site containerized:
* **Start local server**: `npm run dev:docker` (serves the Jekyll site at `http://localhost:4000` via Docker)
* **Build site**: `npm run build:docker` (compiles the Jekyll site via Docker)

### Other Workflow Commands
We use NPM scripts to simplify other daily tasks:
* **Log a workout**: `npm run log` (runs the workout logging CLI tool; requires Node.js)
* **Backfill body weights**: `npm run backfill` (backfills weight records from your journal posts; requires Node.js)

## Workout Logging

This repo includes a CLI tool to log workouts and track progress over time.

### How to Log a Workout

Run the workout logger (or use `npm run log`):
```bash
node scripts/log-workout.js
```

The script will prompt you for:
1. Workout date (press Enter to use today's date, or enter a date like "2026-01-08")
2. Exercise name (e.g., "Decline Bench Press")
3. Muscles worked (e.g., "Chest, Triceps")
4. Weight and reps for each set
5. Press Enter when finished with an exercise

Repeat for each exercise in your workout, then press Enter to finish.

### Data Structure

Each exercise is stored in its own JSON file in `training_log/` (e.g., `decline-bench-press.json`):

```json
{
  "metadata": {
    "title": "Decline Bench Press",
    "muscles": ["Chest", "Triceps"]
  },
  "log": [
    {
      "date": "2026-01-08",
      "sets": [
        {"weight": 135, "reps": 10},
        {"weight": 185, "reps": 8},
        {"weight": 200, "reps": 6}
      ]
    }
  ]
}
```

### Features

- **Custom workout dates**: Log workouts for any date, not just today (useful for backfilling old sessions)
- **Previous workout display**: Shows your last performance when logging an existing exercise
- **Automatic file creation**: First time logging an exercise creates the JSON file with metadata
- **Exercise-based storage**: Makes it easy to track progress for individual exercises and build routines based on muscle groups
- **Chronological sorting**: Workout logs are stored in descending order (most recent first)

### Workflow

After logging a workout, commit the updated JSON files:
```bash
git add training_log/
git commit -m "Log workout: [date]"
git push
```

This data can then be used to generate progress graphs on the site.
