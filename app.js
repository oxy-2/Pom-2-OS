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

function updateSysVolume(val) {
    systemVolume = parseFloat(val);
    sfxPowerOn.volume = systemVolume;
    sfxPowerOff.volume = systemVolume;
    sfxWinOpen.volume = systemVolume;
    sfxWinClose.volume = systemVolume;
    sfxTyping.volume = systemVolume;
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