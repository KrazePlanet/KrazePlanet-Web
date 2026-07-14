/**
 * Lucky Draw - Giveaway Winner Picker
 * Logic: General state management, visual decrypter, canvas particles, LinkedIn output formatting
 */

// Default Prize Templates (Place, Prize, and Winner Count)
const DEFAULT_PRIZES = [
    { place: "1st Place", prize: "3-Month VulneraXSS Access", count: 2 },
    { place: "2nd Place", prize: "2-Month VulneraXSS Access", count: 3 },
    { place: "3rd Place", prize: "1-Month VulnerasXSS Access", count: 5 }
];

// App State
let state = {
    participants: [],
    prizes: [],
    winners: [], // Array of objects: { index, prizeIndex, place, prize, name }
    isDrawing: false
};

// Initialize prizes state by copying DEFAULT_PRIZES
state.prizes = JSON.parse(JSON.stringify(DEFAULT_PRIZES));

// DOM Elements
const elements = {
    participantsInput: document.getElementById('participants-input'),
    rawCount: document.getElementById('raw-count'),
    btnClean: document.getElementById('btn-clean'),
    btnClear: document.getElementById('btn-clear'),
    prizesContainer: document.getElementById('prizes-container'),
    btnAddPrize: document.getElementById('btn-add-prize'),
    btnResetPrizes: document.getElementById('btn-reset-prizes'),

    // States
    stateIdle: document.getElementById('state-idle'),
    stateDrawing: document.getElementById('state-drawing'),
    stateReveal: document.getElementById('state-reveal'),
    stateCompleted: document.getElementById('state-completed'),

    // State sub-elements
    drawingPrizeTitle: document.getElementById('drawing-prize-title'),
    scramblerName: document.getElementById('scrambler-name'),
    drawProgress: document.getElementById('draw-progress'),
    revealPrize: document.getElementById('reveal-prize'),
    revealWinnerName: document.getElementById('reveal-winner-name'),
    revealWinnerCard: document.getElementById('reveal-winner-card'),

    // Controls
    btnStartDraw: document.getElementById('btn-start-draw'),
    drawBtnText: document.getElementById('draw-btn-text'),
    drawBtnIcon: document.getElementById('draw-btn-icon'),
    optConfetti: document.getElementById('opt-confetti'),

    // Results
    resultsPanel: document.getElementById('results-panel'),
    resultsActionsBar: document.getElementById('results-actions-bar'),
    winnersTbody: document.getElementById('winners-tbody'),
    btnResetDraw: document.getElementById('btn-reset-draw'),
    btnCopyLinkedin: document.getElementById('btn-copy-linkedin'),
    toast: document.getElementById('toast'),

    // Canvas
    confettiCanvas: document.getElementById('confetti-canvas')
};

// -------------------------------------------------------------
// CANVAS CONFETTI SYSTEM
// -------------------------------------------------------------
const confetti = {
    active: false,
    particles: [],
    colors: ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'],
    ctx: elements.confettiCanvas.getContext('2d'),

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const canvas = elements.confettiCanvas;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    },

    spawn(count = 50, x = null, y = null) {
        if (!elements.optConfetti.checked) return;

        const canvas = elements.confettiCanvas;
        const originX = x !== null ? x : canvas.width / 2;
        const originY = y !== null ? y : canvas.height / 2;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: originX,
                y: originY,
                size: Math.random() * 8 + 6,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.7) * 15 - 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                decay: Math.random() * 0.015 + 0.01
            });
        }

        if (!this.active) {
            this.active = true;
            this.loop();
        }
    },

    loop() {
        if (confetti.particles.length === 0) {
            confetti.active = false;
            confetti.ctx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);
            return;
        }

        const ctx = confetti.ctx;
        ctx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);

        for (let i = confetti.particles.length - 1; i >= 0; i--) {
            const p = confetti.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25; // gravity
            p.vx *= 0.98; // drag
            p.rotation += p.rotationSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0) {
                confetti.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        requestAnimationFrame(() => confetti.loop());
    }
};

// -------------------------------------------------------------
// STATE RENDER & INPUT MANAGEMENT
// -------------------------------------------------------------

// Render prizes config rows (three inputs per item: place, prize, count)
function renderPrizeInputs() {
    elements.prizesContainer.innerHTML = '';
    state.prizes.forEach((item, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'prize-item';
        rowDiv.innerHTML = `
            <span class="prize-place-label">${item.place}:</span>
            <input type="text" class="prize-input-field prize-name-input" value="${escapeHtmlAttribute(item.prize)}" data-index="${index}" placeholder="Prize details">
            <span class="count-multiplier">×</span>
            <input type="number" class="prize-input-field prize-count-input" value="${item.count}" min="1" data-index="${index}" title="Number of winners for this place">
            <button type="button" class="btn-delete-prize" data-index="${index}" title="Remove prize slot">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
            </button>
        `;
        elements.prizesContainer.appendChild(rowDiv);
    });

    // Listen to changes in Prize details
    elements.prizesContainer.querySelectorAll('.prize-name-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            state.prizes[idx].prize = e.target.value;
            saveToLocalStorage();
        });
    });

    // Listen to changes in Winner Count
    elements.prizesContainer.querySelectorAll('.prize-count-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            const val = parseInt(e.target.value, 10);
            state.prizes[idx].count = isNaN(val) || val < 1 ? 1 : val;
            saveToLocalStorage();
        });
    });

    // Delete handler
    elements.prizesContainer.querySelectorAll('.btn-delete-prize').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (state.isDrawing) return;
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            state.prizes.splice(idx, 1);
            saveToLocalStorage();
            renderPrizeInputs();
        });
    });
}

function parseParticipantsInput() {
    const text = elements.participantsInput.value;
    const lines = text.split('\n')
        .map(line => line.trim());

    const rawCount = lines.filter(line => line.length > 0).length;
    elements.rawCount.textContent = `${rawCount} lines`;
}

function getCleanedParticipants() {
    const text = elements.participantsInput.value;
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Unique list
    return [...new Set(lines)];
}

function cleanParticipantsInput() {
    const cleaned = getCleanedParticipants();
    elements.participantsInput.value = cleaned.join('\n');
    elements.rawCount.textContent = `${cleaned.length} cleaned`;
    state.participants = cleaned;
    saveToLocalStorage();
    showToast("List cleaned: duplicates and blank lines removed.");
}

// -------------------------------------------------------------
// LOCAL STORAGE MANAGEMENT
// -------------------------------------------------------------
function saveToLocalStorage() {
    localStorage.setItem('generic_giveaway_prizes', JSON.stringify(state.prizes));
    localStorage.setItem('generic_giveaway_raw_input', elements.participantsInput.value);
}

function loadFromLocalStorage() {
    const savedPrizes = localStorage.getItem('generic_giveaway_prizes');
    if (savedPrizes) {
        try {
            const parsed = JSON.parse(savedPrizes);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'count' in parsed[0]) {
                state.prizes = parsed;
            } else {
                state.prizes = JSON.parse(JSON.stringify(DEFAULT_PRIZES));
            }
        } catch (e) {
            state.prizes = JSON.parse(JSON.stringify(DEFAULT_PRIZES));
        }
    }
    const savedRawInput = localStorage.getItem('generic_giveaway_raw_input');
    if (savedRawInput !== null) {
        elements.participantsInput.value = savedRawInput;
        parseParticipantsInput();
    }
}

// -------------------------------------------------------------
// SHOW WINNERS LIST TABLE
// -------------------------------------------------------------
function renderWinnersBoard() {
    elements.winnersTbody.innerHTML = '';

    if (state.winners.length === 0) {
        elements.winnersTbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4" class="text-center font-mono">No winners drawn yet. Initiate the draw sequence above.</td>
            </tr>
        `;
        elements.resultsActionsBar.style.display = 'none';
        return;
    }

    elements.resultsActionsBar.style.display = 'flex';

    state.winners.forEach((item) => {
        const row = document.createElement('tr');
        row.className = 'winner-row';
        row.innerHTML = `
            <td class="td-place">${escapeHtml(item.place)}</td>
            <td class="td-prize">${escapeHtml(item.prize)}</td>
            <td class="td-name font-mono">${escapeHtml(item.name)}</td>
            <td class="td-actions">
                <button type="button" class="btn-reroll" data-index="${item.index}" title="Re-roll this slot">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H21V3L17.65,6.35Z"/>
                    </svg>
                    Re-roll
                </button>
            </td>
        `;
        elements.winnersTbody.appendChild(row);
    });

    // Event listener for re-rolls
    elements.winnersTbody.querySelectorAll('.btn-reroll').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const drawIndex = parseInt(e.currentTarget.dataset.index, 10);
            rerollWinner(drawIndex);
        });
    });
}

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[s];
    });
}

function escapeHtmlAttribute(string) {
    return String(string).replace(/"/g, '&quot;');
}

// -------------------------------------------------------------
// THE DRAW ANIMATION CONTROLLER
// -------------------------------------------------------------
function setMonitorState(stateId) {
    const states = [elements.stateIdle, elements.stateDrawing, elements.stateReveal, elements.stateCompleted];
    states.forEach(s => s.classList.remove('active'));

    if (stateId === 'idle') elements.stateIdle.classList.add('active');
    else if (stateId === 'drawing') elements.stateDrawing.classList.add('active');
    else if (stateId === 'reveal') elements.stateReveal.classList.add('active');
    else if (stateId === 'completed') elements.stateCompleted.classList.add('active');
}

async function startLuckyDraw() {
    // 1. Validate
    const cleanedParticipants = getCleanedParticipants();
    if (cleanedParticipants.length === 0) {
        alert("Please enter participants in the input area first.");
        return;
    }

    if (state.prizes.length === 0) {
        alert("Please add at least one prize slot.");
        return;
    }

    // Calculate total winners needed based on count values
    const totalWinnersNeeded = state.prizes.reduce((sum, item) => sum + (parseInt(item.count, 10) || 1), 0);

    if (cleanedParticipants.length < totalWinnersNeeded) {
        alert(`You need at least ${totalWinnersNeeded} participants to draw for all placements (current requirements: ${totalWinnersNeeded} winners total). Currently you have ${cleanedParticipants.length} unique participants.`);
        return;
    }

    state.participants = cleanedParticipants;
    state.winners = [];
    state.isDrawing = true;
    updateDrawButtonState();

    // Construct single flattened raffle draw jobs array
    const drawJobs = [];
    state.prizes.forEach((p, pIdx) => {
        const count = parseInt(p.count, 10) || 1;
        for (let wNum = 1; wNum <= count; wNum++) {
            drawJobs.push({
                prizeIndex: pIdx,
                place: p.place,
                prize: p.prize,
                winnerNumber: wNum,
                totalCount: count
            });
        }
    });

    const ticks = 25;
    const baseDelay = 35;

    renderWinnersBoard();

    // Execute draw job queue
    for (let i = 0; i < drawJobs.length; i++) {
        const job = drawJobs[i];

        // Update display to drawing
        setMonitorState('drawing');
        elements.drawingPrizeTitle.textContent = `${job.place}: ${job.prize} (${job.winnerNumber}/${job.totalCount})`;

        // Available candidates = participants minus current winners
        const currentWinnerNames = state.winners.map(w => w.name);
        const candidates = state.participants.filter(p => !currentWinnerNames.includes(p));

        let winnerName = "";

        for (let t = 0; t <= ticks; t++) {
            // Pick random candidate placeholder
            const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];

            // Format scrambler name with visual digital decrypting effect (random glyph substitution)
            elements.scramblerName.textContent = scrambleText(randomCandidate, t / ticks);

            // Progress Bar
            const percent = (t / ticks) * 100;
            elements.drawProgress.style.width = `${percent}%`;

            let delay = baseDelay;
            if (t > ticks * 0.7) {
                delay = baseDelay * (1 + (t - ticks * 0.7) * 0.3);
            }

            await sleep(delay);
            winnerName = randomCandidate; // Lock winner
        }

        // Store winner
        state.winners.push({
            index: i, // index in flatten winner list
            prizeIndex: job.prizeIndex,
            place: job.place,
            prize: job.prize,
            name: winnerName
        });

        // Winner Reveal Screen
        setMonitorState('reveal');
        elements.revealPrize.textContent = `${job.place} (Winner ${job.winnerNumber}/${job.totalCount})`;
        elements.revealWinnerName.textContent = winnerName;

        // Micro burst confetti at reveal card location
        const rect = elements.revealWinnerCard.getBoundingClientRect();
        confetti.spawn(20, rect.left + rect.width / 2, rect.top + rect.height / 2);

        // Wait on reveal screen
        await sleep(1000);

        // Add row to winners board incrementally
        renderWinnersBoard();

        // Scroll to results panel
        elements.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Completed state
    state.isDrawing = false;
    updateDrawButtonState();
    setMonitorState('completed');

    // Major celebration confetti shower
    const canvas = elements.confettiCanvas;
    confetti.spawn(100, canvas.width * 0.25, canvas.height * 0.4);
    confetti.spawn(100, canvas.width * 0.75, canvas.height * 0.4);
}

function scrambleText(text, progress) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@_-$%";
    let output = "";
    const threshold = Math.floor(text.length * progress);

    for (let i = 0; i < text.length; i++) {
        if (i < threshold || text[i] === ' ') {
            output += text[i];
        } else {
            output += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return output;
}

function updateDrawButtonState() {
    if (state.isDrawing) {
        elements.btnStartDraw.disabled = true;
        elements.drawBtnText.textContent = "Drawing In Progress...";
        elements.btnClean.disabled = true;
        elements.btnClear.disabled = true;
        elements.btnAddPrize.disabled = true;
        elements.btnResetPrizes.disabled = true;
        elements.participantsInput.disabled = true;
    } else {
        elements.btnStartDraw.disabled = false;
        elements.drawBtnText.textContent = "Initiate Draw Sequence";
        elements.btnClean.disabled = false;
        elements.btnClear.disabled = false;
        elements.btnAddPrize.disabled = false;
        elements.btnResetPrizes.disabled = false;
        elements.participantsInput.disabled = false;
    }
}

function rerollWinner(drawIndex) {
    if (state.isDrawing) return;

    // Filter winner names excluding the slot being rerolled
    const currentWinnerNames = state.winners
        .filter(w => w.index !== drawIndex)
        .map(w => w.name);

    const candidates = state.participants.filter(p => !currentWinnerNames.includes(p));

    if (candidates.length === 0) {
        alert("Cannot re-roll: No other unique participants are available to win this slot.");
        return;
    }

    const newWinner = candidates[Math.floor(Math.random() * candidates.length)];

    // Update the winner name for this draw slot
    const winnerObj = state.winners.find(w => w.index === drawIndex);
    const oldWinner = winnerObj.name;
    winnerObj.name = newWinner;

    // Render
    renderWinnersBoard();

    // Mini confetti burst
    confetti.spawn(20);
    showToast(`Re-rolled slot: ${oldWinner} ➡️ ${newWinner}`);
}

// Reset drawing state back to idle
function resetDraw() {
    if (state.isDrawing) return;

    if (confirm("Are you sure you want to reset the current draw? Winners board will be cleared.")) {
        state.winners = [];
        renderWinnersBoard();
        setMonitorState('idle');
    }
}

// -------------------------------------------------------------
// clipboard COPY FORMAT (Grouped by Prize Tier)
// -------------------------------------------------------------
function copyLinkedinFormat() {
    if (state.winners.length === 0) return;

    let text = `🎉 Giveaway Winners Announced! 🎉\n\n`;
    text += `A massive thank you to everyone who participated in our giveaway. We appreciate your support! ❤️\n\n`;
    text += `Here are the lucky winners selected randomly:\n\n`;

    // Group winners by the configured prizeIndex
    state.prizes.forEach((p, pIdx) => {
        const tierWinners = state.winners.filter(w => w.prizeIndex === pIdx);
        if (tierWinners.length > 0) {
            if (tierWinners.length === 1) {
                // Single winner layout
                text += `🏆 ${p.place} (${p.prize}): ${tierWinners[0].name}\n`;
            } else {
                // Grouped winners layout
                text += `🏆 ${p.place} (${p.prize}):\n`;
                tierWinners.forEach(w => {
                    text += `  • ${w.name}\n`;
                });
            }
            text += `\n`;
        }
    });

    text += `Congratulations to all the winners! Please send a Direct Message (DM) to claim your prizes! 🚀🔥\n\n`;
    text += `#Giveaway #WinnerPicker #LuckyDraw #WinnerAnnouncement`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("Formatted text copied to clipboard!");
    }).catch(err => {
        console.error("Clipboard copy failed: ", err);
        alert("Failed to copy. Please manually highlight and copy results.");
    });
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------------------------------------------------
// EVENT LISTENERS & SETUP
// -------------------------------------------------------------
function initApp() {
    // 1. Load LocalStorage
    loadFromLocalStorage();

    // 2. Setup Confetti Canvas
    confetti.init();

    // 3. Render Prize List Inputs
    renderPrizeInputs();

    // 4. Setup Input Watchers
    elements.participantsInput.addEventListener('input', parseParticipantsInput);

    elements.btnClean.addEventListener('click', cleanParticipantsInput);
    elements.btnClear.addEventListener('click', () => {
        if (state.isDrawing) return;
        elements.participantsInput.value = '';
        parseParticipantsInput();
        state.participants = [];
        saveToLocalStorage();
    });

    // Add Prize Customizer Controls
    elements.btnAddPrize.addEventListener('click', () => {
        if (state.isDrawing) return;
        const newIndex = state.prizes.length + 1;
        state.prizes.push({
            place: `${newIndex}th Place`,
            prize: "Custom Prize",
            count: 1
        });
        saveToLocalStorage();
        renderPrizeInputs();
    });

    elements.btnResetPrizes.addEventListener('click', () => {
        if (state.isDrawing) return;
        if (confirm("Reset prizes list back to default placements?")) {
            state.prizes = JSON.parse(JSON.stringify(DEFAULT_PRIZES));
            saveToLocalStorage();
            renderPrizeInputs();
        }
    });

    // Lucky Draw button
    elements.btnStartDraw.addEventListener('click', startLuckyDraw);

    // Results Reset / Export
    elements.btnResetDraw.addEventListener('click', resetDraw);
    elements.btnCopyLinkedin.addEventListener('click', copyLinkedinFormat);
}

// Kickstart
document.addEventListener('DOMContentLoaded', initApp);
