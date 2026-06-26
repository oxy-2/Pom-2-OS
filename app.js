function enterOS() {
    document.getElementById("welcome").style.display = "none";
    document.getElementById("desktop").style.display = "block";
    localStorage.setItem("entered", "true");
}

/* COOKIE */
document.getElementById("cookieBtn").onclick = function () {
    document.getElementById("cookieModal").style.display = "none";
    localStorage.setItem("cookies", "true");
};

/* APPS */
function openApp(id) {
    const app = document.getElementById(id);

    if (app.classList.contains("hidden")) {
        app.classList.remove("hidden");
    } else {
        app.classList.add("hidden");
    }
}

/* LOAD STATE */
window.onload = function () {

    if (localStorage.getItem("entered")) {
        document.getElementById("welcome").style.display = "none";
        document.getElementById("desktop").style.display = "block";
    }

    if (localStorage.getItem("cookies")) {
        document.getElementById("cookieModal").style.display = "none";
    }

};