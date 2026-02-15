document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landing-page');
    const quizPage = document.getElementById('quiz-page');
    const leaderboardPage = document.getElementById('leaderboard-page');
    
    const usernameInput = document.getElementById('username');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressFill = document.getElementById('progress-fill');
    
    const timerDisplay = document.getElementById('time-left');
    const scoreDisplay = document.getElementById('current-score');
    
    const resultUsername = document.getElementById('result-username');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalTimeDisplay = document.getElementById('final-time');
    const leaderboardList = document.getElementById('leaderboard-list');

    // Game State
    const initialState = {
        username: '',
        currentQuestionIndex: 0,
        score: 0,
        timeLeft: 60,
        timerInterval: null,
        isFinished: false
    };

    let currentState = { ...initialState };

    // Questions Data
    const questions = [
        {
            question: "Berapa jumlah roda omniwheel dan konfigurasi sudut yang digunakan pada robot Tim Bertuah?",
            options: [
                "A. 2 roda (90°, 180°)",
                "B. 3 roda (30°, 150°, 270°)",
                "C. 4 roda (45°, 135°, 225°, 315°)",
                "D. 1 roda"
            ],
            correctIndex: 1 // B
        },
        {
            question: "Algoritma Computer Vision versi berapa yang digunakan untuk deteksi bola secara real-time?",
            options: [
                "A. YOLOv5",
                "B. Google Lens",
                "C. YOLOv8",
                "D. OpenCV Basic"
            ],
            correctIndex: 2 // C
        },
        {
            question: "Apa Middleware yang digunakan sebagai jembatan komunikasi antar node sistem pada robot?",
            options: [
                "A. ROS (Robot Operating System)",
                "B. Arduino C++",
                "C. Node.js",
                "D. Socket.IO"
            ],
            correctIndex: 0 // A
        },
        {
            question: "Mekanisme tendangan robot Tim Bertuah menggunakan sistem dual-mode. Dua jenis tendangan apa yang bisa dihasilkan oleh solenoid robot?",
            options: [
                "A. Tendangan maut & tendangan melengkung",
                "B. Tendangan bawah (ground shot) & tendangan atas (lob pass)",
                "C. Tendangan penalti & tendangan bebas",
                "D. Tendangan api & tendangan es"
            ],
            correctIndex: 1 // B
        },
        {
            question: "Apa perbedaan utama format pertandingan antara Tingkat Wilayah dan Tingkat Nasional?",
            options: [
                "A. Wilayah pakai remote, Nasional otonom",
                "B. Wilayah di lapangan rumput, Nasional di lapangan semen",
                "C. Wilayah pakai bola plastik, Nasional bola resmi FIFA",
                "D. Wilayah Daring (fokus goal challenge), Nasional Luring (pertandingan 3 vs 3)",
            ],
            correctIndex: 3 // D
        }
    ];

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);
    usernameInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') startGame();
    });

    // Functions

    // Check for existing session on load
    checkSession();

    function checkSession() {
        const savedState = localStorage.getItem('quizState');
        if (savedState) {
            currentState = JSON.parse(savedState);
            
            if (currentState.isFinished) {
                // If game was finished, go straight to leaderboard
                showLeaderboardOnly();
            } else if (currentState.username) {
                // Determine if we should resume or just show leaderboard (simple approach: resume if active)
                // For this demo, let's just resume the timer and show the quiz page
                // But we need to handle the timer properly.
                // Simplified: If reload mid-game, just show leaderboard or restart? 
                // User asked: "malah kalau ke-refresh harusnya masih main sebagai user itu" -> Resume.
                resumeGame();
            }
        }
    }

    function saveState() {
        localStorage.setItem('quizState', JSON.stringify(currentState));
    }

    function startGame() {
        const username = usernameInput.value.trim();
        if(!username) {
            alert("Please enter a username!");
            return;
        }

        // Check if this browser already played
        if (localStorage.getItem('quizState') && JSON.parse(localStorage.getItem('quizState')).isFinished) {
            alert("You have already played!");
            showLeaderboardOnly();
            return;
        }

        currentState.username = username;
        currentState.timeLeft = 60;
        currentState.score = 0;
        currentState.currentQuestionIndex = 0;
        currentState.isFinished = false;

        saveState();

        landingPage.classList.add('hidden');
        quizPage.classList.remove('hidden');
        leaderboardPage.classList.add('hidden');

        startTimer();
        loadQuestion();
        updateScore();
    }

    function resumeGame() {
        landingPage.classList.add('hidden');
        quizPage.classList.remove('hidden');
        leaderboardPage.classList.add('hidden');
        
        // Resume timer
        startTimer();
        loadQuestion();
        updateScore();
    }

    function startTimer() {
        timerDisplay.innerText = currentState.timeLeft;
        // Clear any existing interval just in case
        if (currentState.timerInterval) clearInterval(currentState.timerInterval);

        currentState.timerInterval = setInterval(() => {
            currentState.timeLeft--;
            timerDisplay.innerText = currentState.timeLeft;
            saveState(); // Save time every second

            if(currentState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function loadQuestion() {
        if(currentState.currentQuestionIndex >= questions.length) {
            endGame();
            return;
        }

        const q = questions[currentState.currentQuestionIndex];
        
        // Update Progress
        const progress = ((currentState.currentQuestionIndex) / questions.length) * 100;
        progressFill.style.width = `${progress}%`;

        // UI Update
        questionText.innerText = q.question;
        optionsContainer.innerHTML = '';

        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.innerText = opt;
            btn.addEventListener('click', () => handleAnswer(index));
            optionsContainer.appendChild(btn);
        });
    }

    function handleAnswer(selectedIndex) {
        // Prevent multiple clicks
        const allBtns = optionsContainer.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.disabled = true);

        const currentQ = questions[currentState.currentQuestionIndex];
        const isCorrect = selectedIndex === currentQ.correctIndex;
        const selectedBtn = allBtns[selectedIndex];

        // Animate
        if(isCorrect) {
            selectedBtn.classList.add('correct');
            currentState.score++;
            updateScore();
        } else {
            selectedBtn.classList.add('wrong');
            // Show correct answer
            allBtns[currentQ.correctIndex].classList.add('correct');
        }

        // Save state immediately after answer
        saveState();

        // Delay next question
        setTimeout(() => {
            currentState.currentQuestionIndex++;
            saveState(); // Update index in storage

            if(currentState.currentQuestionIndex < questions.length) {
                loadQuestion();
            } else {
                endGame();
            }
        }, 1000);
    }

    function updateScore() {
        scoreDisplay.innerText = currentState.score;
    }

    function endGame() {
        clearInterval(currentState.timerInterval);
        currentState.isFinished = true;
        saveState();
        
        showLeaderboardOnly();

        // Submit Score
        submitScore().then(() => {
            fetchLeaderboard();
        });
    }

    function showLeaderboardOnly() {
        landingPage.classList.add('hidden');
        quizPage.classList.add('hidden');
        leaderboardPage.classList.remove('hidden');

        // Fill Results from current state
        resultUsername.innerText = currentState.username;
        finalScoreDisplay.innerText = currentState.score;
        finalTimeDisplay.innerText = currentState.timeLeft;

        // Hide Play Again button if finished
        if (currentState.isFinished) {
            restartBtn.style.display = 'none';
        }
        
        fetchLeaderboard();
    }
    
    async function submitScore() {
        try {
            await fetch('/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentState.username,
                    score: currentState.score,
                    timeRemaining: currentState.timeLeft
                })
            });
        } catch (err) {
            console.error('Error submitting score:', err);
        }
    }

    async function fetchLeaderboard() {
        leaderboardList.innerHTML = '<li>Loading...</li>';
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            
            leaderboardList.innerHTML = '';
            data.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>#${index + 1} ${entry.username}</span>
                    <span>⭐ ${entry.score} | ⏳${entry.timeRemaining}s</span>
                `;
                leaderboardList.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            leaderboardList.innerHTML = '<li>Error loading leaderboard</li>';
        }
    }

    function resetGame() {
        // Only allow reset if specifically allowed, but for this request we want to BLOCK reset
        // equivalent to "Play Again"
        // Since user said "harusnya gak bisa cuyy", we disabled the button in showLeaderboardOnly
        // But if they manually call it or something:
        if (currentState.isFinished) return; 
        
        localStorage.removeItem('quizState');
        currentState = { ...initialState }; // Need access to initial state structure
        // ... rest of reset logic ...
        // Actually, let's just reload the page to be clean or clear manually
        location.reload(); 
    }
});
