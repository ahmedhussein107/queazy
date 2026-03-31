// ==========================================
// Queazy - Cloud Computing Exam Hub
// ==========================================

class QuizApp {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;

        this.screens = {
            landing: document.getElementById('landing-screen'),
            mcq: document.getElementById('mcq-screen'),
            results: document.getElementById('results-screen')
        };

        this.init();
    }

    init() {
        this.bindEvents();
    }

    // ==========================================
    // Navigation
    // ==========================================
    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
        window.scrollTo(0, 0);
    }

    // ==========================================
    // Data Loading
    // ==========================================
    async loadQuestions() {
        try {
            const res = await fetch(`data/questions.json`);
            let data = await res.json();
            // Shuffle questions
            this.questions = this.shuffle([...data]);
            return true;
        } catch (err) {
            console.error('Failed to load questions:', err);
            alert('Failed to load exam data. Please try again or assure you are running via a local server.');
            return false;
        }
    }

    // ==========================================
    // MCQ Exam
    // ==========================================
    async startExam() {
        document.getElementById('start-exam-btn').textContent = "Loading...";
        document.getElementById('start-exam-btn').disabled = true;
        const success = await this.loadQuestions();
        document.getElementById('start-exam-btn').textContent = "Start Exam";
        document.getElementById('start-exam-btn').disabled = false;

        if (success) {
            this.currentIndex = 0;
            this.score = 0;
            this.answered = false;

            document.getElementById('mcq-score').textContent = '0';
            this.showScreen('mcq');
            this.displayMCQ();
        }
    }

    displayMCQ() {
        const q = this.questions[this.currentIndex];
        const total = this.questions.length;
        const progress = (this.currentIndex / total) * 100;

        document.getElementById('mcq-progress-bar').style.width = `${progress}%`;
        document.getElementById('mcq-counter').textContent = `${this.currentIndex + 1}/${total}`;
        document.getElementById('mcq-q-num').textContent = this.currentIndex + 1;
        document.getElementById('mcq-question').textContent = q.question;

        // the q.options is an object like {"A": "text", "B": "text"}
        const optionsHtml = Object.entries(q.options).map(([letter, opt]) => {
            return `
                <button class="option-btn" data-answer="${letter}">
                    <span class="option-letter">${letter}</span>
                    <span class="option-text">${opt}</span>
                    <span class="option-icon icon-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                    </span>
                    <span class="option-icon icon-x">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </span>
                </button>
            `;
        }).join('');

        document.getElementById('mcq-options').innerHTML = optionsHtml;

        this.answered = false;
        const fb = document.getElementById('mcq-feedback');
        fb.classList.add('hidden');
        fb.classList.remove('correct', 'incorrect');
        document.getElementById('mcq-next-btn').classList.add('hidden');
    }

    handleMCQAnswer(btn) {
        if (this.answered) return;
        this.answered = true;

        const selected = btn.dataset.answer;
        const q = this.questions[this.currentIndex];
        const isCorrect = selected === q.answer;

        const allBtns = document.querySelectorAll('#mcq-options .option-btn');
        allBtns.forEach(b => {
            b.disabled = true;
            if (b.dataset.answer === q.answer) b.classList.add('correct');
        });

        if (isCorrect) {
            btn.classList.add('correct');
            this.score++;
            document.getElementById('mcq-score').textContent = this.score;
        } else {
            btn.classList.add('incorrect');
        }

        this.showMCQFeedback(isCorrect, q.explanation);
        document.getElementById('mcq-next-btn').classList.remove('hidden');
    }

    showMCQFeedback(isCorrect, explanation) {
        const fb = document.getElementById('mcq-feedback');
        fb.classList.remove('hidden', 'correct', 'incorrect');
        fb.classList.add(isCorrect ? 'correct' : 'incorrect');

        document.getElementById('mcq-feedback-icon').innerHTML = isCorrect
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

        document.getElementById('mcq-feedback-text').textContent = isCorrect
            ? this.randomMsg('correct') : this.randomMsg('incorrect');

        document.getElementById('mcq-explanation').textContent = explanation || '';
    }

    nextMCQ() {
        this.currentIndex++;
        if (this.currentIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.displayMCQ();
        }
    }

    // ==========================================
    // Results
    // ==========================================
    showResults() {
        const total = this.questions.length;
        const pct = (this.score / total) * 100;

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('total-questions').textContent = total;
        document.getElementById('correct-count').textContent = this.score;
        document.getElementById('incorrect-count').textContent = total - this.score;

        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (pct / 100) * circumference;
        const circle = document.getElementById('score-circle-progress');
        circle.style.strokeDashoffset = circumference;

        setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);

        document.getElementById('results-message').textContent = this.getResultMessage(pct);
        this.showScreen('results');

        if (pct >= 70) this.createConfetti();
    }

    getResultMessage(pct) {
        if (pct === 100) return '🏆 Perfect score! You\'re a master!';
        if (pct >= 80) return '🌟 Excellent! You really know your stuff!';
        if (pct >= 60) return '👍 Good job! Keep practicing!';
        if (pct >= 40) return '📚 Not bad! Review the material and try again.';
        return '💪 Keep studying! You\'ll get better with practice.';
    }

    // ==========================================
    // Events
    // ==========================================
    bindEvents() {
        // Start Exam button
        document.getElementById('start-exam-btn').addEventListener('click', () => {
            this.startExam();
        });

        // MCQ events
        document.getElementById('mcq-back-btn').addEventListener('click', () => this.showScreen('landing'));
        document.getElementById('mcq-options').addEventListener('click', (e) => {
            const btn = e.target.closest('.option-btn');
            if (btn) this.handleMCQAnswer(btn);
        });
        document.getElementById('mcq-next-btn').addEventListener('click', () => this.nextMCQ());

        // Results events
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startExam();
        });
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('landing'));

        // Keyboard nav for quizzes
        document.addEventListener('keydown', (e) => {
            if (this.screens.mcq.classList.contains('active')) {
                if (!this.answered) {
                    const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D' };
                    const letter = map[e.key.toLowerCase()];
                    if (letter) {
                        const btn = document.querySelector(`#mcq-options .option-btn[data-answer="${letter}"]`);
                        if (btn) this.handleMCQAnswer(btn);
                    }
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextMCQ();
                }
            }
        });
    }

    // ==========================================
    // Utilities
    // ==========================================
    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    randomMsg(type) {
        const msgs = {
            correct: ['Excellent!', 'Well done!', 'Perfect!', 'Great job!', 'Correct!', 'Amazing!', 'Brilliant!', 'You got it!'],
            incorrect: ['Not quite!', 'Incorrect', 'Wrong answer', 'Try to remember this!', 'Keep learning!', 'Almost there!']
        };
        const list = msgs[type];
        return list[Math.floor(Math.random() * list.length)];
    }

    createConfetti() {
        const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
        const el = document.getElementById('confetti');
        el.innerHTML = '';

        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.animationDuration = `${2 + Math.random() * 2}s`;
            if (Math.random() > 0.5) piece.style.borderRadius = '50%';
            else piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            el.appendChild(piece);
        }

        setTimeout(() => { el.innerHTML = ''; }, 5000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});
