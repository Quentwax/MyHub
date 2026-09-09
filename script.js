/* ==========================================
   HORLOGE
========================================== */

function updateClock() {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");


    // Heure dans le header
    const currentTime = document.getElementById("currentTime");

    if (currentTime) {
        currentTime.textContent = `${hours}:${minutes}:${seconds}`;
    }


    // Date dans le header
    const currentDate = document.getElementById("currentDate");

    if (currentDate) {

        currentDate.textContent = now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    }


    // Grande horloge du dashboard
    const bigClock = document.getElementById("bigClock");

    if (bigClock) {
        bigClock.textContent = `${hours}:${minutes}:${seconds}`;
    }


    // Date sous la grande horloge
    const fullDate = document.getElementById("fullDate");

    if (fullDate) {

        fullDate.textContent = now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    }

}

updateClock();

setInterval(updateClock, 1000);


/* ==========================================
   JARVIS
========================================== */

const jarvisInput = document.getElementById("jarvisInput");
const jarvisSend = document.getElementById("jarvisSend");
const jarvisChat = document.getElementById("jarvisChat");


/*
    Ajoute un message dans la conversation
*/

function addMessage(sender, text, type) {

    if (!jarvisChat) {
        return;
    }

    const message = document.createElement("div");

    message.classList.add("message");

    if (type === "user") {
        message.classList.add("user-message");
    } else {
        message.classList.add("jarvis-message");
    }


    message.innerHTML = `
        <strong>${sender}</strong>
        <p>${text}</p>
    `;


    jarvisChat.appendChild(message);

    // Descendre automatiquement vers le dernier message
    jarvisChat.scrollTop = jarvisChat.scrollHeight;

}


/*
    Cerveau de JARVIS
*/

function processCommand(command) {

    const text = command.toLowerCase().trim();


    // ==============================
    // BONJOUR
    // ==============================

    if (
        text.includes("bonjour") ||
        text.includes("salut") ||
        text.includes("hello")
    ) {

        return "Bonjour ! Ravi de te revoir. 👋";

    }


    // ==============================
    // HEURE
    // ==============================

    if (text.includes("heure")) {

        const now = new Date();

        return `Il est actuellement ${now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        })}.`;

    }


    // ==============================
    // MYDLP
    // ==============================

    if (
        text.includes("mydlp") &&
        (
            text.includes("ouvre") ||
            text.includes("lance") ||
            text.includes("aller sur") ||
            text.includes("va sur")
        )
    ) {

        window.open(
            "https://quentwax.github.io/My-DLP/index.html",
            "_blank"
        );

        return "J'ouvre MyDLP. 🎢";

    }


    // ==============================
    // LUDOTHÈQUE
    // ==============================

    if (
        (
            text.includes("ludothèque") ||
            text.includes("ludotheque")
        ) &&
        (
            text.includes("ouvre") ||
            text.includes("lance") ||
            text.includes("aller sur") ||
            text.includes("va sur")
        )
    ) {

        window.open(
            "https://quentwax.github.io/jeux_societe/",
            "_blank"
        );

        return "J'ouvre ta ludothèque. 🎲";

    }


    // ==============================
    // GITHUB
    // ==============================

    if (
        text.includes("github") &&
        (
            text.includes("ouvre") ||
            text.includes("lance") ||
            text.includes("aller sur") ||
            text.includes("va sur")
        )
    ) {

        window.open(
            "https://github.com/quentwax",
            "_blank"
        );

        return "J'ouvre GitHub. 💻";

    }


    // ==============================
    // AIDE
    // ==============================

    if (
        text === "aide" ||
        text.includes("que peux-tu faire") ||
        text.includes("que peux tu faire") ||
        text.includes("commandes")
    ) {

        return `
            Je peux actuellement :
            <br><br>
            • Te donner l'heure 🕐<br>
            • Ouvrir MyDLP 🎢<br>
            • Ouvrir ta ludothèque 🎲<br>
            • Ouvrir GitHub 💻<br>
            • Répondre à des salutations 👋
        `;

    }


    // ==============================
    // COMMANDE INCONNUE
    // ==============================

    return "Je n'ai pas encore appris cette commande. 🤔";

}


/*
    Envoi d'une commande
*/

function sendCommand() {

    if (!jarvisInput) {
        return;
    }


    const command = jarvisInput.value.trim();

    if (command === "") {
        return;
    }


    // Message utilisateur
    addMessage(
        "Vous",
        command,
        "user"
    );


    // Vider le champ
    jarvisInput.value = "";


    // Réponse JARVIS
    const response = processCommand(command);


    // Petit délai
    setTimeout(() => {

        addMessage(
            "JARVIS",
            response,
            "jarvis"
        );

    }, 300);

}


/*
    Bouton envoyer
*/

if (jarvisSend) {

    jarvisSend.addEventListener(
        "click",
        sendCommand
    );

}


/*
    Touche Entrée
*/

if (jarvisInput) {

    jarvisInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendCommand();

            }

        }
    );

}


/* ==========================================
   NAVIGATION ENTRE LES PAGES
========================================== */

const navItems = document.querySelectorAll(".nav-item");


/*
    Association :
    
    Accueil       → homeSection
    JARVIS        → jarvisSection
    MyDLP         → mydlpSection
    Ludothèque    → ludothequeSection
    Musique       → musicSection
    Paramètres    → settingsSection
*/

const sections = {

    "Accueil": "homeSection",

    "JARVIS": "jarvisSection",

    "MyDLP": "mydlpSection",

    "Ludothèque": "ludothequeSection",

    "Musique": "musicSection",

    "Paramètres": "settingsSection"

};


/*
    Fonction pour afficher une section
*/

function showSection(sectionId) {

    const allSections = document.querySelectorAll(".page-section");

    allSections.forEach(section => {

        section.classList.remove("active-section");

    });


    const targetSection = document.getElementById(sectionId);

    if (targetSection) {

        targetSection.classList.add("active-section");

    }

}


/*
    Gestion des boutons de navigation
*/

navItems.forEach(item => {

    item.addEventListener("click", () => {


        // Retirer active de tous les boutons
        navItems.forEach(nav => {

            nav.classList.remove("active");

        });


        // Activer le bouton sélectionné
        item.classList.add("active");


        // Récupérer le texte du bouton
        const spans = item.querySelectorAll("span");

        if (spans.length < 2) {
            return;
        }


        const pageName = spans[1].textContent.trim();


        // Trouver la section correspondante
        const sectionId = sections[pageName];


        if (sectionId) {

            showSection(sectionId);

        }


        // Fermer le menu mobile
        if (sidebar) {

            sidebar.classList.remove("open");

        }

    });

});


/* ==========================================
   MENU MOBILE
========================================== */

const mobileMenu = document.getElementById("mobileMenu");

const sidebar = document.querySelector(".sidebar");


if (mobileMenu && sidebar) {

    mobileMenu.addEventListener("click", () => {

        // IMPORTANT :
        // Le CSS utilise .open
        // et non .active

        sidebar.classList.toggle("open");

    });

}

