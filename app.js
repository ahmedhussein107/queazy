// ==========================================
// Queazy - CSP Practice Quiz Application
// ==========================================

class QuizApp {
    constructor() {
        // State
        this.quizData = null;
        this.selectedSectionIndex = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answered = false;
        this.questions = [];

        // DOM Elements
        this.screens = {
            landing: document.getElementById('landing-screen'),
            quiz: document.getElementById('quiz-screen'),
            results: document.getElementById('results-screen')
        };

        this.elements = {
            sectionList: document.getElementById('section-list'),
            startBtn: document.getElementById('start-quiz-btn'),
            backBtn: document.getElementById('back-btn'),
            sectionTitle: document.getElementById('section-title'),
            progressBar: document.getElementById('progress-bar'),
            questionCounter: document.getElementById('question-counter'),
            scoreDisplay: document.getElementById('score-display'),
            currentQNum: document.getElementById('current-q-num'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            feedbackContainer: document.getElementById('feedback-container'),
            feedbackIcon: document.getElementById('feedback-icon'),
            feedbackText: document.getElementById('feedback-text'),
            correctAnswerText: document.getElementById('correct-answer-text'),
            nextBtn: document.getElementById('next-btn'),
            finalScore: document.getElementById('final-score'),
            totalQuestions: document.getElementById('total-questions'),
            scoreCircleProgress: document.getElementById('score-circle-progress'),
            resultsMessage: document.getElementById('results-message'),
            correctCount: document.getElementById('correct-count'),
            incorrectCount: document.getElementById('incorrect-count'),
            retryBtn: document.getElementById('retry-btn'),
            homeBtn: document.getElementById('home-btn'),
            confetti: document.getElementById('confetti')
        };

        this.init();
    }

    async init() {
        await this.loadQuizData();
        this.bindEvents();
    }

    async loadQuizData() {
        try {
            const response = await fetch('csp_questions.json');
            this.quizData = await response.json();
            this.renderSections();
        } catch (error) {
            console.error('Failed to load quiz data:', error);
            this.elements.sectionList.innerHTML = `
                <div class="error-message">
                    <p>Failed to load quiz data. Please refresh the page.</p>
                </div>
            `;
        }
    }

    renderSections() {
        if (!this.quizData || !this.quizData.sections) return;

        this.elements.sectionList.innerHTML = this.quizData.sections.map((section, index) => `
            <button class="section-item" data-index="${index}">
                <span class="section-number">${index + 1}</span>
                <span class="section-name">${section.section_name}</span>
                <span class="question-count">${section.questions.length} questions</span>
            </button>
        `).join('');
    }

    bindEvents() {
        // Section selection
        this.elements.sectionList.addEventListener('click', (e) => {
            const sectionItem = e.target.closest('.section-item');
            if (!sectionItem) return;

            // Deselect all
            document.querySelectorAll('.section-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Select clicked
            sectionItem.classList.add('selected');
            this.selectedSectionIndex = parseInt(sectionItem.dataset.index);
            this.elements.startBtn.disabled = false;
        });

        // Start quiz
        this.elements.startBtn.addEventListener('click', () => {
            if (this.selectedSectionIndex !== null) {
                this.startQuiz();
            }
        });

        // Back button
        this.elements.backBtn.addEventListener('click', () => {
            this.showScreen('landing');
            this.resetQuiz();
        });

        // Next button
        this.elements.nextBtn.addEventListener('click', () => {
            this.nextQuestion();
        });

        // Options (using event delegation)
        this.elements.optionsContainer.addEventListener('click', (e) => {
            const optionBtn = e.target.closest('.option-btn');
            if (!optionBtn || this.answered) return;

            this.handleAnswer(optionBtn);
        });

        // Retry button
        this.elements.retryBtn.addEventListener('click', () => {
            this.startQuiz();
        });

        // Home button
        this.elements.homeBtn.addEventListener('click', () => {
            this.showScreen('landing');
            this.resetQuiz();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.screens.quiz.classList.contains('active')) {
                if (!this.answered) {
                    const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                    const index = keyMap[e.key.toLowerCase()];
                    if (index !== undefined) {
                        const options = this.elements.optionsContainer.querySelectorAll('.option-btn');
                        if (options[index]) {
                            this.handleAnswer(options[index]);
                        }
                    }
                } else if (e.key === 'Enter' || e.key === ' ') {
                    this.nextQuestion();
                }
            }
        });
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
    }

    startQuiz() {
        const section = this.quizData.sections[this.selectedSectionIndex];
        this.questions = this.shuffleArray([...section.questions]);
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answered = false;

        this.elements.sectionTitle.textContent = section.section_name;
        this.elements.scoreDisplay.textContent = '0';

        this.showScreen('quiz');
        this.displayQuestion();
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const totalQuestions = this.questions.length;

        // Update progress
        const progress = ((this.currentQuestionIndex) / totalQuestions) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
        this.elements.questionCounter.textContent = `${this.currentQuestionIndex + 1}/${totalQuestions}`;
        this.elements.currentQNum.textContent = this.currentQuestionIndex + 1;

        // Display question
        this.elements.questionText.textContent = question.question;

        // Display options
        this.elements.optionsContainer.innerHTML = question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            return `
                <button class="option-btn" data-option="${option}">
                    <span class="option-letter">${letter}</span>
                    <span class="option-text">${option.substring(3)}</span>
                    <span class="option-icon">
                        <svg class="icon-correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        <svg class="icon-incorrect" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </span>
                </button>
            `;
        }).join('');

        // Reset state
        this.answered = false;
        this.elements.feedbackContainer.classList.add('hidden');
        this.elements.feedbackContainer.classList.remove('correct', 'incorrect');
        this.elements.nextBtn.classList.add('hidden');
    }

    handleAnswer(optionBtn) {
        if (this.answered) return;
        this.answered = true;

        const selectedAnswer = optionBtn.dataset.option;
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = selectedAnswer === question.answer;

        // Disable all options
        const allOptions = this.elements.optionsContainer.querySelectorAll('.option-btn');
        allOptions.forEach(btn => {
            btn.disabled = true;

            // Highlight correct answer
            if (btn.dataset.option === question.answer) {
                btn.classList.add('correct');
            }
        });

        // Mark selected answer
        if (isCorrect) {
            optionBtn.classList.add('correct');
            this.score++;
            this.elements.scoreDisplay.textContent = this.score;
        } else {
            optionBtn.classList.add('incorrect');
        }

        // Show feedback
        this.showFeedback(isCorrect, question.answer);

        // Show next button
        this.elements.nextBtn.classList.remove('hidden');
    }

    showFeedback(isCorrect, correctAnswer) {
        const container = this.elements.feedbackContainer;
        container.classList.remove('hidden', 'correct', 'incorrect');
        container.classList.add(isCorrect ? 'correct' : 'incorrect');

        // Set icon
        this.elements.feedbackIcon.innerHTML = isCorrect
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                   <path d="M20 6L9 17l-5-5"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                   <path d="M18 6L6 18M6 6l12 12"/>
               </svg>`;

        // Set text
        this.elements.feedbackText.textContent = isCorrect
            ? this.getRandomMessage('correct')
            : this.getRandomMessage('incorrect');

        this.elements.correctAnswerText.textContent = isCorrect
            ? ''
            : `Correct answer: ${correctAnswer}`;
    }

    getRandomMessage(type) {
        const messages = {
            correct: [
                'Excellent!',
                'Well done!',
                'Perfect!',
                'Great job!',
                'Correct!',
                'Amazing!',
                'You got it!',
                'Brilliant!'
            ],
            incorrect: [
                'Not quite!',
                'Incorrect',
                'Wrong answer',
                'Try to remember this one!',
                'Keep learning!',
                'Almost there!'
            ]
        };

        const list = messages[type];
        return list[Math.floor(Math.random() * list.length)];
    }

    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.displayQuestion();
        }
    }

    showResults() {
        const total = this.questions.length;
        const percentage = (this.score / total) * 100;

        // Update stats
        this.elements.finalScore.textContent = this.score;
        this.elements.totalQuestions.textContent = total;
        this.elements.correctCount.textContent = this.score;
        this.elements.incorrectCount.textContent = total - this.score;

        // Animate score circle
        const circumference = 2 * Math.PI * 54; // radius = 54
        const offset = circumference - (percentage / 100) * circumference;

        setTimeout(() => {
            this.elements.scoreCircleProgress.style.strokeDashoffset = offset;
        }, 100);

        // Set message
        this.elements.resultsMessage.textContent = this.getResultMessage(percentage);

        // Show screen
        this.showScreen('results');

        // Confetti for good scores
        if (percentage >= 70) {
            this.createConfetti();
        }
    }

    getResultMessage(percentage) {
        if (percentage === 100) return '🏆 Perfect score! You\'re a CSP master!';
        if (percentage >= 80) return '🌟 Excellent work! You really know your stuff!';
        if (percentage >= 60) return '👍 Good job! Keep practicing!';
        if (percentage >= 40) return '📚 Not bad! Review the material and try again.';
        return '💪 Keep studying! You\'ll get better with practice.';
    }

    createConfetti() {
        const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
        const confettiCount = 50;

        this.elements.confetti.innerHTML = '';

        for (let i = 0; i < confettiCount; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.animationDuration = `${2 + Math.random() * 2}s`;

            // Random shapes
            if (Math.random() > 0.5) {
                piece.style.borderRadius = '50%';
            } else {
                piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            }

            this.elements.confetti.appendChild(piece);
        }

        // Clean up after animation
        setTimeout(() => {
            this.elements.confetti.innerHTML = '';
        }, 5000);
    }

    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answered = false;
        this.questions = [];

        // Reset progress circle
        this.elements.scoreCircleProgress.style.strokeDashoffset = 339.292;

        // Keep section selected
        // Don't reset selectedSectionIndex so user can retry easily
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});
