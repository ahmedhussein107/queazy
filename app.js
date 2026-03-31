class QuizApp {
    constructor() {
        this.allQuestions = [];
        this.questions = [];
        this.currentIndex = 0;
        this.currentSection = 0;
        this.score = 0;
        this.answered = false;

        this.screens = {
            landing: document.getElementById('landing-screen'),
            quiz: document.getElementById('quiz-screen'),
            results: document.getElementById('results-screen')
        };

        this.init();
    }

    async init() {
        this.bindGlobalEvents();
        await this.loadData();
    }

    async loadData() {
        try {
            const res = await fetch('data/all_questions.json');
            this.allQuestions = await res.json();
            
            document.getElementById('total-pool-count').textContent = this.allQuestions.length;
            this.renderSections();
        } catch (err) {
            console.error(err);
            document.getElementById('sections-container').innerHTML = `
                <div class="loading-state" style="color: #fb7185;">
                    <svg style="width: 48px; height: 48px; margin-bottom: 1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <h2>Failed to load questions</h2>
                    <p>Make sure you are running via a local web server (e.g., Python HTTP server).</p>
                </div>
            `;
        }
    }

    renderSections() {
        const container = document.getElementById('sections-container');
        if (!container || !this.allQuestions.length) return;

        const maxPerSection = 100;
        const totalSections = Math.ceil(this.allQuestions.length / maxPerSection);

        container.innerHTML = '';

        for (let i = 0; i < totalSections; i++) {
            const start = i * maxPerSection;
            const end = Math.min(start + maxPerSection, this.allQuestions.length);
            
            const card = document.createElement('div');
            card.className = 'section-card';
            card.style.setProperty('--card-grad', `var(--sec-${(i % 5) + 1})`);
            
            card.innerHTML = `
                <div class="section-icon">${i + 1}</div>
                <div class="section-info">
                    <h3>Section ${i + 1}</h3>
                    <p>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        Questions ${start + 1} - ${end}
                    </p>
                </div>
            `;

            card.addEventListener('click', () => this.startExam(i, maxPerSection));
            container.appendChild(card);
        }
    }

    switchScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
        window.scrollTo(0, 0);
    }

    startExam(sectionIndex, maxPerSection = 100) {
        this.currentSection = sectionIndex;
        const start = sectionIndex * maxPerSection;
        const end = start + maxPerSection;
        
        // Slice and optionally shuffle
        const sectionData = this.allQuestions.slice(start, end);
        this.questions = this.shuffle([...sectionData]);

        if (this.questions.length === 0) return;

        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;

        document.getElementById('section-title').textContent = `Section ${sectionIndex + 1}`;
        document.getElementById('score-counter').textContent = '0';
        
        this.switchScreen('quiz');
        this.renderQuestion();
    }

    renderQuestion() {
        const q = this.questions[this.currentIndex];
        const total = this.questions.length;
        const progress = ((this.currentIndex) / total) * 100;

        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('question-counter').textContent = `${this.currentIndex + 1}/${total}`;
        document.getElementById('q-num-badge').textContent = this.currentIndex + 1;
        document.getElementById('question-text').textContent = q.question;

        // Render Options
        const optsContainer = document.getElementById('options-container');
        optsContainer.innerHTML = '';
        
        Object.entries(q.options).forEach(([letter, text]) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.letter = letter;
            btn.innerHTML = `
                <span class="option-letter">${letter}</span>
                <span class="option-text">${text}</span>
                <div class="option-icon check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div class="option-icon cross">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
            `;
            btn.addEventListener('click', () => this.handleAnswer(btn, letter, q));
            optsContainer.appendChild(btn);
        });

        // Reset state
        this.answered = false;
        document.getElementById('feedback-panel').className = 'feedback-panel hidden';
        document.getElementById('btn-next').classList.add('hidden');
    }

    handleAnswer(btn, userLetter, questionData) {
        if (this.answered) return;
        this.answered = true;

        const correctLetter = questionData.answer;
        const isCorrect = userLetter === correctLetter;

        // Reveal answers
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => {
            b.disabled = true;
            if (b.dataset.letter === correctLetter) {
                b.classList.add('correct');
            } else if (b.dataset.letter === userLetter && !isCorrect) {
                b.classList.add('incorrect');
            }
        });

        // Update score
        if (isCorrect) {
            this.score++;
            document.getElementById('score-counter').textContent = this.score;
        }

        // Show feedback
        const fbPanel = document.getElementById('feedback-panel');
        const fbIcon = document.getElementById('feedback-icon');
        const fbHeading = document.getElementById('feedback-heading');
        const fbDesc = document.getElementById('feedback-desc');

        fbPanel.className = `feedback-panel ${isCorrect ? 'success' : 'error'}`;
        
        if (isCorrect) {
            fbIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;
            fbHeading.textContent = "Correct!";
            fbDesc.textContent = "Great job, you nailed it.";
        } else {
            fbIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
            fbHeading.textContent = "Incorrect";
            fbDesc.textContent = `The correct answer is ${correctLetter}.`;
        }

        document.getElementById('btn-next').classList.remove('hidden');
        
        // Auto scroll to next button on mobile
        setTimeout(() => {
            document.getElementById('btn-next').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    nextProcess() {
        this.currentIndex++;
        if (this.currentIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.renderQuestion();
        }
    }

    showResults() {
        const total = this.questions.length;
        const pct = (this.score / total) * 100;

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-total').textContent = total;
        document.getElementById('stat-correct').textContent = this.score;
        document.getElementById('stat-incorrect').textContent = total - this.score;

        // Animate ring
        const circle = document.getElementById('score-ring');
        const radius = 70;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);

        // Feedback text
        const msgEl = document.getElementById('performance-msg');
        if (pct >= 90) msgEl.textContent = '🏆 Outstanding! Cloud Master!';
        else if (pct >= 75) msgEl.textContent = '🌟 Excellent performance!';
        else if (pct >= 50) msgEl.textContent = '👍 Good effort, keep studying!';
        else msgEl.textContent = '📚 Review the concepts and try again.';

        this.switchScreen('results');

        if (pct >= 70) this.shootConfetti();
    }

    bindGlobalEvents() {
        document.getElementById('btn-back').addEventListener('click', () => {
            if(confirm('Are you sure you want to exit the current exam? Progress will be lost.')) {
                this.switchScreen('landing');
            }
        });
        
        document.getElementById('btn-next').addEventListener('click', () => this.nextProcess());
        
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.startExam(this.currentSection); // restart same section
        });
        
        document.getElementById('btn-home').addEventListener('click', () => {
            this.switchScreen('landing');
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.screens.quiz.classList.contains('active')) {
                if (!this.answered) {
                    const keyMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a':'A', 'b':'B', 'c':'C', 'd':'D' };
                    const letter = keyMap[e.key.toLowerCase()];
                    if (letter) {
                        const btn = document.querySelector(`.option-btn[data-letter="${letter}"]`);
                        if (btn) btn.click();
                    }
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextProcess();
                }
            }
        });
    }

    shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    shootConfetti() {
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#34D399', '#FBBF24'];
        const container = document.getElementById('confetti');
        container.innerHTML = '';
        
        for (let i = 0; i < 75; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.background = colors[Math.floor(Math.random() * colors.length)];
            el.style.animationDuration = (Math.random() * 3 + 2) + 's';
            el.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(el);
        }
        setTimeout(() => container.innerHTML = '', 6000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizApp();
});
