// ==========================================
// Queazy - IT Project Management Study Hub
// ==========================================

class QuizApp {
    constructor() {
        this.lectureData = null;
        this.currentLecture = null;
        this.currentMode = null;
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;

        this.screens = {
            landing: document.getElementById('landing-screen'),
            dashboard: document.getElementById('dashboard-screen'),
            mcq: document.getElementById('mcq-screen'),
            tf: document.getElementById('tf-screen'),
            open: document.getElementById('open-screen'),
            case: document.getElementById('case-screen'),
            results: document.getElementById('results-screen')
        };

        this.init();
    }

    async init() {
        this.renderLectureCards();
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
    // Landing Screen
    // ==========================================
    renderLectureCards() {
        const lectures = [
            { num: 1, title: 'Business Informatics & PM Fundamentals' },
            { num: 2, title: 'Software Development Life Cycle & Methodologies' },
            { num: 3, title: 'IT Project Selection, Integration & Procurement' },
            { num: 4, title: 'IT Project Scope Management' },
            { num: 5, title: 'IT Project Time Management' }
        ];

        const grid = document.getElementById('lecture-grid');
        grid.innerHTML = lectures.map(l => `
            <div class="lecture-card" data-lecture="${l.num}" role="button" tabindex="0">
                <div class="lecture-num">${l.num}</div>
                <div class="lecture-title">${l.title}</div>
                <div class="lecture-meta">
                    <span>30 MCQ</span>
                    <span>30 T/F</span>
                    <span>Q&A</span>
                    <span>Cases</span>
                </div>
            </div>
        `).join('');
    }

    // ==========================================
    // Data Loading
    // ==========================================
    async loadLecture(num) {
        try {
            const res = await fetch(`data/lecture${num}.json`);
            this.lectureData = await res.json();
            this.currentLecture = num;
            return true;
        } catch (err) {
            console.error('Failed to load lecture:', err);
            alert('Failed to load lecture data. Please try again.');
            return false;
        }
    }

    // ==========================================
    // Dashboard
    // ==========================================
    showDashboard() {
        const d = this.lectureData;
        document.getElementById('dash-lecture-label').textContent = d.lecture;
        document.getElementById('dash-lecture-title').textContent = d.title;
        this.showScreen('dashboard');
    }

    // ==========================================
    // MCQ Quiz
    // ==========================================
    startMCQ() {
        this.currentMode = 'mcq';
        this.questions = this.shuffle([...this.lectureData.mcq]);
        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;

        document.getElementById('mcq-section-title').textContent = `${this.lectureData.lecture} — MCQ`;
        document.getElementById('mcq-score').textContent = '0';
        this.showScreen('mcq');
        this.displayMCQ();
    }

    displayMCQ() {
        const q = this.questions[this.currentIndex];
        const total = this.questions.length;
        const progress = (this.currentIndex / total) * 100;

        document.getElementById('mcq-progress-bar').style.width = `${progress}%`;
        document.getElementById('mcq-counter').textContent = `${this.currentIndex + 1}/${total}`;
        document.getElementById('mcq-q-num').textContent = this.currentIndex + 1;
        document.getElementById('mcq-question').textContent = q.question;

        document.getElementById('mcq-options').innerHTML = q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
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
    // True/False Quiz
    // ==========================================
    startTF() {
        this.currentMode = 'tf';
        this.questions = this.shuffle([...this.lectureData.trueFalse]);
        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;

        document.getElementById('tf-section-title').textContent = `${this.lectureData.lecture} — True/False`;
        document.getElementById('tf-score').textContent = '0';
        this.showScreen('tf');
        this.displayTF();
    }

    displayTF() {
        const q = this.questions[this.currentIndex];
        const total = this.questions.length;
        const progress = (this.currentIndex / total) * 100;

        document.getElementById('tf-progress-bar').style.width = `${progress}%`;
        document.getElementById('tf-counter').textContent = `${this.currentIndex + 1}/${total}`;
        document.getElementById('tf-q-num').textContent = this.currentIndex + 1;
        document.getElementById('tf-statement').textContent = q.statement;

        // Reset buttons
        const btns = document.querySelectorAll('#tf-buttons .tf-btn');
        btns.forEach(b => {
            b.disabled = false;
            b.classList.remove('selected', 'correct', 'incorrect');
        });

        this.answered = false;
        const fb = document.getElementById('tf-feedback');
        fb.classList.add('hidden');
        fb.classList.remove('correct', 'incorrect');
        document.getElementById('tf-next-btn').classList.add('hidden');
    }

    handleTFAnswer(btn) {
        if (this.answered) return;
        this.answered = true;

        const selected = btn.dataset.answer === 'true';
        const q = this.questions[this.currentIndex];
        const isCorrect = selected === q.answer;

        const btns = document.querySelectorAll('#tf-buttons .tf-btn');
        btns.forEach(b => {
            b.disabled = true;
        });

        btn.classList.add('selected');
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            this.score++;
            document.getElementById('tf-score').textContent = this.score;
        }

        // Show feedback with justification
        const fb = document.getElementById('tf-feedback');
        fb.classList.remove('hidden', 'correct', 'incorrect');
        fb.classList.add(isCorrect ? 'correct' : 'incorrect');

        document.getElementById('tf-feedback-icon').innerHTML = isCorrect
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

        document.getElementById('tf-feedback-text').textContent = isCorrect
            ? this.randomMsg('correct') : this.randomMsg('incorrect');

        document.getElementById('tf-justification-text').textContent = q.justification;
        document.getElementById('tf-next-btn').classList.remove('hidden');
    }

    nextTF() {
        this.currentIndex++;
        if (this.currentIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.displayTF();
        }
    }

    // ==========================================
    // Open-Ended
    // ==========================================
    showOpenEnded() {
        const data = this.lectureData.openEnded;
        document.getElementById('open-lecture-title').textContent = this.lectureData.title;

        const container = document.getElementById('open-cards');
        container.innerHTML = data.map((item, i) => `
            <div class="study-card" data-index="${i}">
                <div class="study-card-header">
                    <div class="study-card-num">${i + 1}</div>
                    <div class="study-card-question">${item.question}</div>
                    <div class="study-card-toggle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </div>
                </div>
                <div class="study-card-answer">
                    <div class="answer-content">${item.answer}</div>
                </div>
            </div>
        `).join('');

        this.showScreen('open');
    }

    // ==========================================
    // Case Studies
    // ==========================================
    showCaseStudies() {
        const data = this.lectureData.caseStudies;
        document.getElementById('case-lecture-title').textContent = this.lectureData.title;

        const container = document.getElementById('case-cards');
        container.innerHTML = data.map((cs, i) => `
            <div class="case-card">
                <div class="case-card-header">
                    <div class="case-label">Case Study ${i + 1}</div>
                    <h3>${cs.title}</h3>
                </div>
                <div class="case-card-body">
                    <div class="case-scenario">${cs.scenario}</div>
                    <div class="case-questions">
                        <h4>📝 Discussion Questions</h4>
                        <ol>
                            ${cs.questions.map(q => `<li>${q}</li>`).join('')}
                        </ol>
                    </div>
                    <button class="case-analysis-toggle" data-case="${i}">
                        <span>Show Analysis</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    <div class="case-analysis" id="case-analysis-${i}">
                        ${cs.analysis}
                    </div>
                </div>
            </div>
        `).join('');

        this.showScreen('case');
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
        // Lecture card click
        document.getElementById('lecture-grid').addEventListener('click', async (e) => {
            const card = e.target.closest('.lecture-card');
            if (!card) return;
            const num = parseInt(card.dataset.lecture);
            card.style.opacity = '0.7';
            const ok = await this.loadLecture(num);
            card.style.opacity = '1';
            if (ok) this.showDashboard();
        });

        // Lecture card keyboard
        document.getElementById('lecture-grid').addEventListener('keydown', async (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const card = e.target.closest('.lecture-card');
            if (!card) return;
            e.preventDefault();
            const num = parseInt(card.dataset.lecture);
            const ok = await this.loadLecture(num);
            if (ok) this.showDashboard();
        });

        // Dashboard back
        document.getElementById('dash-back-btn').addEventListener('click', () => this.showScreen('landing'));

        // Mode selection
        document.querySelector('.mode-grid').addEventListener('click', (e) => {
            const card = e.target.closest('.mode-card');
            if (!card) return;
            const mode = card.dataset.mode;
            if (mode === 'mcq') this.startMCQ();
            else if (mode === 'tf') this.startTF();
            else if (mode === 'open') this.showOpenEnded();
            else if (mode === 'case') this.showCaseStudies();
        });

        // MCQ events
        document.getElementById('mcq-back-btn').addEventListener('click', () => this.showDashboard());
        document.getElementById('mcq-options').addEventListener('click', (e) => {
            const btn = e.target.closest('.option-btn');
            if (btn) this.handleMCQAnswer(btn);
        });
        document.getElementById('mcq-next-btn').addEventListener('click', () => this.nextMCQ());

        // T/F events
        document.getElementById('tf-back-btn').addEventListener('click', () => this.showDashboard());
        document.getElementById('tf-buttons').addEventListener('click', (e) => {
            const btn = e.target.closest('.tf-btn');
            if (btn) this.handleTFAnswer(btn);
        });
        document.getElementById('tf-next-btn').addEventListener('click', () => this.nextTF());

        // Open-ended events
        document.getElementById('open-back-btn').addEventListener('click', () => this.showDashboard());
        document.getElementById('open-cards').addEventListener('click', (e) => {
            const header = e.target.closest('.study-card-header');
            if (!header) return;
            const card = header.closest('.study-card');
            card.classList.toggle('open');
        });

        // Case study events
        document.getElementById('case-back-btn').addEventListener('click', () => this.showDashboard());
        document.getElementById('case-cards').addEventListener('click', (e) => {
            const toggle = e.target.closest('.case-analysis-toggle');
            if (!toggle) return;
            const idx = toggle.dataset.case;
            const analysis = document.getElementById(`case-analysis-${idx}`);
            const isOpen = analysis.classList.toggle('open');
            toggle.classList.toggle('open', isOpen);
            toggle.querySelector('span').textContent = isOpen ? 'Hide Analysis' : 'Show Analysis';
        });

        // Results events
        document.getElementById('retry-btn').addEventListener('click', () => {
            if (this.currentMode === 'mcq') this.startMCQ();
            else if (this.currentMode === 'tf') this.startTF();
        });
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('landing'));

        // Keyboard nav for quizzes
        document.addEventListener('keydown', (e) => {
            // MCQ shortcuts
            if (this.screens.mcq.classList.contains('active')) {
                if (!this.answered) {
                    const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                    const idx = map[e.key.toLowerCase()];
                    if (idx !== undefined) {
                        const opts = document.querySelectorAll('#mcq-options .option-btn');
                        if (opts[idx]) this.handleMCQAnswer(opts[idx]);
                    }
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextMCQ();
                }
            }

            // T/F shortcuts
            if (this.screens.tf.classList.contains('active')) {
                if (!this.answered) {
                    if (e.key.toLowerCase() === 't' || e.key === '1') {
                        const btn = document.querySelector('.tf-btn.tf-true');
                        if (btn) this.handleTFAnswer(btn);
                    } else if (e.key.toLowerCase() === 'f' || e.key === '2') {
                        const btn = document.querySelector('.tf-btn.tf-false');
                        if (btn) this.handleTFAnswer(btn);
                    }
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextTF();
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
