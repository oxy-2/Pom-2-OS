// --- State & Variables ---
let highestZIndex = 10;
let spawnOffset = 0; // Tracks how much to shift the next spawned window

// Check cookies and session on load
window.onload = function () {
    const hasCookies = localStorage.getItem("cookiesAccepted");
    const hasEntered = localStorage.getItem("systemEntered");

    // If no cookies, show modal immediately
    if (!hasCookies) {
        document.getElementById("cookieModal").classList.remove("hidden");
    } else if (hasCookies && !hasEntered) {
        // If cookies accepted but not logged in, show welcome screen
        document.getElementById("welcome").classList.remove("hidden");
    } else if (hasCookies && hasEntered) {
        // If both done, jump straight to desktop
        document.getElementById("desktop").classList.remove("hidden");
    }
};

// --- Buttons ---
document.getElementById("cookieBtn").onclick = function () {
    localStorage.setItem("cookiesAccepted", "true");
    document.getElementById("cookieModal").classList.add("hidden");
    document.getElementById("welcome").classList.remove("hidden");
};

function enterOS() {
    localStorage.setItem("systemEntered", "true");
    document.getElementById("welcome").classList.add("hidden");
    document.getElementById("desktop").classList.remove("hidden");
}

// --- App Management ---
function openApp(id) {
    const appWindow = document.getElementById(id);

    // Only apply offsets if the window is currently hidden (fresh spawn)
    if (appWindow.classList.contains("hidden")) {
        appWindow.classList.remove("hidden");

        // Stagger the spawn position so they don't overlap perfectly
        appWindow.style.top = (80 + spawnOffset) + "px";
        appWindow.style.left = (80 + spawnOffset) + "px";

        // Increase offset for the next window (reset if it gets too big)
        spawnOffset += 30;
        if (spawnOffset > 150) spawnOffset = 0;
    }

    bringToFront(appWindow);
}

function closeApp(id) {
    document.getElementById(id).classList.add("hidden");
}

// Opens the image viewer and dynamically changes the image source
function openImageViewer(imageSrc) {
    const viewerApp = document.getElementById("imageViewer");
    const imgElement = document.getElementById("viewerImg");

    imgElement.src = imageSrc;
    openApp("imageViewer");
}

// Make sure the clicked window always goes over the others
function bringToFront(element) {
    highestZIndex++;
    element.style.zIndex = highestZIndex;
}

// --- Window Dragging Logic (Evan, read this!) ---
// We grab all window elements and apply the drag logic to them
const windows = document.querySelectorAll(".window");

windows.forEach(win => {
    const header = win.querySelector(".window-header");
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Bring window to front when clicked anywhere inside it
    win.addEventListener("mousedown", () => bringToFront(win));

    // Start dragging when clicking the header
    header.addEventListener("mousedown", (e) => {
        isDragging = true;

        // Calculate the difference between the mouse click and the window's top-left corner
        offsetX = e.clientX - win.getBoundingClientRect().left;
        offsetY = e.clientY - win.getBoundingClientRect().top;
    });

    // Move the window when the mouse moves (attached to document so it doesn't break if you move the mouse fast)
    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        // Set new position based on mouse position minus the initial offset
        win.style.left = (e.clientX - offsetX) + "px";
        win.style.top = (e.clientY - offsetY) + "px";
    });

    // Stop dragging when mouse is released
    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
});