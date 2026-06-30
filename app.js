// --- State & Variables ---
let highestZIndex = 10;
let spawnOffset = 0;
let systemVolume = 0.5; // Base SFX volume

// --- Audio System Setup ---
const sfxPowerOn = new Audio('static/Pom-2-power-on.mp3'); 
const sfxPowerOff = new Audio('static/Pom-2-power-off.mp3'); 
const sfxWinOpen = new Audio('static/Pom-2-window-open.mp3'); 
const sfxWinClose = new Audio('static/Pom-2-window-close.mp3'); 
const sfxTyping = new Audio('static/typing.m4a'); // New Typing Sound
sfxTyping.loop = true; // Loop while typing
const sfxMessage = new Audio('static/Pom-2-Message-received.mp3'); // Terminal sound
const sfxPong = new Audio('static/pong.wav'); // Pong hit sound

function updateSysVolume(val) {
    systemVolume = parseFloat(val);
    sfxPowerOn.volume = systemVolume;
    sfxPowerOff.volume = systemVolume;
    sfxWinOpen.volume = systemVolume;
    sfxWinClose.volume = systemVolume;
    sfxTyping.volume = systemVolume;
    sfxMessage.volume = systemVolume;
    sfxPong.volume = systemVolume;
}

// Set initial volumes
updateSysVolume(systemVolume);

// --- Typing Sound Hook ---
// Listens globally for typing in any input or textarea
let typingTimeout;
document.addEventListener('input', (e) => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Start or continue playing the looped sound
        if (sfxTyping.paused) {
            sfxTyping.play().catch(err => console.log("Audio play blocked."));
        }
        
        // Reset the cutoff timer
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            sfxTyping.pause();
            sfxTyping.currentTime = 0; // Reset so the next keystroke starts fresh
        }, 200); // 200ms delay to cut off when typing stops
    }
});

// --- Boot Sequence ---
window.onload = function () {
    const hasCookies = localStorage.getItem("cookiesAccepted");
    const hasEntered = localStorage.getItem("systemEntered");

    if (!hasCookies) document.getElementById("cookieModal").classList.remove("hidden");
    else if (hasCookies && !hasEntered) document.getElementById("welcome").classList.remove("hidden");
    else if (hasCookies && hasEntered) {
        document.getElementById("desktop").classList.remove("hidden");
        sfxPowerOn.play().catch(e => console.log("Autoplay blocked."));
    }

    loadNotes();
    makeAllDraggable();
};

// --- Welcome / Login Actions ---
document.getElementById("cookieBtn").onclick = function () {
    localStorage.setItem("cookiesAccepted", "true");
    const modal = document.getElementById("cookieModal");
    modal.classList.add("fade-out");
    setTimeout(() => {
        modal.classList.add("hidden");
        document.getElementById("welcome").classList.remove("hidden");
    }, 300);
};

function enterOS() {
    localStorage.setItem("systemEntered", "true");
    sfxPowerOn.play();
    const welcome = document.getElementById("welcome");
    document.getElementById("desktop").classList.remove("hidden");
    welcome.classList.add("slide-out");
    setTimeout(() => welcome.classList.add("hidden"), 600);
}

function quitOS() {
    sfxPowerOff.play();
    setTimeout(() => { window.location.href = "https://stardance.hackclub.com/"; }, 1000);
}

// --- Window App Management ---
function openApp(id) {
    const appWindow = document.getElementById(id);
    if (!appWindow) return;
    if (appWindow.classList.contains("hidden")) {
        sfxWinOpen.play();
        appWindow.classList.remove("hidden");
        appWindow.classList.remove("closing");
        appWindow.style.top = (80 + spawnOffset) + "px";
        appWindow.style.left = (80 + spawnOffset) + "px";
        spawnOffset = (spawnOffset > 150) ? 0 : spawnOffset + 30;
    }
    bringToFront(appWindow);
}

function closeApp(id) {
    const appWindow = document.getElementById(id);
    if (!appWindow) return;
    sfxWinClose.play();
    appWindow.classList.add("closing");
    setTimeout(() => appWindow.classList.add("hidden"), 200);
}

function closeDynamicApp(btnElement) {
    const appWindow = btnElement.closest('.window');
    sfxWinClose.play();
    appWindow.classList.add("closing");
    setTimeout(() => appWindow.remove(), 200); // Destroy dynamically created windows entirely
}

function bringToFront(element) {
    highestZIndex++;
    element.style.zIndex = highestZIndex;
}

// --- Dynamic Image Viewers ---
function openImageViewer(imageSrc, windowId, title) {
    // Only allow one window per image
    if (document.getElementById(windowId)) {
        bringToFront(document.getElementById(windowId));
        return;
    }

    sfxWinOpen.play();
    const template = document.getElementById('imageViewerTemplate');
    const clone = template.content.cloneNode(true);
    const newWindow = clone.querySelector('.window');

    newWindow.id = windowId;
    newWindow.querySelector('img').src = imageSrc;
    newWindow.querySelector('.viewer-title').innerText = `🖼️ ${title}`;

    newWindow.style.top = (80 + spawnOffset) + "px";
    newWindow.style.left = (80 + spawnOffset) + "px";
    spawnOffset = (spawnOffset > 150) ? 0 : spawnOffset + 30;

    document.getElementById('windows').appendChild(newWindow);
    makeDraggable(newWindow);
    bringToFront(newWindow);
}

// --- Mobile & Desktop Dragging Logic ---
function makeAllDraggable() {
    document.querySelectorAll(".window").forEach(win => makeDraggable(win));
}

function makeDraggable(win) {
    const header = win.querySelector(".window-header");
    let isDragging = false, offsetX = 0, offsetY = 0;

    const startDrag = (e) => {
        isDragging = true;
        bringToFront(win);
        // Handle both mouse and touch
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        offsetX = clientX - win.getBoundingClientRect().left;
        offsetY = clientY - win.getBoundingClientRect().top;
    };

    const drag = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // VERY IMPORTANT: Stops mobile screen from scrolling while dragging
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        win.style.left = (clientX - offsetX) + "px";
        win.style.top = (clientY - offsetY) + "px";
    };

    const stopDrag = () => { isDragging = false; };

    // Mouse Listeners
    header.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);

    // Touch Listeners (Mobile)
    header.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("touchmove", drag, { passive: false });
    document.addEventListener("touchend", stopDrag);
}

// --- Notes App Logic ---
let notes = JSON.parse(localStorage.getItem('pom2_notes')) || [];

function saveNote() {
    const title = document.getElementById('noteTitle').value || 'Untitled Note';
    const body = document.getElementById('noteBody').value;
    let id = document.getElementById('currentNoteId').value;

    if (!id) {
        id = Date.now().toString();
        notes.push({ id, title, body });
    } else {
        const noteIndex = notes.findIndex(n => n.id === id);
        if (noteIndex > -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].body = body;
        }
    }

    localStorage.setItem('pom2_notes', JSON.stringify(notes));
    document.getElementById('currentNoteId').value = id;
    renderNotesList();
}

function renderNotesList() {
    const list = document.getElementById('notesList');
    list.innerHTML = '';
    notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-list-item';
        div.innerText = note.title;
        div.onclick = () => loadNoteData(note.id);
        list.appendChild(div);
    });
}

function loadNoteData(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        document.getElementById('currentNoteId').value = note.id;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteBody').value = note.body;
    }
}

function createNewNote() {
    document.getElementById('currentNoteId').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteBody').value = '';
}
function loadNotes() { renderNotesList(); }

// --- Terminal App Logic ---
const termInput = document.getElementById('termInput');
const termOutput = document.getElementById('termOutput');

termInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const val = this.value.trim();
        this.value = '';
        printTerm(`oxy@pom-2:~$ ${val}`);
        processCommand(val);
        document.getElementById('terminalContent').scrollTop = document.getElementById('terminalContent').scrollHeight;
    }
});

function printTerm(text, color = "#b5e8b5") {
    const div = document.createElement('div');
    div.innerHTML = text;
    div.style.color = color;
    termOutput.appendChild(div);
    
    // Play terminal message sound
    sfxMessage.currentTime = 0;
    sfxMessage.play().catch(e => null);
}

function processCommand(cmdLine) {
    if (!cmdLine) return;
    const args = cmdLine.split(' ');
    const cmd = args.shift().toLowerCase();

    switch (cmd) {
        case 'help':
            printTerm("Available commands:");
            printTerm("- help: Show this message");
            printTerm("- echo [text]: Print text to screen");
            printTerm("- start [app_name]: Open an app (e.g., start notes)");
            printTerm("- clear: Clear terminal");
            printTerm("- fetch: Display system information");
            break;
        case 'echo':
            printTerm(args.join(' '));
            break;
        case 'clear':
            termOutput.innerHTML = '';
            break;
        case 'start':
            if (args[0] && document.getElementById(args[0])) {
                openApp(args[0]);
                printTerm(`Starting ${args[0]}...`);
            } else {
                printTerm(`Error: App '${args[0]}' not found.`, "#d16b8b");
            }
            break;
        case 'sudo':
            printTerm("oxy, this incident will be reported to Stardance.", "#d16b8b");
            break;
        case 'weather':
            printTerm("Currently sunny in Arco da Calheta. Perfect for coding.");
            break;
        case 'fetch':
            printTerm(`
   ____                  <span style="color:#fff">Pom-2 WebOS v1.2</span>
  / _ //                  <span style="color:#d16b8b">User:</span> root
 /_-_// ___  //| /||      <span style="color:#d16b8b">Kernel:</span> Pom-OS
//     /__/ // |/ ||     <span style="color:#d16b8b">Hardware:</span> el browser
            `);
            break;
        default:
            printTerm(`Command not found: ${cmd}. Type 'help' for available commands.`);
    }
}

// --- Music App Logic ---
const musicData = {
    'partyofyourlifetime': { src: 'static/partyofyourlifetime.mp3', artist: 'on-lyne', title: 'Party of Your Lifetime' },
    'thegreatdespair': { src: 'static/thegreatdespair.mp3', artist: 'on-lyne', title: 'The Great Despair' }
};

// --- Window App Management ---
function openApp(id) {
    const appWindow = document.getElementById(id);
    if (!appWindow) return;

    // Toggle behavior: If it's already open, close it
    if (!appWindow.classList.contains("hidden") && !appWindow.classList.contains("closing")) {
        closeApp(id);
        return;
    }

    if (appWindow.classList.contains("hidden")) {
        sfxWinOpen.play();
        appWindow.classList.remove("hidden");
        appWindow.classList.remove("closing");
        appWindow.style.top = (80 + spawnOffset) + "px";
        appWindow.style.left = (80 + spawnOffset) + "px";
        spawnOffset = (spawnOffset > 150) ? 0 : spawnOffset + 30;
    }
    bringToFront(appWindow);
}

const audioPlayer = document.getElementById('musicAudioPlayer');
const miniPlayer = document.getElementById('miniPlayer');
const visualizer = document.querySelector('.visualizer');
const playPauseBtn = document.getElementById('playPauseBtn');
audioPlayer.volume = systemVolume;

function playMusic(trackId) {
    const track = musicData[trackId];
    if (!track) return;

    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    audioPlayer.src = track.src;

    miniPlayer.classList.remove('hidden');
    audioPlayer.play();
    visualizer.classList.add('playing');
    playPauseBtn.innerText = "⏸";
}

function togglePlayPause() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        visualizer.classList.add('playing');
        playPauseBtn.innerText = "⏸";
    } else {
        audioPlayer.pause();
        visualizer.classList.remove('playing');
        playPauseBtn.innerText = "▶";
    }
}

function seekAudio(seconds) { audioPlayer.currentTime += seconds; }
function updateMusicVolume(val) { audioPlayer.volume = val; }
function musicEnded() {
    visualizer.classList.remove('playing');
    playPauseBtn.innerText = "▶";
}

// --- Pong App Logic ---
const pongCanvas = document.getElementById('pongCanvas');
const pongCtx = pongCanvas.getContext('2d');

let pongLoop;
let pongScore = 0;

const pongPlayer = { y: 150, width: 10, height: 60, speed: 0 };
const pongBot = { y: 150, width: 10, height: 60, maxSpeed: 4 };
const ball = { x: 250, y: 175, radius: 6, vx: 5, vy: 5, speed: 5 };

// Drag handling for player
let isPongDragging = false;
pongCanvas.addEventListener('mousedown', (e) => { isPongDragging = true; updatePlayerPos(e); });
document.addEventListener('mousemove', (e) => { if (isPongDragging) updatePlayerPos(e); });
document.addEventListener('mouseup', () => isPongDragging = false);

pongCanvas.addEventListener('touchstart', (e) => { isPongDragging = true; updatePlayerPos(e.touches[0]); }, {passive: false});
document.addEventListener('touchmove', (e) => {
    if (isPongDragging) {
        const openWin = document.getElementById('pongApp');
        if (!openWin.classList.contains('hidden')) e.preventDefault(); // Stop mobile screen scrolling
        updatePlayerPos(e.touches[0]);
    }
}, {passive: false});
document.addEventListener('touchend', () => isPongDragging = false);

function updatePlayerPos(e) {
    const rect = pongCanvas.getBoundingClientRect();
    let y = e.clientY - rect.top;
    // Center paddle on cursor/finger
    pongPlayer.y = y - pongPlayer.height / 2;
    // Screen bounds
    if (pongPlayer.y < 0) pongPlayer.y = 0;
    if (pongPlayer.y > pongCanvas.height - pongPlayer.height) pongPlayer.y = pongCanvas.height - pongPlayer.height;
}

function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.vy = (Math.random() * 2 - 1) * ball.speed;
}

function updatePong() {
    // Move Bot (fair tracking logic)
    const botCenter = pongBot.y + pongBot.height / 2;
    if (botCenter < ball.y - 10) {
        pongBot.y += pongBot.maxSpeed;
    } else if (botCenter > ball.y + 10) {
        pongBot.y -= pongBot.maxSpeed;
    }
    if (pongBot.y < 0) pongBot.y = 0;
    if (pongBot.y > pongCanvas.height - pongBot.height) pongBot.y = pongCanvas.height - pongBot.height;

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom wall collisions
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > pongCanvas.height) {
        ball.vy = -ball.vy;
    }

    // Player Paddle Collision (Left side)
    if (ball.vx < 0 && ball.x - ball.radius <= 20 + pongPlayer.width && ball.y >= pongPlayer.y && ball.y <= pongPlayer.y + pongPlayer.height) {
        ball.vx = -ball.vx;
        ball.vx += 0.5; // Slight speed up on rally
        pongScore++; // Increase volley score
        sfxPong.currentTime = 0;
        sfxPong.play().catch(e=>null);
    }
    
    // Bot Paddle Collision (Right side)
    const botX = pongCanvas.width - 30;
    if (ball.vx > 0 && ball.x + ball.radius >= botX && ball.y >= pongBot.y && ball.y <= pongBot.y + pongBot.height) {
        ball.vx = -ball.vx;
        ball.vx -= 0.5; // Slight speed up on rally
        sfxPong.currentTime = 0;
        sfxPong.play().catch(e=>null);
    }

    // Out of bounds / Scoring resets
    if (ball.x < 0) {
        pongScore = 0; // Player missed, reset score
        resetBall();
    } else if (ball.x > pongCanvas.width) {
        resetBall(); // Bot missed (unlikely, but just in case)
    }
}

function drawPong() {
    // Clear canvas
    pongCtx.fillStyle = '#111';
    pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);
    
    // Center dashed line
    pongCtx.setLineDash([10, 15]);
    pongCtx.beginPath();
    pongCtx.moveTo(pongCanvas.width / 2, 0);
    pongCtx.lineTo(pongCanvas.width / 2, pongCanvas.height);
    pongCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    pongCtx.stroke();

    // Score display
    pongCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    pongCtx.font = '40px monospace';
    pongCtx.fillText(pongScore, pongCanvas.width / 2 - 40, 50);

    // Draw paddles
    pongCtx.fillStyle = '#fff';
    pongCtx.fillRect(20, pongPlayer.y, pongPlayer.width, pongPlayer.height);
    pongCtx.fillRect(pongCanvas.width - 30, pongBot.y, pongBot.width, pongBot.height);

    // Draw ball
    pongCtx.beginPath();
    pongCtx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    pongCtx.fill();
}

function loopPong() {
    const app = document.getElementById('pongApp');
    if (!app.classList.contains('hidden') && !app.classList.contains('closing')) {
        updatePong();
        drawPong();
    }
    pongLoop = requestAnimationFrame(loopPong);
}

// Start loop when pong is loaded
resetBall();
loopPong();