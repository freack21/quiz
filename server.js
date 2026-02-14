const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const fs = require('fs');

// In-memory storage for leaderboard (synced with file)
let highScores = [];
const DATA_FILE = path.join(__dirname, 'scores.json');

// Load scores from file if exists
if (fs.existsSync(DATA_FILE)) {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        highScores = JSON.parse(data);
    } catch (err) {
        console.error("Error reading scores file:", err);
        highScores = [];
    }
}

// Helper to save scores
function saveScores() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(highScores, null, 2));
    } catch (err) {
        console.error("Error saving scores:", err);
    }
}

// Questions Data (Served to frontend if needed, but requirements say hardcoded or fetchable. 
// Let's just keep it simple and serve static files, but having an API for scores is key.)

// API: Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
    // Sort logic: Higher score first. If tie, higher remaining time (faster) first.
    const sortedScores = highScores.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.timeRemaining - a.timeRemaining; // More time remaining = faster
    });

    // Return top 10
    res.json(sortedScores.slice(0, 10));
});

// API: Submit Score
app.post('/api/submit-score', (req, res) => {
    const { username, score, timeRemaining } = req.body;

    if (!username || score === undefined || timeRemaining === undefined) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const newEntry = {
        username: username.slice(0, 15), // Limit name length
        score: parseInt(score),
        timeRemaining: parseInt(timeRemaining),
        date: new Date()
    };

    highScores.push(newEntry);
    saveScores(); // Persist to file
    
    res.json({ message: 'Score submitted successfully', entry: newEntry });
});

// Fallback not needed for this simple app without client-side routing history
// app.get('*', (req, res) => {
//    res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});
