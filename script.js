/* ===========================
   POMIIDORO — script.js
   =========================== */

const MODES = {
    pomodoro: { label: 'pomodoro', defaultMin: 25 },
    short: { label: 'short', defaultMin: 5 },
    long: { label: 'long', defaultMin: 15 },
};

let currentMode = 'pomodoro';
let timerInterval = null;
let isRunning = false;
let timeLeft = 25 * 60;    
let totalTime = 25 * 60;
let sessionCount = 0;           
let completedSessions = 0;      

// Mascot messages per mode
const MASCOT_MSGS = {
    pomodoro: [
        "Let's focus! You got this~ 💪",
        "Stay in the zone! 🎯",
        "One step at a time 🍅",
        "You're doing amazing! ✨",
        "Focus mode activated! 🧠",
    ],
    short: [
        "Break time! Stretch a bit~ 🐾",
        "Relax your eyes 👀",
        "Breathe in, breathe out 🌸",
        "Snack time? 🍪",
    ],
    long: [
        "Great work! Enjoy your break 🌙",
        "You earned this rest! 💤",
        "Take a proper break~ 🫖",
        "Reset and recharge! 🔋",
    ],
};

const THEME_MASCOTS = {
    tomato: '🍅',
    froggie: '🐸',
    bunny: '🐰',
    bear: '🐻',
    melon: '🍈',
    valentine: '💖',
};

const COMPLETE_MSGS = {
    pomodoro: ['🍅 Pomodoro done! Time for a break~', '✨ Session complete! Great work!', '🎉 You crushed it! Take a breather.'],
    short: ['☕ Break over! Ready to focus?', '🌟 Back to it! You got this~'],
    long: ['🌙 Long break done! Let\'s go again!', '🔋 Fully recharged! Time to focus~'],
};

// ─── DOM Elements ─────────────────────────────────────────────
const timerDisplay = document.getElementById('timerDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const progressCircle = document.getElementById('progressCircle');
const mascotEl = document.getElementById('mascot');
const mascotSpeech = document.getElementById('mascotSpeech');
const sessionDots = document.getElementById('sessionDots');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// ─── Helpers ──────────────────────────────────────────────────
function fmt(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function getCustomTime(mode) {
    const map = { pomodoro: 'pomodoroTime', short: 'shortTime', long: 'longTime' };
    const el = document.getElementById(map[mode]);
    return el ? (parseInt(el.value) || MODES[mode].defaultMin) : MODES[mode].defaultMin;
}

function updateProgress() {
    const CIRCUMFERENCE = 2 * Math.PI * 54; // 339.29
    const ratio = timeLeft / totalTime;
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
}

function updateDisplay() {
    timerDisplay.textContent = fmt(timeLeft);
    document.title = `${fmt(timeLeft)} — Pomiidoro 🍅`;
    updateProgress();
}

function randomMsg(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function setMascotMsg(msg) {
    mascotSpeech.style.opacity = '0';
    setTimeout(() => {
        mascotSpeech.textContent = msg;
        mascotSpeech.style.opacity = '1';
    }, 200);
}

function updateSessionDots() {
    const dots = sessionDots.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < (sessionCount % 4));
    });
}

function showToast(msg) {
    toastMsg.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) { /* Audio not supported */ }
}

// ─── Timer Logic ──────────────────────────────────────────────
function startTimer() {
    isRunning = true;
    startPauseBtn.textContent = '⏸ Pause';
    mascotEl.style.animationPlayState = 'running';
    setMascotMsg(randomMsg(MASCOT_MSGS[currentMode]));

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            onTimerComplete();
            return;
        }
        timeLeft--;
        updateDisplay();

        // Change mascot message occasionally
        if (timeLeft % 120 === 0 && timeLeft > 0) {
            setMascotMsg(randomMsg(MASCOT_MSGS[currentMode]));
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    startPauseBtn.textContent = '▶ Resume';
    mascotEl.style.animationPlayState = 'paused';
    setMascotMsg('Paused... take a breath~ 😌');
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    const min = getCustomTime(currentMode);
    totalTime = min * 60;
    timeLeft = totalTime;
    startPauseBtn.textContent = '▶ Start';
    mascotEl.style.animationPlayState = 'running';
    updateDisplay();
    setMascotMsg(randomMsg(MASCOT_MSGS[currentMode]));
}

function onTimerComplete() {
    playBeep();
    startPauseBtn.textContent = '▶ Start';
    mascotEl.style.animationPlayState = 'running';

    if (currentMode === 'pomodoro') {
        completedSessions++;
        sessionCount = (sessionCount + 1) % 4;
        updateSessionDots();
        showToast(randomMsg(COMPLETE_MSGS.pomodoro));
        // Auto-suggest next break
        if (sessionCount === 0) {
            setMascotMsg('🌙 4 done! Time for a long break!');
        } else {
            setMascotMsg('☕ Nice! Switch to short break~');
        }
    } else {
        showToast(randomMsg(COMPLETE_MSGS[currentMode]));
        setMascotMsg('🍅 Back to focus!');
    }

    // reset timer to start value for current mode
    const min = getCustomTime(currentMode);
    totalTime = min * 60;
    timeLeft = totalTime;
    updateDisplay();
}

// ─── Mode Switching ───────────────────────────────────────────
function switchMode(mode) {
    currentMode = mode;
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    const min = getCustomTime(mode);
    totalTime = min * 60;
    timeLeft = totalTime;
    startPauseBtn.textContent = '▶ Start';
    mascotEl.style.animationPlayState = 'running';
    updateDisplay();
    setMascotMsg(randomMsg(MASCOT_MSGS[mode]));

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

// ─── Custom Time Inputs ────────────────────────────────────────
function changeTime(mode, delta) {
    const map = { pomodoro: 'pomodoroTime', short: 'shortTime', long: 'longTime' };
    const el = document.getElementById(map[mode]);
    if (!el) return;
    let val = parseInt(el.value) + delta;
    const max = { pomodoro: 60, short: 30, long: 60 };
    val = Math.max(1, Math.min(max[mode], val));
    el.value = val;
    saveSettings();
    if (mode === currentMode && !isRunning) {
        totalTime = val * 60;
        timeLeft = totalTime;
        updateDisplay();
    }
}

// ─── Theme Switching ──────────────────────────────────────────
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    mascotEl.textContent = THEME_MASCOTS[theme] || '🍅';
    localStorage.setItem('pomiidoro-theme', theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// ─── Persist Settings ─────────────────────────────────────────
function saveSettings() {
    const s = {
        pomodoroTime: document.getElementById('pomodoroTime').value,
        shortTime: document.getElementById('shortTime').value,
        longTime: document.getElementById('longTime').value,
    };
    localStorage.setItem('pomiidoro-settings', JSON.stringify(s));
}

function loadSettings() {
    const raw = localStorage.getItem('pomiidoro-settings');
    if (raw) {
        try {
            const s = JSON.parse(raw);
            if (s.pomodoroTime) document.getElementById('pomodoroTime').value = s.pomodoroTime;
            if (s.shortTime) document.getElementById('shortTime').value = s.shortTime;
            if (s.longTime) document.getElementById('longTime').value = s.longTime;
        } catch (e) { }
    }
    const theme = localStorage.getItem('pomiidoro-theme') || 'tomato';
    applyTheme(theme);
}

// ─── Event Listeners ──────────────────────────────────────────
startPauseBtn.addEventListener('click', () => {
    if (isRunning) pauseTimer(); else startTimer();
});

resetBtn.addEventListener('click', resetTimer);

skipBtn.addEventListener('click', () => {
    // skip to next logical mode
    if (currentMode === 'pomodoro') {
        switchMode(sessionCount === 3 ? 'long' : 'short');
    } else {
        switchMode('pomodoro');
    }
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});

// Save when custom time inputs change directly
['pomodoroTime', 'shortTime', 'longTime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
        saveSettings();
        if (!isRunning) {
            const modeMap = { pomodoroTime: 'pomodoro', shortTime: 'short', longTime: 'long' };
            if (modeMap[id] === currentMode) {
                const val = parseInt(el.value) || 1;
                totalTime = val * 60;
                timeLeft = totalTime;
                updateDisplay();
            }
        }
    });
});

// ─── Init ─────────────────────────────────────────────────────
loadSettings();

// Initialize timer with loaded values
const initMin = getCustomTime(currentMode);
totalTime = initMin * 60;
timeLeft = totalTime;
updateDisplay();
updateSessionDots();
setMascotMsg(randomMsg(MASCOT_MSGS[currentMode]));