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
const sfxPongWin = new Audio('static/confettipongwon.mp3'); // Pong win sound
const sfxPencil = new Audio('static/pencildrawing.mp3'); // Drawing sound
sfxPencil.loop = true;

function updateSysVolume(val) {
    systemVolume = parseFloat(val);
    sfxPowerOn.volume = systemVolume;
    sfxPowerOff.volume = systemVolume;
    sfxWinOpen.volume = systemVolume;
    sfxWinClose.volume = systemVolume;
    sfxTyping.volume = systemVolume;
    sfxMessage.volume = systemVolume;
    sfxPong.volume = systemVolume;
    sfxPongWin.volume = systemVolume;
    sfxPencil.volume = systemVolume;
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
    initCalendar();
    initMandachord();
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
let notes = JSON.parse(localStorage.getItem('pom2_notes'));
if (!notes) {
    notes = [{
        id: Date.now().toString(),
        title: "Hi Welcome to my WebOS",
        body: "hi everyone this is the shipping version of my app, i hope you all like it.\nthere are a bunch of apps and games and i hope you like it :)\n\nwith love, oxy <3.\n\n    _____\n  // _  //    \\\\//    \\\\//\n//___//      //\\\\     //\n"
    }];
    localStorage.setItem('pom2_notes', JSON.stringify(notes));
}

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
    'thegreatdespair': { src: 'static/thegreatdespair.mp3', artist: 'on-lyne', title: 'The Great Despair' },
    'fornarmer': { src: 'static/fornarmer.mp3', artist: 'Ballas', title: 'For Narmer' },
    'sleepinginthecoldbelow': { src: 'static/sleepinginthecoldbelow.mp3', artist: 'The Sisters of Parvos', title: 'Sleeping in the Cold Below' },
    'thecall': { src: 'static/thecall.mp3', artist: 'The Hex', title: 'The Call' },
    'wealllifttogether': { src: 'static/wealllifttogether.mp3', artist: 'Solaris United', title: 'We All Lift Together' }
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
let pongHighScore = localStorage.getItem('pom2_pong_highscore') || 0;
document.getElementById('pongHighScore').innerText = pongHighScore;

const pongPlayer = { y: 150, width: 10, height: 60, speed: 6 };
const pongBot = { y: 150, width: 10, height: 60, maxSpeed: 4 };
const ball = { x: 250, y: 175, radius: 6, vx: 5, vy: 5, speed: 5 };

let pongState = 'MENU'; // MENU, PLAYING, WIN

// Keyboard controls
const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };
document.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
document.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// Drag handling for player
let isPongDragging = false;
pongCanvas.addEventListener('mousedown', (e) => { isPongDragging = true; updatePlayerPos(e); });
document.addEventListener('mousemove', (e) => { if (isPongDragging) updatePlayerPos(e); });
document.addEventListener('mouseup', () => isPongDragging = false);

pongCanvas.addEventListener('touchstart', (e) => { isPongDragging = true; updatePlayerPos(e.touches[0]); }, {passive: false});
document.addEventListener('touchmove', (e) => {
    if (isPongDragging) {
        const openWin = document.getElementById('pongApp');
        if (!openWin.classList.contains('hidden')) e.preventDefault();
        updatePlayerPos(e.touches[0]);
    }
}, {passive: false});
document.addEventListener('touchend', () => isPongDragging = false);

function updatePlayerPos(e) {
    if (pongState !== 'PLAYING') return;
    const rect = pongCanvas.getBoundingClientRect();
    let y = e.clientY - rect.top;
    pongPlayer.y = y - pongPlayer.height / 2;
    if (pongPlayer.y < 0) pongPlayer.y = 0;
    if (pongPlayer.y > pongCanvas.height - pongPlayer.height) pongPlayer.y = pongCanvas.height - pongPlayer.height;
}

function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.vy = (Math.random() * 2 - 1) * ball.speed;
}

function startPong() {
    pongScore = 0;
    document.getElementById('pongMenu').classList.add('hidden');
    document.getElementById('pongWin').classList.add('hidden');
    pongState = 'PLAYING';
    resetBall();
}

function resumePong() {
    document.getElementById('pongWin').classList.add('hidden');
    pongState = 'PLAYING';
    resetBall();
}

function winPong() {
    pongState = 'WIN';
    document.getElementById('pongWin').classList.remove('hidden');
    sfxPongWin.currentTime = 0;
    sfxPongWin.play().catch(e => null);
}

function updatePong() {
    if (pongState !== 'PLAYING') return;

    // Keyboard movement
    if (keys.w || keys.ArrowUp) pongPlayer.y -= pongPlayer.speed;
    if (keys.s || keys.ArrowDown) pongPlayer.y += pongPlayer.speed;
    if (pongPlayer.y < 0) pongPlayer.y = 0;
    if (pongPlayer.y > pongCanvas.height - pongPlayer.height) pongPlayer.y = pongCanvas.height - pongPlayer.height;

    // Move Bot (fair tracking logic)
    const botCenter = pongBot.y + pongBot.height / 2;
    if (botCenter < ball.y - 10) pongBot.y += pongBot.maxSpeed;
    else if (botCenter > ball.y + 10) pongBot.y -= pongBot.maxSpeed;
    
    if (pongBot.y < 0) pongBot.y = 0;
    if (pongBot.y > pongCanvas.height - pongBot.height) pongBot.y = pongCanvas.height - pongBot.height;

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom wall collisions
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > pongCanvas.height) {
        ball.vy = -ball.vy;
    }

    // Player Paddle Collision
    if (ball.vx < 0 && ball.x - ball.radius <= 20 + pongPlayer.width && ball.y >= pongPlayer.y && ball.y <= pongPlayer.y + pongPlayer.height) {
        ball.vx = -ball.vx;
        ball.vx += 0.5;
        pongScore++;
        if (pongScore > pongHighScore) {
            pongHighScore = pongScore;
            localStorage.setItem('pom2_pong_highscore', pongHighScore);
            document.getElementById('pongHighScore').innerText = pongHighScore;
        }
        sfxPong.currentTime = 0;
        sfxPong.play().catch(e=>null);
        
        if (pongScore === 10) winPong();
    }
    
    // Bot Paddle Collision
    const botX = pongCanvas.width - 30;
    if (ball.vx > 0 && ball.x + ball.radius >= botX && ball.y >= pongBot.y && ball.y <= pongBot.y + pongBot.height) {
        ball.vx = -ball.vx;
        ball.vx -= 0.5;
        sfxPong.currentTime = 0;
        sfxPong.play().catch(e=>null);
    }

    // Out of bounds
    if (ball.x < 0) {
        pongScore = 0;
        resetBall();
    } else if (ball.x > pongCanvas.width) {
        resetBall();
    }
}

function drawPong() {
    pongCtx.fillStyle = '#111';
    pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);
    
    if (pongState !== 'PLAYING') return;

    pongCtx.setLineDash([10, 15]);
    pongCtx.beginPath();
    pongCtx.moveTo(pongCanvas.width / 2, 0);
    pongCtx.lineTo(pongCanvas.width / 2, pongCanvas.height);
    pongCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    pongCtx.stroke();

    pongCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    pongCtx.font = '40px monospace';
    pongCtx.fillText(pongScore, pongCanvas.width / 2 - 40, 50);

    pongCtx.fillStyle = '#fff';
    pongCtx.fillRect(20, pongPlayer.y, pongPlayer.width, pongPlayer.height);
    pongCtx.fillRect(pongCanvas.width - 30, pongBot.y, pongBot.width, pongBot.height);

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
loopPong();

// --- Fullscreen Feature ---
function fullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("Error attempting to enable full-screen mode: " + err.message);
        });
    } else {
        document.exitFullscreen();
    }
}

// --- File/Music Filter Logic ---
function filterGrid(inputElem) {
    const filter = inputElem.value.toLowerCase();
    const grid = inputElem.closest('.window-content').querySelector('.file-grid');
    if (!grid) return;
    const items = grid.getElementsByClassName('file-item');
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        if (text.includes(filter)) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
}

// --- Calculator Logic ---
let calcCurrent = "";
const calcDisplay = document.getElementById('calcDisplay');

function calcInput(val) {
    calcCurrent += val;
    calcDisplay.value = calcCurrent;
}

function calcClear() {
    calcCurrent = "";
    calcDisplay.value = "";
}

function calcEval() {
    try {
        const result = new Function('return ' + calcCurrent)();
        if (!isFinite(result) || isNaN(result)) throw new Error("Invalid");
        calcCurrent = result.toString();
        calcDisplay.value = calcCurrent;
    } catch (e) {
        calcDisplay.value = "Error";
        calcCurrent = "";
    }
}

// --- Drawing App Logic ---
const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
let drawing = false;
let drawings = JSON.parse(localStorage.getItem('pom2_drawings')) || [];
let isEraser = false;

if (drawCtx) {
    drawCtx.fillStyle = "#ffffff";
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function toggleEraser() {
    isEraser = !isEraser;
    const btn = document.getElementById('eraserBtn');
    if (isEraser) {
        btn.classList.add('active');
        btn.innerText = "🧹 Eraser: ON";
    } else {
        btn.classList.remove('active');
        btn.innerText = "🧹 Eraser: OFF";
    }
    sfxMessage.currentTime = 0; sfxMessage.play().catch(e=>null);
}

function disableEraser() {
    isEraser = false;
    const btn = document.getElementById('eraserBtn');
    if (btn) {
        btn.classList.remove('active');
        btn.innerText = "🧹 Eraser: OFF";
    }
}

function clearCanvas() {
    if (!drawCtx) return;
    drawCtx.fillStyle = "#ffffff";
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    sfxWinOpen.currentTime = 0; sfxWinOpen.play().catch(e=>null);
}

function startPosition(e) {
    drawing = true;
    sfxPencil.play().catch(e=>null);
    draw(e);
}
function endPosition() {
    drawing = false;
    sfxPencil.pause();
    sfxPencil.currentTime = 0;
    if (drawCtx) drawCtx.beginPath();
}
function draw(e) {
    if (!drawing || !drawCtx) return;
    
    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        const openWin = document.getElementById('drawingApp');
        if (!openWin.classList.contains('hidden')) e.preventDefault();
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    drawCtx.lineWidth = document.getElementById('drawSize').value;
    drawCtx.lineCap = "round";
    if (isEraser) {
        drawCtx.strokeStyle = "#ffffff";
    } else {
        drawCtx.strokeStyle = document.getElementById('drawColor').value;
    }

    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
}

if (drawCanvas) {
    drawCanvas.addEventListener('mousedown', startPosition);
    drawCanvas.addEventListener('mouseup', endPosition);
    drawCanvas.addEventListener('mousemove', draw);
    drawCanvas.addEventListener('mouseleave', endPosition);

    drawCanvas.addEventListener('touchstart', startPosition, {passive: false});
    drawCanvas.addEventListener('touchend', endPosition);
    drawCanvas.addEventListener('touchmove', draw, {passive: false});
}

function newDrawing() {
    if (!drawCtx) return;
    drawCtx.fillStyle = "#ffffff";
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    document.getElementById('drawTitle').value = "Untitled";
    sfxWinOpen.currentTime = 0; sfxWinOpen.play().catch(e=>null);
}

function saveDrawing() {
    if (!drawCanvas) return;
    const dataURL = drawCanvas.toDataURL('image/png');
    const id = Date.now().toString();
    const title = document.getElementById('drawTitle').value || "Untitled";
    drawings.push({ id, title, data: dataURL });
    localStorage.setItem('pom2_drawings', JSON.stringify(drawings));
    sfxMessage.currentTime = 0; sfxMessage.play().catch(e=>null);
    renderDrawings();
}

function renderDrawings() {
    const list = document.getElementById('drawList');
    if (!list) return;
    list.innerHTML = '';
    drawings.forEach((d, index) => {
        const div = document.createElement('div');
        div.className = 'draw-item';
        div.innerText = d.title ? d.title : `Drawing ${index + 1}`;
        div.onclick = () => {
            document.getElementById('drawTitle').value = d.title || `Drawing ${index + 1}`;
            const img = new Image();
            img.onload = () => {
                if (!drawCtx) return;
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                drawCtx.drawImage(img, 0, 0);
            };
            img.src = d.data;
        };
        list.appendChild(div);
    });
}
renderDrawings();

// --- Hex Calendar App Logic ---
let calCurrentDate = new Date();
let selectedCalDateStr = null;
let calendarEvents = [];

const CATEGORY_MAP = {
    birthday: { name: 'Birthday', icon: '🎂' },
    event: { name: 'Event', icon: '🎫' },
    marked: { name: 'Marked Date', icon: '📋' },
    work: { name: 'Work', icon: '💻' },
    special: { name: 'Special', icon: '⭐' }
};

// Cookie helpers for data persistence backup
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
    }
    return "";
}

function loadCalendarEvents() {
    let saved = localStorage.getItem('pom2_calendar_events');
    if (!saved) {
        saved = getCookie('pom2_calendar_events');
    }
    if (saved) {
        try {
            calendarEvents = JSON.parse(saved);
        } catch (e) {
            calendarEvents = [];
        }
    } else {
        // Pre-populate default cozy events (Warframe style + Oxy's Birthday + Hackathon)
        const today = new Date();
        const year = today.getFullYear();
        const monthStr = String(today.getMonth() + 1).padStart(2, '0');
        const dayNum = today.getDate();
        
        const formatD = (d) => `${year}-${monthStr}-${String(d).padStart(2, '0')}`;

        calendarEvents = [
            {
                id: '1',
                date: `${year}-01-10`,
                category: 'birthday',
                title: "My mom's Birthday 🎂",
                desc: 'My moms bday, also one of my little brothers, the other little brother is april'
            },
            {
                id: '2',
                date: `${year}-07-15`,
                category: 'birthday',
                title: "Jane's Birthday 🎂",
                desc: 'The Birthday of my lovely lovely gf <3'
            },
            {
                id: '3',
                date: `${year}-08-20`,
                category: 'birthday',
                title: "Oxy's Birthday 🎂",
                desc: 'my very own birthday'
            },
            {
                id: '4',
                date: `${year}-08-20`,
                category: 'birthday',
                title: "Bagel's Birthday 🎂",
                desc: 'My twins birthday!'
            },
            {
                id: '5',
                date: `${year}-08-17`,
                category: 'birthday',
                title: "Isaiah's Birthday 🎂",
                desc: 'Its my friend isaiahs bday, he chill'
            },
            {
                id: '6',
                date: `${year}-09-17`,
                category: 'birthday',
                title: "My dad's Birthday 🎂",
                desc: 'My fathers bday'
            }
        ];
        saveCalendarEvents();
    }
}

function saveCalendarEvents() {
    const dataStr = JSON.stringify(calendarEvents);
    localStorage.setItem('pom2_calendar_events', dataStr);
    setCookie('pom2_calendar_events', dataStr, 365);
}

function initCalendar() {
    loadCalendarEvents();
    renderCalendar();
}

function getSeason(monthIndex) {
    if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) return { name: 'WINTER', css: 'season-winter', pattern: '🐧 ❄️ 🐧 ❄️ 🐧 ❄️ 🐧' };
    if (monthIndex >= 2 && monthIndex <= 4) return { name: 'SPRING', css: 'season-spring', pattern: '🌸 🌿 🌳 🌸 🌿 🌳 🌸' };
    if (monthIndex >= 5 && monthIndex <= 7) return { name: 'SUMMER', css: 'season-summer', pattern: '☀️ 🍦 🍹 ☀️ 🍦 🍹 ☀️' };
    return { name: 'AUTUMN', css: 'season-autumn', pattern: '🍁 🍄 🍂 🍁 🍄 🍂 🍁' };
}

function renderCalendar() {
    const calendarWin = document.getElementById('calendarApp');
    if (!calendarWin) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const season = getSeason(month);

    calendarWin.classList.remove('season-winter', 'season-spring', 'season-summer', 'season-autumn');
    calendarWin.classList.add(season.css);

    document.getElementById('calYearDisplay').innerText = year;
    document.getElementById('calSeasonDisplay').innerText = season.name;
    document.getElementById('calMonthDisplay').innerText = monthNames[month];
    document.getElementById('calBannerPattern').innerText = season.pattern;

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = (calCurrentDate.getMonth() === new Date().getMonth() && calCurrentDate.getFullYear() === new Date().getFullYear()) ? new Date().getDate() : 1;
    const daysLeft = Math.max(1, daysInCurrentMonth - currentDay);
    document.getElementById('calSeasonCountdown').innerText = `${daysLeft}d ${Math.floor(Math.random() * 12 + 1)}h`;

    renderCalendarGrid(year, month);
    renderOverridesPanel();
}

function changeCalMonth(delta) {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + delta);
    renderCalendar();
    sfxWinOpen.currentTime = 0;
    sfxWinOpen.play().catch(e => null);
}

function renderCalendarGrid(year, month) {
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDaysInMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const totalCells = (firstDayIndex + daysInMonth > 35) ? 42 : 35;

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';

        let cellYear = year;
        let cellMonth = month;
        let dayNum = 0;
        let isOtherMonth = false;

        if (i < firstDayIndex) {
            isOtherMonth = true;
            dayNum = prevDaysInMonth - firstDayIndex + i + 1;
            cellMonth = month - 1;
            if (cellMonth < 0) { cellMonth = 11; cellYear--; }
        } else if (i >= firstDayIndex + daysInMonth) {
            isOtherMonth = true;
            dayNum = i - (firstDayIndex + daysInMonth) + 1;
            cellMonth = month + 1;
            if (cellMonth > 11) { cellMonth = 0; cellYear++; }
        } else {
            dayNum = i - firstDayIndex + 1;
        }

        const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        if (isOtherMonth) cell.classList.add('other-month');
        if (dateStr === todayStr) cell.classList.add('today');
        if (selectedCalDateStr === dateStr) cell.classList.add('selected');

        const dayEvents = calendarEvents.filter(e => e.date === dateStr);
        let iconsHtml = '';
        if (dayEvents.length > 0) {
            const icons = dayEvents.map(e => CATEGORY_MAP[e.category]?.icon || '📌');
            iconsHtml = `<div class="cal-day-icons">${icons.join('')}</div>`;
        }

        cell.innerHTML = `
            ${iconsHtml}
            <div class="cal-day-num">${dayNum}</div>
        `;

        cell.onclick = () => {
            if (selectedCalDateStr === dateStr) {
                selectedCalDateStr = null;
            } else {
                selectedCalDateStr = dateStr;
            }
            sfxMessage.currentTime = 0;
            sfxMessage.play().catch(e => null);
            renderCalendarGrid(year, month);
            renderOverridesPanel();
        };

        grid.appendChild(cell);
    }
}

function renderOverridesPanel() {
    const container = document.getElementById('overridesBody');
    if (!container) return;
    container.innerHTML = '';

    let displayEvents = [];
    let dateLabelText = '';

    if (selectedCalDateStr) {
        displayEvents = calendarEvents.filter(e => e.date === selectedCalDateStr);
        const [y, m, d] = selectedCalDateStr.split('-');
        const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dateLabelText = `Selected Date: ${monthNames[dObj.getMonth()]} ${dObj.getDate()}, ${y}`;
    } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const sortedFuture = calendarEvents
            .filter(e => e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (sortedFuture.length > 0) {
            const closestDate = sortedFuture[0].date;
            displayEvents = calendarEvents.filter(e => e.date === closestDate);
            const [y, m, d] = closestDate.split('-');
            const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            dateLabelText = `Next Event: ${monthNames[dObj.getMonth()]} ${dObj.getDate()}, ${y}`;
        } else if (calendarEvents.length > 0) {
            displayEvents = [calendarEvents[0]];
            dateLabelText = `Event: ${calendarEvents[0].date}`;
        } else {
            dateLabelText = `No Upcoming Events`;
        }
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'override-date-label';
    labelDiv.innerText = dateLabelText;
    container.appendChild(labelDiv);

    if (displayEvents.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'override-empty-msg';
        emptyMsg.innerText = 'Nothing recorded for this date. Click "+ Add Thingies" to add something!';
        container.appendChild(emptyMsg);
        return;
    }

    displayEvents.forEach(evt => {
        const catInfo = CATEGORY_MAP[evt.category] || { name: 'Event', icon: '📌' };
        const card = document.createElement('div');
        card.className = 'override-card';
        card.innerHTML = `
            <div class="override-card-header">
                <span class="override-category-badge">${catInfo.icon} ${catInfo.name}</span>
                <button class="override-del-btn" onclick="deleteCalendarEvent('${evt.id}')" title="Delete thing">✖</button>
            </div>
            <div class="override-card-title">${evt.title}</div>
            ${evt.desc ? `<div class="override-card-desc">${evt.desc}</div>` : ''}
        `;
        container.appendChild(card);
    });
}

function toggleAddEventForm() {
    const modal = document.getElementById('addEventModal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        const defaultDate = selectedCalDateStr || new Date().toISOString().split('T')[0];
        document.getElementById('eventDateInput').value = defaultDate;
        document.getElementById('eventTitleInput').value = '';
        document.getElementById('eventDescInput').value = '';
    } else {
        modal.classList.add('hidden');
    }
}

function saveCalendarEventFromForm() {
    const date = document.getElementById('eventDateInput').value;
    const category = document.getElementById('eventCategoryInput').value;
    const title = document.getElementById('eventTitleInput').value.trim();
    const desc = document.getElementById('eventDescInput').value.trim();

    if (!date || !title) {
        alert('valid date and title por flavor (its funny cuz im from portugal yk)');
        return;
    }

    const newEvent = {
        id: Date.now().toString(),
        date,
        category,
        title,
        desc
    };

    calendarEvents.push(newEvent);
    saveCalendarEvents();

    selectedCalDateStr = date;
    const [y, m] = date.split('-');
    calCurrentDate = new Date(parseInt(y), parseInt(m) - 1, 1);

    toggleAddEventForm();
    renderCalendar();

    sfxMessage.currentTime = 0;
    sfxMessage.play().catch(e => null);
}

function deleteCalendarEvent(id) {
    calendarEvents = calendarEvents.filter(e => e.id !== id);
    saveCalendarEvents();
    renderCalendar();
    sfxWinClose.currentTime = 0;
    sfxWinClose.play().catch(e => null);
}

// --- mandachooarddd ---
let mandaGrid = [];
let mandaPlaying = false;
let mandaBpm = 120;
let mandaStepProgress = 0;
let mandaTimer = null;
let mandaAudioCtx = null;
let mandaLoopMode = "FULL";

let mandaZoom = 1.0;
let mandaPanX = 0;
let mandaPanY = 0;
let mandaFitMode = "proportional"; // proportional, horizontal
let isMandaPanning = false;
let mandaPanStartX = 0;
let mandaPanStartY = 0;

let mandaVolumes = {
    percussion: 1.0,
    bass: 1.0,
    melody: 1.0
};

let mandaIso = {
    percussion: true,
    bass: true,
    melody: true
};

// row: 13 rows total
const MANDA_ROWS = [
    { section: 'percussion', symbol: '~', color: '#1c1f20', noteIndex: 0 },
    { section: 'percussion', symbol: 'X', color: '#1c1f20', noteIndex: 1 },
    { section: 'percussion', symbol: 'II', color: '#1c1f20', noteIndex: 2 },
    { section: 'bass', symbol: '𝄢', color: '#38bdf8', freq: 130.81 }, // C3
    { section: 'bass', symbol: '𝄢', color: '#38bdf8', freq: 110.00 }, // A2
    { section: 'bass', symbol: '𝄢', color: '#38bdf8', freq: 98.00 },  // G2
    { section: 'bass', symbol: '𝄢', color: '#38bdf8', freq: 87.31 },  // F2
    { section: 'bass', symbol: '𝄢', color: '#38bdf8', freq: 73.42 },  // D2
    { section: 'melody', symbol: '𝄽', color: '#c084fc', freq: 523.25 }, // C5
    { section: 'melody', symbol: '𝄽', color: '#c084fc', freq: 440.00 }, // A4
    { section: 'melody', symbol: '𝄽', color: '#c084fc', freq: 392.00 }, // G4
    { section: 'melody', symbol: '𝄽', color: '#c084fc', freq: 349.23 }, // F4
    { section: 'melody', symbol: '𝄽', color: '#c084fc', freq: 293.66 }  // D4
];

function initMandachord() {
    mandaGrid = [];
    for (let col = 0; col < 64; col++) {
        let colArr = new Array(13).fill(false);
        mandaGrid.push(colArr);
    }

    loadMandachordComposition(true);

    const canvas = document.getElementById('mandachordCanvas');
    if (!canvas) return;

    canvas.addEventListener('click', handleMandachordClick);
    canvas.addEventListener('mousedown', handleMandachordMouseDown);
    canvas.addEventListener('mousemove', handleMandachordMouseMove);
    window.addEventListener('mouseup', handleMandachordMouseUp);
    canvas.addEventListener('wheel', handleMandachordWheel, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    renderMandachord();
}

// Canvas Panning & Zoom Handlers
function handleMandachordMouseDown(e) {
    if (e.button === 1 || e.button === 2) { // Middle or Right Click to pan
        e.preventDefault();
        isMandaPanning = true;
        mandaPanStartX = e.clientX - mandaPanX;
        mandaPanStartY = e.clientY - mandaPanY;
    }
}

function handleMandachordMouseMove(e) {
    if (isMandaPanning) {
        e.preventDefault();
        mandaPanX = e.clientX - mandaPanStartX;
        mandaPanY = e.clientY - mandaPanStartY;
        renderMandachord();
    }
}

function handleMandachordMouseUp(e) {
    if (isMandaPanning) {
        isMandaPanning = false;
    }
}

function handleMandachordWheel(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    mandaZoom = Math.min(2.5, Math.max(0.6, mandaZoom + delta));
    const zoomSlider = document.getElementById('mandaZoomSlider');
    const zoomVal = document.getElementById('mandaZoomVal');
    if (zoomSlider) zoomSlider.value = mandaZoom;
    if (zoomVal) zoomVal.innerText = `${Math.round(mandaZoom * 100)}%`;
    renderMandachord();
}

function updateMandaZoom(val) {
    mandaZoom = parseFloat(val);
    const zoomVal = document.getElementById('mandaZoomVal');
    if (zoomVal) zoomVal.innerText = `${Math.round(mandaZoom * 100)}%`;
    renderMandachord();
}

function updateMandaFitMode(val) {
    mandaFitMode = val;
    const canvas = document.getElementById('mandachordCanvas');
    if (!canvas) return;
    if (val === 'horizontal') {
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
    } else {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }
    renderMandachord();
}

function resetMandaView() {
    mandaZoom = 1.0;
    mandaPanX = 0;
    mandaPanY = 0;
    const zoomSlider = document.getElementById('mandaZoomSlider');
    const zoomVal = document.getElementById('mandaZoomVal');
    if (zoomSlider) zoomSlider.value = 1.0;
    if (zoomVal) zoomVal.innerText = '100%';
    renderMandachord();
}

// Canvas Rendering
function renderMandachord() {
    const canvas = document.getElementById('mandachordCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Ensure high internal buffer resolution (1200x1200) for razor-sharp crispness
    if (canvas.width !== 1200 || canvas.height !== 1200) {
        canvas.width = 1200;
        canvas.height = 1200;
    }

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Apply Zoom & Pan Transformations
    ctx.save();
    ctx.translate(cx + mandaPanX, cy + mandaPanY);
    ctx.scale(mandaZoom, mandaZoom);

    // Background circle container
    const bgGlow = ctx.createRadialGradient(0, 0, 50, 0, 0, 520);
    bgGlow.addColorStop(0, '#ede8dc');
    bgGlow.addColorStop(0.7, '#e1d9d0');
    bgGlow.addColorStop(1, '#ede8dc');
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 530, 0, Math.PI * 2);
    ctx.fill();

    // Wheel angle offset during playback rotation
    const wheelAngle = -(mandaStepProgress / 64) * 2 * Math.PI;

    ctx.save();
    ctx.rotate(wheelAngle);

    // Radial layout boundaries (scaled to 1200x1200 resolution)
    function getRowRadii(row) {
        if (row <= 2) {
            const r1 = 510 - (row * 46);
            const r2 = 510 - ((row + 1) * 46);
            return { rOuter: r1, rInner: r2 };
        } else if (row <= 7) {
            const bRow = row - 3;
            const r1 = 360 - (bRow * 30);
            const r2 = 360 - ((bRow + 1) * 30);
            return { rOuter: r1, rInner: r2 };
        } else {
            const mRow = row - 8;
            const r1 = 202 - (mRow * 28);
            const r2 = 202 - ((mRow + 1) * 28);
            return { rOuter: r1, rInner: r2 };
        }
    }

    const anglePerCol = (Math.PI * 2) / 64;

    // Draw 64 columns x 13 rows
    for (let col = 0; col < 64; col++) {
        const startAngle = -Math.PI / 2 + col * anglePerCol;
        const endAngle = startAngle + anglePerCol;

        let currentNeedleCol = Math.floor((mandaStepProgress % 64 + 64) % 64);
        const isCurrentCol = (col === currentNeedleCol);

        for (let row = 0; row < 13; row++) {
            const { rOuter, rInner } = getRowRadii(row);
            const rowInfo = MANDA_ROWS[row];
            const isSelected = mandaGrid[col][row];

            let scaleFactor = (isCurrentCol && isSelected) ? 1.10 : 1.0;
            let drawROuter = rInner + (rOuter - rInner) * scaleFactor;
            let drawRInner = rInner;

            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, drawROuter), startAngle + 0.003, endAngle - 0.003);
            ctx.arc(0, 0, Math.max(0, drawRInner), endAngle - 0.003, startAngle + 0.003, true);
            ctx.closePath();

            if (isSelected) {
                // Percussion is clean white/light-grey box with crisp black symbol
                ctx.fillStyle = row <= 2 ? '#e2e8f0' : rowInfo.color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = isCurrentCol ? 3 : 1.5;
                ctx.stroke();

                const midR = (drawRInner + drawROuter) / 2;
                const midA = (startAngle + endAngle) / 2;
                const sx = midR * Math.cos(midA);
                const sy = midR * Math.sin(midA);

                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(midA + Math.PI / 2);
                ctx.fillStyle = row <= 2 ? '#000000' : '#0b0d18'; // Black symbol for Percussion!
                ctx.font = `bold ${row <= 2 ? 18 : 15}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rowInfo.symbol, 0, 0);
                ctx.restore();
            } else {
                // More contrasting outlines: full opacity, brighter section colours
                ctx.strokeStyle = row <= 2 ? '#94a3b8' : rowInfo.color;
                ctx.lineWidth = 1.2;
                ctx.globalAlpha = 0.85;
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                const midR = (rInner + rOuter) / 2;
                const midA = (startAngle + endAngle) / 2;
                const sx = midR * Math.cos(midA);
                const sy = midR * Math.sin(midA);

                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(midA + Math.PI / 2);
                // All symbols dark / black against the white background
                ctx.fillStyle = row <= 2 ? '#1e293b' : '#0d1117';
                ctx.font = `${row <= 2 ? 15 : 13}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rowInfo.symbol, 0, 0);
                ctx.restore();
            }
        }
    }

    // Section Concentric Rings (Clean White)
    ctx.strokeStyle = '#202121';
    ctx.lineWidth = 2.0;
    [510, 370, 360, 210, 202, 60].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    });

    // Subsections 1, 2, 3, 4 (Major white lines at cols 0, 16, 32, 48)
    for (let part = 0; part < 4; part++) {
        const pCol = part * 16;
        const pAngle = -Math.PI / 2 + pCol * anglePerCol;
        ctx.beginPath();
        ctx.moveTo(60 * Math.cos(pAngle), 60 * Math.sin(pAngle));
        ctx.lineTo(530 * Math.cos(pAngle), 530 * Math.sin(pAngle));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Label Part Number on outer rim (Clean White)
        const labelAngle = pAngle + (8 * anglePerCol);
        const lx = 535 * Math.cos(labelAngle);
        const ly = 535 * Math.sin(labelAngle);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(labelAngle + Math.PI / 2);
        ctx.fillStyle = '#202121';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${part + 1}`, 0, 0);
        ctx.restore();
    }

    // Minor dividing lines every 4 columns (softest white lines)
    for (let c = 0; c < 64; c++) {
        if (c % 16 !== 0 && c % 4 === 0) {
            const subAngle = -Math.PI / 2 + c * anglePerCol;
            ctx.beginPath();
            ctx.moveTo(60 * Math.cos(subAngle), 60 * Math.sin(subAngle));
            ctx.lineTo(510 * Math.cos(subAngle), 510 * Math.sin(subAngle));
            ctx.strokeStyle = 'rgb(46 46 46 / 0.7)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    ctx.restore(); // Restore wheel rotation transform (so center hub DOES NOT ROTATE!)

    // FIXED Non-Rotating Center Hub with FLAT WHITE Play/Pause Icon
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; // Flat solid white, no gradient, no glow!
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Play / Pause Icon inside fixed center hub (Flat Dark Contrast)
    ctx.fillStyle = '#0b0d17';
    if (mandaPlaying) {
        // Pause icon (two vertical bars)
        ctx.fillRect(-14, -16, 10, 32);
        ctx.fillRect(4, -16, 10, 32);
    } else {
        // Play icon (triangle pointing right)
        ctx.beginPath();
        ctx.moveTo(-10, -18);
        ctx.lineTo(18, 0);
        ctx.lineTo(-10, 18);
        ctx.closePath();
        ctx.fill();
    }

    // Top 12 O'Clock Fixed Needle / Playhead Throughline (White)
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(0, -540);
    ctx.strokeStyle = '#545757';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgb(158 153 153 / 0.8)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrow pointer at top of playhead (White)
    ctx.beginPath();
    ctx.moveTo(-12, -532);
    ctx.lineTo(12, -532);
    ctx.lineTo(0, -552);
    ctx.closePath();
    ctx.fillStyle = '#545757';
    ctx.fill();

    ctx.restore(); // Restore Zoom & Pan transform
}

// Canvas Click Handler
function handleMandachordClick(e) {
    if (isMandaPanning) return;
    const canvas = document.getElementById('mandachordCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rawMx = (e.clientX - rect.left) * scaleX;
    const rawMy = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Reverse Pan & Zoom transforms to find world coordinates
    const mx = (rawMx - cx - mandaPanX) / mandaZoom;
    const my = (rawMy - cy - mandaPanY) / mandaZoom;

    const r = Math.hypot(mx, my);

    // Click center hub (r <= 60) toggles Play / Pause!
    if (r <= 60) {
        toggleMandachordPlay();
        return;
    }

    if (r < 60 || r > 510) return;

    let row = -1;
    if (r >= 370 && r <= 510) {
        row = Math.floor((510 - r) / 46);
    } else if (r >= 210 && r < 360) {
        row = 3 + Math.floor((360 - r) / 30);
    } else if (r >= 60 && r < 202) {
        row = 8 + Math.floor((202 - r) / 28);
    }

    if (row < 0 || row > 12) return;

    const wheelAngle = -(mandaStepProgress / 64) * 2 * Math.PI;
    let angle = Math.atan2(my, mx) - wheelAngle;

    let normAngle = (angle - (-Math.PI / 2)) % (Math.PI * 2);
    if (normAngle < 0) normAngle += Math.PI * 2;

    const anglePerCol = (Math.PI * 2) / 64;
    let col = Math.floor(normAngle / anglePerCol) % 64;

    mandaGrid[col][row] = !mandaGrid[col][row];

    if (mandaGrid[col][row]) {
        playMandachordNote(row);
    }

    renderMandachord();
}

// Audio Synthesis Engine (Web Audio API)
function getMandaAudioCtx() {
    if (!mandaAudioCtx) {
        mandaAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (mandaAudioCtx.state === 'suspended') {
        mandaAudioCtx.resume();
    }
    return mandaAudioCtx;
}

function playMandachordNote(row) {
    const ctx = getMandaAudioCtx();
    const rowInfo = MANDA_ROWS[row];
    const sec = rowInfo.section;

    if (!mandaIso[sec]) return;
    const gainVal = (mandaVolumes[sec] || 1.0) * (systemVolume || 0.5);
    if (gainVal <= 0) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(gainVal, now);
    masterGain.connect(ctx.destination);

    if (sec === 'percussion') {
        if (rowInfo.noteIndex === 0) {
            // Hi-Hat
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 7000;

            const env = ctx.createGain();
            env.gain.setValueAtTime(0.7, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            noise.connect(filter);
            filter.connect(env);
            env.connect(masterGain);

            noise.start(now);
            noise.stop(now + 0.05);
        } else if (rowInfo.noteIndex === 1) {
            // Snare
            const osc = ctx.createOscillator();
            const toneEnv = ctx.createGain();
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            toneEnv.gain.setValueAtTime(0.8, now);
            toneEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(toneEnv);
            toneEnv.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.1);

            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const nEnv = ctx.createGain();
            nEnv.gain.setValueAtTime(0.6, now);
            nEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            noise.connect(nEnv);
            nEnv.connect(masterGain);
            noise.start(now);
            noise.stop(now + 0.1);
        } else {
            // Kick Drum
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
            env.gain.setValueAtTime(1.0, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(env);
            env.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } else if (sec === 'bass') {
        // Deep Synth Bass Saw/Tri
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const env = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rowInfo.freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        env.gain.setValueAtTime(0.7, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.22);
    } else if (sec === 'melody') {
        // Clean Synth Bell/Lead
        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(rowInfo.freq, now);

        env.gain.setValueAtTime(0.6, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(env);
        env.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }
}

// Playback Transport Loop
function toggleMandachordPlay() {
    mandaPlaying = !mandaPlaying;
    if (mandaPlaying) {
        getMandaAudioCtx();
        startMandachordLoop();
    } else {
        stopMandachordLoop();
    }
    renderMandachord();
}

let lastMandaStepInt = -1;
function startMandachordLoop() {
    if (mandaTimer) cancelAnimationFrame(mandaTimer);

    let lastTime = performance.now();

    function stepLoop(now) {
        if (!mandaPlaying) return;
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        const stepsPerSec = (mandaBpm / 60) * 4;
        mandaStepProgress += dt * stepsPerSec;

        let minStep = 0;
        let maxStep = 64;
        if (mandaLoopMode === 'PART1') { minStep = 0; maxStep = 16; }
        else if (mandaLoopMode === 'PART2') { minStep = 16; maxStep = 32; }
        else if (mandaLoopMode === 'PART3') { minStep = 32; maxStep = 48; }
        else if (mandaLoopMode === 'PART4') { minStep = 48; maxStep = 64; }

        const range = maxStep - minStep;
        if (mandaStepProgress >= maxStep || mandaStepProgress < minStep) {
            mandaStepProgress = minStep + (((mandaStepProgress - minStep) % range + range) % range);
            lastMandaStepInt = -1;
        }

        const currentStepInt = Math.floor(mandaStepProgress);
        if (currentStepInt !== lastMandaStepInt) {
            lastMandaStepInt = currentStepInt;
            const col = currentStepInt % 64;
            for (let r = 0; r < 13; r++) {
                if (mandaGrid[col][r]) {
                    playMandachordNote(r);
                }
            }
        }

        renderMandachord();
        mandaTimer = requestAnimationFrame(stepLoop);
    }

    mandaTimer = requestAnimationFrame(stepLoop);
}

function stopMandachordLoop() {
    if (mandaTimer) {
        cancelAnimationFrame(mandaTimer);
        mandaTimer = null;
    }
    renderMandachord();
}

// Side Control Handlers
function updateMandachordBpm(val) {
    mandaBpm = parseInt(val);
    document.getElementById('mandaBpmVal').innerText = val;
}

function updateMandaVol(type, val) {
    mandaVolumes[type] = parseFloat(val) / 100;
    const labelId = `valVol${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const el = document.getElementById(labelId);
    if (el) el.innerText = val;
}

function toggleMandaIso(type) {
    mandaIso[type] = !mandaIso[type];
    const btnId = `iso${type.charAt(0).toUpperCase() + type.slice(1)}Btn`;
    const btn = document.getElementById(btnId);
    if (btn) {
        if (mandaIso[type]) {
            btn.classList.add('active');
            btn.innerText = '||| ✓';
        } else {
            btn.classList.remove('active');
            btn.innerText = '||| OFF';
        }
    }
}

function changeMandaLoop(val) {
    mandaLoopMode = val;
    if (val === 'PART1') mandaStepProgress = 0;
    else if (val === 'PART2') mandaStepProgress = 16;
    else if (val === 'PART3') mandaStepProgress = 32;
    else if (val === 'PART4') mandaStepProgress = 48;
    else mandaStepProgress = 0;
    renderMandachord();
}

function clearMandachordNotes() {
    for (let c = 0; c < 64; c++) {
        for (let r = 0; r < 13; r++) {
            mandaGrid[c][r] = false;
        }
    }
    renderMandachord();
}

function copyMandachordNotes() {
    const jsonStr = JSON.stringify(mandaGrid);
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert('Mandachord pattern copied to clipboard!');
    }).catch(() => {
        alert('Mandachord pattern copied!');
    });
}

function saveMandachordComposition() {
    const data = {
        grid: mandaGrid,
        bpm: mandaBpm,
        volumes: mandaVolumes,
        iso: mandaIso,
        loopMode: mandaLoopMode
    };
    const str = JSON.stringify(data);
    localStorage.setItem('mandachord_saved_song', str);

    document.cookie = "mandachord_saved_song=" + encodeURIComponent(str) + "; path=/; max-age=31536000";

    sfxMessage.currentTime = 0;
    sfxMessage.play().catch(e => null);
    alert('Composition saved to Cookies & LocalStorage!');
}

function reloadMandachordComposition() {
    loadMandachordComposition(false);
    renderMandachord();
    alert('Composition reloaded!');
}

function loadMandachordComposition(silent = false) {
    let saved = localStorage.getItem('mandachord_saved_song');

    if (!saved) {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            const [k, v] = c.trim().split('=');
            if (k === 'mandachord_saved_song' && v) {
                saved = decodeURIComponent(v);
                break;
            }
        }
    }

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.grid && parsed.grid.length === 64) {
                mandaGrid = parsed.grid;
            }
            if (parsed.bpm) {
                mandaBpm = parsed.bpm;
                const bpmSlider = document.getElementById('mandaBpmSlider');
                const bpmVal = document.getElementById('mandaBpmVal');
                if (bpmSlider) bpmSlider.value = mandaBpm;
                if (bpmVal) bpmVal.innerText = mandaBpm;
            }
            if (parsed.volumes) mandaVolumes = parsed.volumes;
            if (parsed.iso) mandaIso = parsed.iso;
            if (parsed.loopMode) mandaLoopMode = parsed.loopMode;
        } catch (e) {
            console.error('Failed parsing saved Mandachord song', e);
        }
    }
}

function loadMandachordSongPrompt() {
    const input = prompt("Paste Mandachord JSON composition string:");
    if (input) {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed) && parsed.length === 64) {
                mandaGrid = parsed;
                renderMandachord();
                alert("Song loaded successfully!");
            } else if (parsed.grid && parsed.grid.length === 64) {
                mandaGrid = parsed.grid;
                renderMandachord();
                alert("Song composition loaded!");
            } else {
                alert("Invalid Mandachord song format.");
            }
        } catch (e) {
            alert("Error parsing composition string.");
        }
    }
}
