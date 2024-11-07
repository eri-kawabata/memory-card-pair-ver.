const IMAGE_PAIRS = [
    ['./image/image1.jpg', './image/image2.jpg'],
    ['./image/image5.jpg', './image/image6.jpg'],
    ['./image/image9.jpg', './image/image10.jpg'],
    ['./image/image13.jpg', './image/image14.jpg'],
    ['./image/image17.jpg', './image/image18.jpg'],
    ['./image/image21.jpg', './image/image22.jpg'],
    ['./image/image25.jpg', '../image/image26.jpg'],
    ['./image/image29.jpg', './image/image30.jpg'],
    ['./image/image33.jpg', './image/image34.jpg'],
    ['./image/image37.jpg', './image/image38.jpg'],
    ['./image/image41.jpg', './image/image42.jpg'],
    ['./image/image45.jpg', './image/image46.jpg']
];

const DIFFICULTY_SETTINGS = {
    easy: { pairs: 6, timeLimit: 60 },
    medium: { pairs: 8, timeLimit: 90 },
    hard: { pairs: 12, timeLimit: 120 }
};

class MemoryGame {
    constructor() {
        this.cards = [];
        this.flipped = [];
        this.solved = [];
        this.moves = 0;
        this.timeRemaining = 60;
        this.gameStarted = false;
        this.isGameOver = false;
        this.soundEnabled = true;
        this.timer = null;

        this.gameBoard = document.getElementById('game-board');
        this.timeDisplay = document.getElementById('time-remaining');
        this.movesDisplay = document.getElementById('moves-count');
        this.difficultySelect = document.getElementById('difficulty');
        this.soundToggle = document.getElementById('sound-toggle');
        this.resetButton = document.getElementById('reset-button');
        this.scoreBoard = document.getElementById('score-board');
        this.startMessage = document.getElementById('start-message');

        this.flipSound = document.getElementById('flip-sound');
        this.matchSound = document.getElementById('match-sound');
        this.victorySound = document.getElementById('victory-sound');
        this.gameoverSound = document.getElementById('gameover-sound');

        this.initializeEventListeners();
        this.loadHighScores();
    }

    initializeEventListeners() {
        this.resetButton.addEventListener('click', () => this.initializeGame());
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.difficultySelect.addEventListener('change', () => {
            this.gameStarted = false;
            this.startMessage.classList.remove('hidden');
        });
    }

    initializeGame() {
        const difficulty = this.difficultySelect.value;
        const settings = DIFFICULTY_SETTINGS[difficulty];

        this.cards = [];
        this.flipped = [];
        this.solved = [];
        this.moves = 0;
        this.timeRemaining = settings.timeLimit;
        this.isGameOver = false;
        this.gameStarted = true;

        this.updateDisplay();
        this.createCards(settings.pairs);
        this.startTimer();

        this.startMessage.classList.add('hidden');
        this.scoreBoard.classList.add('hidden');
        this.gameBoard.className = `game-board ${difficulty}`;
    }

    createCards(pairs) {
        const selectedPairs = IMAGE_PAIRS.slice(0, pairs);
        const cardImages = selectedPairs.flat().sort(() => Math.random() - 0.5);

        this.gameBoard.innerHTML = '';
        cardImages.forEach((imagePath, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.index = index;
            card.dataset.image = imagePath;

            const img = document.createElement('img');
            img.src = imagePath;
            img.classList.add('card-image', 'hidden');
            card.appendChild(img);

            card.addEventListener('click', () => this.handleCardClick(index));
            this.gameBoard.appendChild(card);
            this.cards.push({ index, imagePath });
        });
    }

    handleCardClick(index) {
        if (
            !this.gameStarted ||
            this.flipped.length === 2 ||
            this.flipped.includes(index) ||
            this.solved.includes(index) ||
            this.isGameOver
        ) {
            return;
        }

        this.playSound(this.flipSound);
        this.flipped.push(index);
        this.moves++;
        this.updateDisplay();

        const card = this.gameBoard.children[index];
        const img = card.querySelector('.card-image');
        img.classList.remove('hidden');
        card.classList.add('flipped');

        if (this.flipped.length === 2) {
            this.checkMatch();
        }
    }

    checkMatch() {
        const [first, second] = this.flipped;
        const firstCard = this.cards[first];
        const secondCard = this.cards[second];

        if (firstCard.imagePath === secondCard.imagePath) {
            this.playSound(this.matchSound);
            this.solved.push(...this.flipped);

            if (this.solved.length === this.cards.length) {
                this.handleGameWin();
            }
        }

        setTimeout(() => {
            this.flipped.forEach(index => {
                if (!this.solved.includes(index)) {
                    const card = this.gameBoard.children[index];
                    const img = card.querySelector('.card-image');
                    img.classList.add('hidden');
                    card.classList.remove('flipped');
                }
            });
            this.flipped = [];
        }, 1000);
    }

    playSound(sound) {
        if (this.soundEnabled) {
            sound.currentTime = 0;
            sound.play();
        }
    }

    updateDisplay() {
        this.timeDisplay.textContent = this.timeRemaining;
        this.movesDisplay.textContent = this.moves;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();

            if (this.timeRemaining <= 0) {
                this.handleGameOver();
            }
        }, 1000);
    }

    handleGameWin() {
        this.isGameOver = true;
        clearInterval(this.timer);
        this.playSound(this.victorySound);
        const score = this.calculateScore();
        this.updateHighScores(score);
        this.showScoreBoard(true);
    }

    handleGameOver() {
        this.isGameOver = true;
        clearInterval(this.timer);
        this.playSound(this.gameoverSound);
        this.showScoreBoard(false);
    }

    calculateScore() {
        const baseScore = this.solved.length * 100;
        const timeBonus = this.timeRemaining * 10;
        const movesPenalty = this.moves * 5;
        return Math.max(0, baseScore + timeBonus - movesPenalty);
    }

    updateHighScores(score) {
        const difficulty = this.difficultySelect.value;
        const highScores = this.loadHighScores();

        highScores[difficulty].push({
            score,
            moves: this.moves,
            timeRemaining: this.timeRemaining
        });

        highScores[difficulty].sort((a, b) => b.score - a.score);
        highScores[difficulty] = highScores[difficulty].slice(0, 5);

        localStorage.setItem('memoryGameHighScores', JSON.stringify(highScores));
    }

    loadHighScores() {
        const saved = localStorage.getItem('memoryGameHighScores');
        return saved ? JSON.parse(saved) : { easy: [], medium: [], hard: [] };
    }

    showScoreBoard(won) {
        const difficulty = this.difficultySelect.value;
        const highScores = this.loadHighScores();
        const finalScore = this.calculateScore();

        const scoreBoard = document.getElementById('final-score');
        const highScoresList = document.getElementById('high-scores');

        scoreBoard.textContent = won
            ? `おめでとうございます！スコア: ${finalScore}点 (${this.moves}手 / 残り${this.timeRemaining}秒)`
            : 'タイムアップ！';

        highScoresList.innerHTML = highScores[difficulty]
            .map((score, index) => `
                <div>
                    ${index + 1}位: ${score.score}点
                    (${score.moves}手 / 残り${score.timeRemaining}秒)
                </div>
            `)
            .join('');

        this.scoreBoard.classList.remove('hidden');
    }
}

// ゲームの初期化
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
