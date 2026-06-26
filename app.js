// --- State & Variables ---
let highestZIndex = 10;
let spawnOffset = 0;

// --- Audio System ---
// Assuming these are inside your /static/ folder alongside the images!
const sfxPowerOn = new Audio('static/Pom-2-power-on.mp3');
const sfxPowerOff = new Audio('static/Pom-2-power-off.mp3');
const sfxWinOpen = new Audio('static/Pom-2-window-open.mp3');
const sfxWinClose = new Audio('static/Pom-2-window-close.mp3');

// --- Boot Sequence ---
window.onload = function () {
    const hasCookies = localStorage.getItem("cookiesAccepted");
    const hasEntered = localStorage.getItem("systemEntered");

    if (!hasCookies) {
        document.getElementById("cookieModal").classList.remove("hidden");
    } else if (hasCookies && !hasEntered) {
        document.getElementById("welcome").classList.remove("hidden");
    } else if (hasCookies && hasEntered) {
        document.getElementById("desktop").classList.remove("hidden");

        // Note for Evan: Browsers block autoplaying audio on page load if the user
        // hasn't clicked anywhere yet. If they hard-refresh the page and go straight
        // to desktop, this might be silent until they click an app.
        sfxPowerOn.play().catch(e => console.log("Autoplay blocked until user interaction"));
    }
};

// --- Welcome / Login Actions ---
document.getElementById("cookieBtn").onclick = function () {
    localStorage.setItem("cookiesAccepted", "true");

    // Smoothly fade out the cookie modal, then hide it entirely
    const modal = document.getElementById("cookieModal");
    modal.classList.add("fade-out");
    setTimeout(() => {
        modal.classList.add("hidden");
        document.getElementById("welcome").classList.remove("hidden");
    }, 300);
};

function enterOS() {
    localStorage.setItem("systemEntered", "true");
    sfxPowerOn.play(); // Play start sound

    const welcome = document.getElementById("welcome");
    document.getElementById("desktop").classList.remove("hidden");

    // Trigger the fast slide-to-the-left animation in CSS
    welcome.classList.add("slide-out");

    // Completely hide it from the DOM after the 600ms CSS animation finishes
    setTimeout(() => {
        welcome.classList.add("hidden");
    }, 600);
}

function quitOS() {
    sfxPowerOff.play(); // Play shutdown sound

    // Wait for the sound to play for 1 second, then redirect to Stardance
    setTimeout(() => {
        window.location.href = "https://stardance.hackclub.com/";
    }, 1000);
}

// --- Window App Management ---
function openApp(id) {
    const appWindow = document.getElementById(id);

    if (appWindow.classList.contains("hidden")) {
        sfxWinOpen.play(); // Play window open sound
        appWindow.classList.remove("hidden");
        appWindow.classList.remove("closing"); // Reset in case it was closed previously

        // Stagger spawn positions
        appWindow.style.top = (80 + spawnOffset) + "px";
        appWindow.style.left = (80 + spawnOffset) + "px";

        spawnOffset += 30;
        if (spawnOffset > 150) spawnOffset = 0;
    }

    bringToFront(appWindow);
}

function closeApp(id) {
    const appWindow = document.getElementById(id);
    sfxWinClose.play(); // Play window close sound

    // Trigger the CSS closing animation (shrink + fade out)
    appWindow.classList.add("closing");

    // Wait for the 200ms CSS transition to finish before actually hiding it
    setTimeout(() => {
        appWindow.classList.add("hidden");
    }, 200);
}

function openImageViewer(imageSrc) {
    const viewerApp = document.getElementById("imageViewer");
    const imgElement = document.getElementById("viewerImg");
    imgElement.src = imageSrc;
    openApp("imageViewer");
}

function bringToFront(element) {
    highestZIndex++;
    element.style.zIndex = highestZIndex;
}

// --- Window Dragging Logic ---
const windows = document.querySelectorAll(".window");

windows.forEach(win => {
    const header = win.querySelector(".window-header");
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    win.addEventListener("mousedown", () => bringToFront(win));

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - win.getBoundingClientRect().left;
        offsetY = e.clientY - win.getBoundingClientRect().top;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        win.style.left = (e.clientX - offsetX) + "px";
        win.style.top = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
});