/* ==========================================
   MYHUB - SCRIPT.JS
========================================== */


/* ==========================================
   HORLOGE
========================================== */

function updateClock() {

    const now = new Date();

    const hours =
        String(now.getHours()).padStart(2, "0");

    const minutes =
        String(now.getMinutes()).padStart(2, "0");

    const seconds =
        String(now.getSeconds()).padStart(2, "0");


    // Heure dans le header
    const currentTime =
        document.getElementById("currentTime");

    if (currentTime) {

        currentTime.textContent =
            `${hours}:${minutes}:${seconds}`;
    }


    // Date dans le header
    const currentDate =
        document.getElementById("currentDate");

    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }


    // Grande horloge du dashboard
    const bigClock =
        document.getElementById("bigClock");

    if (bigClock) {

        bigClock.textContent =
            `${hours}:${minutes}:${seconds}`;
    }


    // Date sous la grande horloge
    const fullDate =
        document.getElementById("fullDate");

    if (fullDate) {

        fullDate.textContent =
            now.toLocaleDateString("fr-FR", {
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
   MINUTEUR LOCAL
========================================== */

let activeTimerEndTime = null;
let activeTimerInterval = null;

const timerDisplay =
    document.getElementById("timerDisplay");

function clearTimer() {

    if (activeTimerInterval) {
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
    }

    activeTimerEndTime = null;

    if (timerDisplay) {
        timerDisplay.textContent = "Aucun minuteur";
    }
}

function formatTimerRemaining(msLeft) {

    const totalSeconds =
        Math.max(0, Math.ceil(msLeft / 1000));

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor((totalSeconds % 3600) / 60);

    const seconds =
        totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }

    return `${seconds}s`;
}

function renderTimer() {

    if (!timerDisplay) {
        return;
    }

    if (!activeTimerEndTime) {
        timerDisplay.textContent = "Aucun minuteur";
        return;
    }

    const remainingMs =
        activeTimerEndTime - Date.now();

    if (remainingMs <= 0) {
        timerDisplay.textContent = "Minuteur terminé !";
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
        activeTimerEndTime = null;
        return;
    }

    timerDisplay.textContent =
        `Minuteur : ${formatTimerRemaining(remainingMs)}`;
}

function startTimerFromSeconds(totalSeconds) {

    if (totalSeconds <= 0) {
        return false;
    }

    activeTimerEndTime = Date.now() + (totalSeconds * 1000);

    if (activeTimerInterval) {
        clearInterval(activeTimerInterval);
    }

    renderTimer();

    activeTimerInterval =
        setInterval(renderTimer, 1000);

    return true;
}

function parseTimerCommand(commandText) {

    const normalized =
        String(commandText || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[-_]/g, " ")
            .replace(/[?!.,;:]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    if (!normalized) {
        return null;
    }

    const candidates = [
        normalized,
        normalized.replace(/^(?:mets?|met|lance|demarre|démarre|départ|depart)\s+(?:un\s+)?(?:le\s+)?(?:minuteur|timer|chrono)\s*(?:de|a|à|pour)?\s*/, ""),
        normalized.replace(/^(?:mets?|met|lance|demarre|démarre|départ|depart)\s+(?:un\s+)?/, ""),
        normalized.replace(/^(?:minuteur|timer|chrono)\s*(?:de|a|à|pour)?\s*/, "")
    ];

    for (const candidate of candidates) {

        const timerMatch =
            candidate.match(/^(\d+(?:[.,]\d+)?)\s*(minute|min|minutes|m|seconde|secondes|s|heure|heures|h)?$/);

        if (!timerMatch) {
            continue;
        }

        const value =
            Number(timerMatch[1].replace(",", "."));

        const unit =
            (timerMatch[2] || "minute").toLowerCase();

        if (!Number.isFinite(value) || value <= 0) {
            continue;
        }

        if (["heure", "heures", "h"].includes(unit)) {
            return value * 3600;
        }

        if (["minute", "minutes", "min", "m"].includes(unit)) {
            return value * 60;
        }

        return value;
    }

    return null;
}

renderTimer();


/* ==========================================
   MÉTÉO ELBEUF
========================================== */

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=49.286&longitude=1.0&current=temperature_2m,weather_code&timezone=Europe%2FParis";

const weatherCodeMap = {
    0: "Ciel dégagé",
    1: "Peu nuageux",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine forte",
    56: "Bruine verglaçante",
    57: "Bruine verglaçante forte",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    66: "Pluie verglaçante",
    67: "Pluie verglaçante forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grésil",
    80: "Averses légères",
    81: "Averses modérées",
    82: "Averses fortes",
    85: "Neige légère",
    86: "Neige forte",
    95: "Orage",
    96: "Orage avec grêle",
    99: "Orage avec grêle fort"
};

async function loadWeatherElbeuf() {

    const tempElement =
        document.getElementById("weatherTemperature");

    const textElement =
        document.getElementById("weatherDescription");

    if (!tempElement || !textElement) {
        return;
    }

    try {
        const response =
            await fetch(WEATHER_API_URL);

        if (!response.ok) {
            throw new Error("Météo indisponible");
        }

        const data = await response.json();
        const temperature =
            data?.current?.temperature_2m;

        const weatherCode =
            data?.current?.weather_code;

        const label =
            weatherCodeMap[weatherCode] || "Météo variable";

        tempElement.textContent = `${Math.round(temperature)}°`;
        textElement.textContent = label;

    } catch (error) {
        console.error("Erreur météo Elbeuf :", error);
        tempElement.textContent = "--°";
        textElement.textContent = "Météo indisponible";
    }
}

loadWeatherElbeuf();


/* ==========================================
   CHECKLIST TÂCHES
========================================== */

const TASKS_KEY = "myhub_tasks";
let taskList = [];

const tasksListElement =
    document.getElementById("tasksList");

const addTaskButton =
    document.getElementById("addTaskButton");

function loadTasks() {

    try {

        const saved =
            localStorage.getItem(TASKS_KEY);

        if (!saved) {
            taskList = [
                "Configurer MyHub",
                "Créer les widgets",
                "Ajouter JARVIS"
            ];
            return;
        }

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length) {
            taskList = parsed.filter(item => typeof item === "string" && item.trim() !== "");
            return;
        }

    } catch (error) {
        console.error("Impossible de charger les tâches :", error);
    }

    taskList = [];
}

function saveTasks() {

    try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(taskList));
    } catch (error) {
        console.error("Impossible de sauver les tâches :", error);
    }
}

function renderTasks() {

    if (!tasksListElement) {
        return;
    }

    tasksListElement.innerHTML = "";

    if (taskList.length === 0) {

        const emptyState =
            document.createElement("p");

        emptyState.className = "task-empty";
        emptyState.textContent = "Aucune tâche pour le moment.";
        tasksListElement.appendChild(emptyState);
        return;
    }

    taskList.forEach(taskText => {

        const label = document.createElement("label");
        label.className = "task";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";

        const span = document.createElement("span");
        span.textContent = taskText;

        checkbox.addEventListener("change", () => {

            if (checkbox.checked) {
                taskList = taskList.filter(item => item !== taskText);
                saveTasks();
                renderTasks();
            }
        });

        label.appendChild(checkbox);
        label.appendChild(span);
        tasksListElement.appendChild(label);
    });
}

function addTask() {

    const value =
        window.prompt("Ajouter une tâche :", "");

    if (value === null) {
        return;
    }

    const cleaned = value.trim();

    if (!cleaned) {
        return;
    }

    taskList.push(cleaned);
    saveTasks();
    renderTasks();
}

loadTasks();
renderTasks();

if (addTaskButton) {
    addTaskButton.addEventListener("click", addTask);
}


/* ==========================================
   JARVIS
========================================== */

const JARVIS_API_URL =
    "https://jarvis-api.quentwax76.workers.dev/";


const jarvisInput =
    document.getElementById("jarvisInput");

const jarvisSend =
    document.getElementById("jarvisSend");

const jarvisChat =
    document.getElementById("jarvisChat");

const voiceToggleButton =
    document.getElementById("voiceToggleButton");

const voiceStatus =
    document.getElementById("voiceStatus");

let voiceRecognition = null;
let isVoiceListening = false;
let continuousVoiceMode = false;
let lastVoiceCommand = "";
let lastProcessedVoiceText = "";

const JARVIS_SETTINGS_KEY = "jarvis_voice_settings";

const defaultJarvisSettings = {
    volume: 1.0,
    voiceProfile: "male"
};

function clampJarvisVolume(value) {
    return Math.min(1, Math.max(0, Number(value ?? defaultJarvisSettings.volume) || 0));
}

let jarvisVoiceSettings = { ...defaultJarvisSettings };

const jarvisVolumeControl = document.getElementById("jarvisVolumeControl");
const jarvisVolumeValue = document.getElementById("jarvisVolumeValue");
const jarvisVoicePreset = document.getElementById("jarvisVoicePreset");

function loadJarvisSettings() {
    try {
        const saved = localStorage.getItem(JARVIS_SETTINGS_KEY);

        if (!saved) {
            return;
        }

        const parsed = JSON.parse(saved);

        jarvisVoiceSettings = {
            ...defaultJarvisSettings,
            ...parsed,
            volume: clampJarvisVolume(parsed.volume ?? defaultJarvisSettings.volume)
        };
    } catch (error) {
        console.warn("Impossible de charger les réglages de voix Jarvis :", error);
        jarvisVoiceSettings = { ...defaultJarvisSettings };
    }
}

function saveJarvisSettings() {
    try {
        localStorage.setItem(JARVIS_SETTINGS_KEY, JSON.stringify(jarvisVoiceSettings));
    } catch (error) {
        console.warn("Impossible d'enregistrer les réglages de voix Jarvis :", error);
    }
}

function renderJarvisSettingsUi() {
    if (jarvisVolumeControl) {
        jarvisVolumeControl.value = String(Math.round(clampJarvisVolume(jarvisVoiceSettings.volume) * 100));
    }

    if (jarvisVolumeValue) {
        jarvisVolumeValue.textContent = `${Math.round(clampJarvisVolume(jarvisVoiceSettings.volume) * 100)}%`;
    }

    if (jarvisVoicePreset) {
        jarvisVoicePreset.value = jarvisVoiceSettings.voiceProfile || "male";
    }
}

function updateJarvisVoiceSettings() {
    if (jarvisVolumeControl) {
        jarvisVoiceSettings.volume = clampJarvisVolume(Number(jarvisVolumeControl.value) / 100);
    }

    if (jarvisVoicePreset) {
        jarvisVoiceSettings.voiceProfile = jarvisVoicePreset.value;
    }

    renderJarvisSettingsUi();
    saveJarvisSettings();
}

function getPreferredJarvisVoice(profile = jarvisVoiceSettings.voiceProfile || "male") {
    const voices = window.speechSynthesis.getVoices();

    if (profile === "female") {
        return voices.find(voice => /fr/i.test(voice.lang) && /(femme|female|woman|julie|hortense|sophie|zoe|victoria|charlotte|amelie|alice|claire|marie|jennifer)/i.test(voice.name)) ||
               voices.find(voice => /fr/i.test(voice.lang) && /(julie|hortense|zoe|sophie|charlotte|amelie|claire|alice)/i.test(voice.name)) ||
               voices.find(voice => /fr/i.test(voice.lang));
    }

    if (profile === "neutral") {
        return voices.find(voice => /fr/i.test(voice.lang)) || voices[0];
    }

    return voices.find(voice => /fr/i.test(voice.lang) && /(paul|eric|david|mark|michael|steven|jonathan|guy|thomas|alex|nicolas|marc|roger|benjamin|anthony|gustave|henri|charles|louis|olivier)/i.test(voice.name)) ||
           voices.find(voice => /fr/i.test(voice.lang) && /(paul|eric|david|mark|guy|thomas|alex|nicolas|jean|marc|patrick|louis|olivier)/i.test(voice.name)) ||
           voices.find(voice => /fr/i.test(voice.lang)) ||
           voices[0];
}

function updateVoiceUi() {

    if (voiceToggleButton) {
        voiceToggleButton.classList.toggle("listening", isVoiceListening || continuousVoiceMode);
        voiceToggleButton.setAttribute("aria-pressed", String(isVoiceListening || continuousVoiceMode));
        voiceToggleButton.textContent = isVoiceListening || continuousVoiceMode ? "🔴" : "🎤";
    }

    if (voiceStatus) {
        voiceStatus.classList.toggle("active", isVoiceListening || continuousVoiceMode);
        voiceStatus.textContent = continuousVoiceMode
            ? "Mode continu actif"
            : (isVoiceListening ? "J'écoute..." : "Micro inactif");
    }
}

function sanitizeSpeechText(text) {
    return String(text || "")
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
        .replace(/[\u2600-\u27BF]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function speakJarvisReply(text) {

    const cleanText = sanitizeSpeechText(text);

    if (!cleanText || !("speechSynthesis" in window)) {
        return;
    }

    const synth = window.speechSynthesis;
    const profile = jarvisVoiceSettings.voiceProfile || "male";
    const volume = clampJarvisVolume(jarvisVoiceSettings.volume ?? defaultJarvisSettings.volume);

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    utterance.volume = Math.min(1, Math.max(0, volume));

    if (profile === "female") {
        utterance.rate = 0.98;
        utterance.pitch = 1.18;
    } else if (profile === "neutral") {
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
    } else {
        utterance.rate = 0.8;
        utterance.pitch = 0.72;
    }

    const preferredVoice = getPreferredJarvisVoice(profile);

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    synth.speak(utterance);
}

function stopVoiceRecognition() {

    continuousVoiceMode = false;

    if (voiceRecognition) {
        try {
            voiceRecognition.stop();
        } catch (error) {
            console.warn("Impossible d'arrêter la reconnaissance vocale :", error);
        }
    }

    isVoiceListening = false;
    updateVoiceUi();
}

function startVoiceRecognition() {

    const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
        addMessage(
            "JARVIS",
            "La reconnaissance vocale n'est pas prise en charge dans ce navigateur. 🎙️",
            "jarvis"
        );
        return;
    }

    if (isVoiceListening || continuousVoiceMode) {
        stopVoiceRecognition();
        return;
    }

    try {
        continuousVoiceMode = true;
        voiceRecognition = new SpeechRecognitionClass();
        voiceRecognition.lang = "fr-FR";
        voiceRecognition.continuous = true;
        voiceRecognition.interimResults = true;

        voiceRecognition.onstart = () => {
            isVoiceListening = true;
            updateVoiceUi();
        };

        voiceRecognition.onresult = (event) => {
            const finalResult = event.results[event.results.length - 1];

            if (!finalResult || !finalResult.isFinal) {
                return;
            }

            const transcript = finalResult[0]?.transcript?.trim() || "";

            if (!transcript) {
                return;
            }

            const normalized = normalizeCommandText(transcript);

            if (!normalized) {
                return;
            }

            if (normalized === lastProcessedVoiceText) {
                return;
            }

            lastProcessedVoiceText = normalized;

            const stopModePatterns = [
                /^merci\s+jarvis$/,
                /^jarvis\s+merci$/,
                /^merci\s+jarvis\s*[,;.!]?$/,
                /^jarvis\s+merci\s*[,;.!]?$/
            ];

            if (stopModePatterns.some(pattern => pattern.test(normalized))) {
                addMessage("JARVIS", "Mode continu arrêté. 🎙️", "jarvis");
                speakJarvisReply("Mode continu arrêté.");
                lastProcessedVoiceText = "";
                stopVoiceRecognition();
                return;
            }

            if (/(jarvis.*mode manuel|mode manuel.*jarvis|jarvis.*manuel)/.test(normalized)) {
                addMessage("JARVIS", "Mode manuel activé. 🎙️", "jarvis");
                speakJarvisReply("Mode manuel activé.");
                lastProcessedVoiceText = "";
                stopVoiceRecognition();
                return;
            }

            if (/^merci$/i.test(normalized) || /^merci\s*[,;.!]?$/i.test(normalized)) {
                lastProcessedVoiceText = "";
                return;
            }

            if (/\bjarvis\b/.test(normalized)) {
                let command = normalized
                    .replace(/^.*?\bjarvis\b\s*[, ]?/, "")
                    .trim();

                command = command
                    .replace(/\s*(merci\s+jarvis|jarvis\s+merci|merci)\s*$/gi, "")
                    .replace(/\s*(merci\s+jarvis|jarvis\s+merci|merci)\s+/gi, " ")
                    .replace(/^\s*[, ]+/, "")
                    .replace(/\s+/g, " ")
                    .trim();

                if (!command || command === "jarvis" || /^merci$/.test(command)) {
                    return;
                }

                if (jarvisInput) {
                    jarvisInput.value = command;
                    jarvisInput.focus();
                }

                lastVoiceCommand = command;
                lastProcessedVoiceText = normalized;

                window.setTimeout(() => {
                    if (jarvisInput && jarvisInput.value.trim()) {
                        sendCommand();
                    }
                }, 250);

                return;
            }

            if (!continuousVoiceMode) {
                if (jarvisInput) {
                    jarvisInput.value = transcript;
                    jarvisInput.focus();
                }

                stopVoiceRecognition();

                window.setTimeout(() => {
                    if (jarvisInput && jarvisInput.value.trim()) {
                        sendCommand();
                    }
                }, 250);
            }
        };

        voiceRecognition.onerror = (event) => {
            console.warn("Erreur reconnaissance vocale :", event.error);

            if (event.error === "no-speech") {
                return;
            }

            const errorMessage =
                event.error === "not-allowed"
                    ? "Autorise le micro pour parler avec Jarvis. 🎙️"
                    : "Je n'ai pas bien entendu. Réessaie. 🎙️";

            addMessage("JARVIS", errorMessage, "jarvis");
            stopVoiceRecognition();
        };

        voiceRecognition.onend = () => {
            isVoiceListening = false;

            if (continuousVoiceMode && voiceRecognition) {
                try {
                    voiceRecognition.start();
                    isVoiceListening = true;
                } catch (error) {
                    console.warn("Restart continu impossible :", error);
                }
            }

            updateVoiceUi();
            if (!continuousVoiceMode) {
                voiceRecognition = null;
            }
        };

        voiceRecognition.start();

    } catch (error) {
        console.error("Impossible de lancer la reconnaissance vocale :", error);
        addMessage("JARVIS", "Le micro est indisponible pour le moment. 🎙️", "jarvis");
        stopVoiceRecognition();
    }
}

loadJarvisSettings();
renderJarvisSettingsUi();

if (jarvisVolumeControl) {
    jarvisVolumeControl.addEventListener("input", updateJarvisVoiceSettings);
}

if (jarvisVoicePreset) {
    jarvisVoicePreset.addEventListener("change", updateJarvisVoiceSettings);
}

updateVoiceUi();


/* ==========================================
   MÉMOIRE JARVIS
========================================== */

let jarvisHistory = [];

const JARVIS_HISTORY_KEY =
    "jarvis_history";


function loadJarvisHistory() {

    try {

        const saved =
            localStorage.getItem(
                JARVIS_HISTORY_KEY
            );

        if (!saved) {
            return;
        }


        const parsed =
            JSON.parse(saved);


        if (!Array.isArray(parsed)) {
            return;
        }


        jarvisHistory =
            parsed
                .filter(message =>
                    message &&
                    (
                        message.role === "user" ||
                        message.role === "model" ||
                        message.role === "assistant"
                    ) &&
                    typeof message.text === "string"
                )
                .map(message => ({

                    role:
                        message.role === "assistant"
                            ? "model"
                            : message.role,

                    text:
                        message.text

                }))
                .slice(-10);

    } catch (error) {

        console.error(
            "Impossible de charger la mémoire JARVIS :",
            error
        );

        jarvisHistory = [];
    }
}


function saveJarvisHistory() {

    try {

        localStorage.setItem(
            JARVIS_HISTORY_KEY,
            JSON.stringify(
                jarvisHistory.slice(-10)
            )
        );

    } catch (error) {

        console.error(
            "Impossible de sauvegarder la mémoire JARVIS :",
            error
        );
    }
}


function addToJarvisHistory(role, text) {

    jarvisHistory.push({

        role: role,
        text: text

    });


    jarvisHistory =
        jarvisHistory.slice(-10);


    saveJarvisHistory();
}


/* ==========================================
   AFFICHAGE DES MESSAGES
========================================== */

function addMessage(sender, text, type) {

    if (!jarvisChat) {
        return null;
    }


    const message =
        document.createElement("div");


    message.classList.add("message");


    if (type === "user") {

        message.classList.add(
            "user-message"
        );

    } else {

        message.classList.add(
            "jarvis-message"
        );
    }


    const strong =
        document.createElement("strong");


    strong.textContent =
        sender;


    const paragraph =
        document.createElement("p");


    /*
       Le texte de JARVIS est inséré
       comme du texte normal.

       Cela évite qu'une réponse Gemini
       puisse injecter du HTML ou du JavaScript.
    */

    paragraph.textContent =
        String(text);


    message.appendChild(strong);

    message.appendChild(paragraph);

    jarvisChat.appendChild(message);


    // Descendre automatiquement vers le dernier message
    jarvisChat.scrollTop =
        jarvisChat.scrollHeight;


    return message;
}


/* ==========================================
   NAVIGATION MYHUB
========================================== */

const sections = {

    home:
        "homeSection",

    jarvis:
        "jarvisSection",

    mydlp:
        "mydlpSection",

    ludotheque:
        "ludothequeSection",

    music:
        "musicSection",

    settings:
        "settingsSection"
};


function showSection(sectionId) {

    const allSections =
        document.querySelectorAll(
            ".page-section"
        );


    allSections.forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });


    const targetSection =
        document.getElementById(
            sectionId
        );


    if (targetSection) {

        targetSection.classList.add(
            "active-section"
        );
    }


    /*
       Mettre également le bon bouton
       de la sidebar en actif.
    */

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(item => {

        item.classList.remove("active");


        const spans =
            item.querySelectorAll("span");


        if (spans.length >= 2) {

            const pageName =
                spans[1]
                    .textContent
                    .trim();


            const mappedSection =
                getSectionFromName(
                    pageName
                );


            if (
                mappedSection === sectionId
            ) {

                item.classList.add("active");
            }
        }

    });
}


function getSectionFromName(pageName) {

    const mapping = {

        "Accueil":
            "homeSection",

        "JARVIS":
            "jarvisSection",

        "MyDLP":
            "mydlpSection",

        "Ludothèque":
            "ludothequeSection",

        "Musique":
            "musicSection",

        "Paramètres":
            "settingsSection"
    };


    return mapping[pageName] || null;
}


/* ==========================================
   EXÉCUTION DES ACTIONS JARVIS
========================================== */

async function executeJarvisAction(result) {

    if (!result) {

        return (
            "Je n'ai pas reçu de réponse exploitable. 🤖"
        );
    }


    const action =
        result.action || "none";


    /* ======================================
       AUCUNE ACTION
    ====================================== */

    if (action === "none") {

        return (
            result.reply ||
            "D'accord. 🤖"
        );
    }


    /* ======================================
       OUVRIR UN SITE
    ====================================== */

    if (action === "open_website") {

        const websites = {

            youtube:
                "https://www.youtube.com/",

            mydlp:
                "https://quentwax.github.io/My-DLP/index.html",

            ludotheque:
                "https://quentwax.github.io/jeux_societe/",

            github:
                "https://github.com/quentwax",

            portfolio:
                "https://jcphotographie276.github.io/portfolio/",

            discord: {
                app: "discord://",
                web: "https://discord.com/app"
            },

            whatsapp: {
                app: "whatsapp://",
                web: "https://web.whatsapp.com/"
            }
        };


        /*
           IMPORTANT :

           Le nouveau Worker utilise :

           result.target

           et non plus :

           result.site
        */

        const target =
            String(result.target || "")
                .toLowerCase()
                .trim();


        if (!websites[target]) {

            return (
                "Je ne connais pas ce site. 🤔"
            );
        }


        const targetUrl =
            websites[target];

        const finalUrl =
            typeof targetUrl === "string"
                ? targetUrl
                : targetUrl.web;


        if (typeof targetUrl !== "string") {

            try {

                window.location.href =
                    targetUrl.app;

            } catch (error) {

                console.warn(
                    "Impossible d'ouvrir l'application locale, fallback web :",
                    error
                );
            }


            setTimeout(() => {

                window.open(
                    finalUrl,
                    "_blank"
                );

            }, 500);

        } else {

            window.open(
                finalUrl,
                "_blank"
            );
        }


        return (
            result.reply ||
            "J'ouvre ça. 🚀"
        );
    }


    /* ======================================
       RECHERCHE YOUTUBE
    ====================================== */

    if (action === "youtube_search") {

        const query =
            String(result.query || "")
                .trim();


        if (!query) {

            window.open(
                "https://www.youtube.com/",
                "_blank"
            );


            return (
                "J'ouvre YouTube. ▶️"
            );
        }


        const url =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);


        window.open(
            url,
            "_blank"
        );


        return (
            result.reply ||
            `Je lance une recherche YouTube pour « ${query} ». ▶️`
        );
    }


    /* ======================================
       HEURE
    ====================================== */

    if (action === "get_time") {

        const now =
            new Date();


        return (
            result.reply ||
            `Il est actuellement ${now.toLocaleTimeString(
                "fr-FR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )}. ⏰`
        );
    }


    /* ======================================
       DATE
    ====================================== */

    if (action === "get_date") {

        const now =
            new Date();


        const date =
            now.toLocaleDateString(
                "fr-FR",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );


        return (
            result.reply ||
            `Nous sommes le ${date}. 📅`
        );
    }


    /* ======================================
       MINUTEUR
    ====================================== */

    if (action === "set_timer") {

        const seconds =
            Number(result.seconds || 0);

        if (!Number.isFinite(seconds) || seconds <= 0) {
            return "Je n'ai pas pu démarrer le minuteur. ⏱️";
        }

        const started =
            startTimerFromSeconds(seconds);

        if (!started) {
            return "Je n'ai pas pu démarrer le minuteur. ⏱️";
        }

        return (
            result.reply ||
            `Minuteur lancé pour ${formatTimerRemaining(seconds * 1000)}. ⏱️`
        );
    }


    if (action === "clear_timer") {

        clearTimer();

        return (
            result.reply ||
            "J'ai retiré le minuteur. ⏱️"
        );
    }


    /* ======================================
       MÉTÉO
    ====================================== */

    if (action === "get_weather") {

        return (
            result.reply ||
            "Je n'ai pas réussi à récupérer la météo. ⚠️"
        );
    }


    /* ======================================
       NAVIGATION DANS MYHUB
    ====================================== */

    if (action === "navigate_section") {

        const section =
            String(result.section || "")
                .toLowerCase()
                .trim();


        if (!sections[section]) {

            return (
                "Je ne connais pas cette section. 🤔"
            );
        }


        showSection(
            sections[section]
        );


        /*
           Fermer le menu mobile si nécessaire.
        */

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        if (sidebar) {

            sidebar.classList.remove(
                "open"
            );
        }


        return (
            result.reply ||
            "J'ouvre cette section. 🚀"
        );
    }


    /* ======================================
       SPOTIFY
    ====================================== */

    if (action === "spotify_control") {

        const command =
            String(result.command || "")
                .toLowerCase()
                .trim();


        if (command === "open") {

            showSection(
                "musicSection"
            );


            const sidebar =
                document.querySelector(
                    ".sidebar"
                );


            if (sidebar) {

                sidebar.classList.remove(
                    "open"
                );
            }


            return (
                result.reply ||
                "J'ouvre le lecteur Spotify. 🎵"
            );
        }


        if (!spotifyPlayer) {

            return (
                "Spotify n'est pas encore connecté à MyHub. 🎵"
            );
        }


        try {

            if (command === "play_pause") {

                await spotifyPlayer.togglePlay();

                return (
                    result.reply ||
                    "Je contrôle la lecture. 🎵"
                );
            }


            if (command === "next") {

                await spotifyPlayer.nextTrack();

                return (
                    result.reply ||
                    "Je passe à la chanson suivante. ⏭️"
                );
            }


            if (command === "previous") {

                await spotifyPlayer.previousTrack();

                return (
                    result.reply ||
                    "Je reviens à la chanson précédente. ⏮️"
                );
            }


            return (
                "Je ne connais pas cette commande Spotify. 🤔"
            );

        } catch (error) {

            console.error(
                "Erreur commande Spotify JARVIS :",
                error
            );


            return (
                "Je n'ai pas réussi à contrôler Spotify. ⚠️"
            );
        }
    }


    /* ======================================
       ACTIONS MYDLP
    ====================================== */

    if (action === "mydlp_action") {

        const command =
            String(result.command || "")
                .toLowerCase()
                .trim();


        /*
           Pour l'instant, les données MyDLP
           ne sont pas directement intégrées
           dans MyHub.

           On ouvre donc MyDLP et on prépare
           les commandes pour la prochaine étape.
        */

        if (command === "home") {

            window.open(
                "https://quentwax.github.io/My-DLP/index.html",
                "_blank"
            );


            return (
                result.reply ||
                "J'ouvre MyDLP. 🎢"
            );
        }


        if (
            [
                "next_stay",
                "planning",
                "collections",
                "checklist",
                "map",
                "badges"
            ].includes(command)
        ) {

            window.open(
                "https://quentwax.github.io/My-DLP/index.html",
                "_blank"
            );


            return (
                result.reply ||
                "J'ouvre MyDLP. 🎢"
            );
        }


        return (
            "Je ne connais pas encore cette commande MyDLP. 🤔"
        );
    }


    /* ======================================
       ACTIONS LUDOTHÈQUE
    ====================================== */

    if (action === "ludotheque_action") {

        const command =
            String(result.command || "")
                .toLowerCase()
                .trim();


        if (command === "open") {

            showSection(
                "ludothequeSection"
            );


            const sidebar =
                document.querySelector(
                    ".sidebar"
                );


            if (sidebar) {

                sidebar.classList.remove(
                    "open"
                );
            }


            return (
                result.reply ||
                "J'ouvre ta ludothèque. 🎲"
            );
        }


        if (command === "random_game") {

            showSection(
                "ludothequeSection"
            );


            /*
               Si ton bouton de jeu aléatoire
               existe déjà dans MyHub, on essaie
               de le déclencher automatiquement.

               Plusieurs IDs sont acceptés pour
               rester compatible avec différentes
               versions de ton HTML.
            */

            const randomButton =
                document.getElementById(
                    "randomGameButton"
                ) ||
                document.getElementById(
                    "randomGameBtn"
                ) ||
                document.getElementById(
                    "randomGame"
                );


            if (randomButton) {

                randomButton.click();
            }


            return (
                result.reply ||
                "Je vais te trouver un jeu au hasard. 🎲"
            );
        }


        if (command === "favorites") {

            showSection(
                "ludothequeSection"
            );


            /*
               On cherche plusieurs IDs possibles
               pour le bouton favoris.
            */

            const favoritesButton =
                document.getElementById(
                    "favoritesButton"
                ) ||
                document.getElementById(
                    "favoritesBtn"
                ) ||
                document.getElementById(
                    "favoritesOnly"
                );


            if (favoritesButton) {

                favoritesButton.click();
            }


            return (
                result.reply ||
                "J'ouvre tes jeux favoris. ❤️"
            );
        }


        return (
            "Je ne connais pas encore cette commande de ludothèque. 🤔"
        );
    }


    /* ======================================
       ACTION INCONNUE
    ====================================== */

    return (
        result.reply ||
        "Je ne sais pas encore exécuter cette action. 🤔"
    );
}


/* ==========================================
   ACTIONS RAPIDES LOCALES
========================================== */

function normalizeCommandText(command) {

    return String(command || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[-_]/g, " ")
        .replace(/[?!.,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


function getWeatherReply() {

    const temperatureElement = document.getElementById("weatherTemperature");
    const descriptionElement = document.getElementById("weatherDescription");

    const temperature = temperatureElement ? temperatureElement.textContent.trim() : "--°";
    const description = descriptionElement ? descriptionElement.textContent.trim() : "météo indisponible";

    if (temperature && temperature !== "--°") {
        return `Il fait ${temperature} à Elbeuf, ${description.toLowerCase()}.`;
    }

    return "Je ne peux pas vérifier la météo pour le moment. ⚠️";
}

function getLocalFallbackReply(command) {

    const normalized = normalizeCommandText(command);

    if (!normalized) {
        return null;
    }

    if (/(bonjour|salut|bonsoir|hey|coucou)/.test(normalized)) {
        return "Bonjour ! Je suis Jarvis, prêt à t'aider.";
    }

    if (/(qui es tu|qui tu es|presente toi|présente toi|qui est jarvis)/.test(normalized)) {
        return "Je suis Jarvis, ton assistant personnel, conçu pour t'aider sur MyHub.";
    }

    if (/(merci|thanks|thank you)/.test(normalized)) {
        return "Avec plaisir. 😊";
    }

    if (/(quelle heure|heure qu'il est|il est quelle heure|donne l'heure|heure actuelle)/.test(normalized)) {
        const now = new Date();
        return `Il est actuellement ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. ⏰`;
    }

    if (/(quelle date|date d'aujourd'hui|date du jour|on est quel jour|donne la date)/.test(normalized)) {
        const now = new Date();
        const date = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        return `Nous sommes le ${date}. 📅`;
    }

    if (/(meteo|météo|temps|temperature|pluie|soleil|nuage|orage)/.test(normalized)) {
        return getWeatherReply();
    }

    return null;
}

function getLocalQuickAction(command) {

    const normalized =
        normalizeCommandText(command);

    if (!normalized) {
        return null;
    }

    const websiteAliases = {

        youtube: {
            target: "youtube",
            reply: "J'ouvre YouTube. ▶️"
        },

        mydlp: {
            target: "mydlp",
            reply: "J'ouvre MyDLP. 🎢"
        },

        ludotheque: {
            target: "ludotheque",
            reply: "J'ouvre ta ludothèque. 🎲"
        },

        github: {
            target: "github",
            reply: "J'ouvre GitHub. 🧠"
        },

        portfolio: {
            target: "portfolio",
            reply: "J'ouvre ton portfolio. 🖼️"
        },

        discord: {
            target: "discord",
            reply: "J'ouvre Discord. 💬"
        },

        whatsapp: {
            target: "whatsapp",
            reply: "J'ouvre WhatsApp. 💬"
        }
    };

    for (const [siteName, siteData] of Object.entries(websiteAliases)) {

        const directPatterns = [
            siteName,
            `ouvre ${siteName}`,
            `ouvrir ${siteName}`,
            `va sur ${siteName}`,
            `vas sur ${siteName}`,
            `aller sur ${siteName}`,
            `lance ${siteName}`,
            `go ${siteName}`,
            `peux tu ouvrir ${siteName}`,
            `peut tu ouvrir ${siteName}`,
            `tu peux ouvrir ${siteName}`,
            `peux tu ${siteName}`,
            `peut tu ${siteName}`,
            `tu peux ${siteName}`,
            `ouvre le site ${siteName}`,
            `ouvrir le site ${siteName}`,
            `va sur le site ${siteName}`,
            `vas sur le site ${siteName}`
        ];

        if (directPatterns.includes(normalized)) {
            return {
                action: "open_website",
                target: siteData.target,
                reply: siteData.reply
            };
        }

        const genericOpenPattern =
            /(?:ouvre|ouvrir|va sur|vas sur|aller sur|lance|go|peux tu ouvrir|peut tu ouvrir|tu peux ouvrir|peux tu|peut tu|tu peux)/
            .test(normalized) &&
            normalized.includes(siteName);

        if (genericOpenPattern) {
            return {
                action: "open_website",
                target: siteData.target,
                reply: siteData.reply
            };
        }
    }

    const sectionAliases = {
        accueil: "home",
        home: "home",
        jarvis: "jarvis",
        mydlp: "mydlp",
        ludotheque: "ludotheque",
        musique: "music",
        music: "music",
        parametres: "settings",
        settings: "settings"
    };

    const sectionMatch = Object.entries(sectionAliases).find(([keyword]) =>
        normalized === keyword ||
        normalized.includes(keyword)
    );

    if (
        sectionMatch &&
        /(ouvre|ouvrir|va sur|vas sur|aller sur|affiche|montre|show)/.test(normalized)
    ) {
        return {
            action: "navigate_section",
            section: sectionMatch[1],
            reply: "J'ouvre cette section. 🚀"
        };
    }

    if (
        /(quelle heure|heure qu'il est|il est quelle heure|donne l'heure|heure actuelle)/.test(normalized)
    ) {
        return {
            action: "get_time"
        };
    }

    if (
        /(quelle date|date d'aujourd'hui|date du jour|on est quel jour|donne la date)/.test(normalized)
    ) {
        return {
            action: "get_date"
        };
    }

    const clearTimerMatch =
        /(retire|retirer|supprime|supprimer|annule|annuler|arrete|arreter|efface|effacer|stop)\s+(?:le\s+)?(?:minuteur|timer|chrono)/.test(normalized);

    if (clearTimerMatch) {
        return {
            action: "clear_timer",
            reply: "J'ai retiré le minuteur. ⏱️"
        };
    }

    const modifyTimerMatch =
        normalized.match(/(?:modifie|modifier|change|changer|mets|remets|definit|définit|set)\s+(?:le\s+)?(?:minuteur|timer|chrono)\s*(?:a|à|de|pour)?\s*(\d+(?:[.,]\d+)?)\s*(minute|min|minutes|m|seconde|secondes|s|heure|heures|h)?/);

    if (modifyTimerMatch) {
        const value =
            Number((modifyTimerMatch[1] || "0").replace(",", "."));

        const unit =
            (modifyTimerMatch[2] || "minute").toLowerCase();

        let seconds = value;

        if (["heure", "heures", "h"].includes(unit)) {
            seconds = value * 3600;
        } else if (["minute", "minutes", "min", "m"].includes(unit)) {
            seconds = value * 60;
        }

        if (Number.isFinite(seconds) && seconds > 0) {
            return {
                action: "set_timer",
                seconds,
                reply: `J'ai mis le minuteur à ${formatTimerRemaining(seconds * 1000)}. ⏱️`
            };
        }
    }

    const timerSeconds = parseTimerCommand(normalized);

    if (timerSeconds !== null) {
        return {
            action: "set_timer",
            seconds: timerSeconds
        };
    }

    return null;
}


/* ==========================================
   COMMUNICATION AVEC LE WORKER GEMINI
========================================== */

let geminiCooldownUntil = 0;

function getGeminiRetryDelayMs(rawText) {
    if (!rawText) {
        return 0;
    }

    try {
        const parsed = JSON.parse(rawText);
        const details = parsed?.details;

        if (typeof details === "string") {
            const match = details.match(/retryDelay\":\s*\"([0-9.]+)s\"/i);

            if (match) {
                return Math.ceil(Number(match[1]) * 1000);
            }
        }

        if (parsed?.error?.details && Array.isArray(parsed.error.details)) {
            const retryInfo = parsed.error.details.find(item =>
                item?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
            );

            if (retryInfo?.retryDelay) {
                const match = String(retryInfo.retryDelay).match(/([0-9.]+)s/i);

                if (match) {
                    return Math.ceil(Number(match[1]) * 1000);
                }
            }
        }
    } catch {
        // Le texte n'était pas du JSON valide.
    }

    return 0;
}

async function processCommand(command) {
    if (Date.now() < geminiCooldownUntil) {
        const fallback = getLocalFallbackReply(command) || "Le service de Jarvis est temporairement indisponible. Réessaie dans quelques secondes. 🤖";

        return {
            action: "none",
            reply: fallback
        };
    }

    try {

        /*
           IMPORTANT :

           jarvisHistory contient uniquement
           les messages PRÉCÉDENTS.

           Le message actuel est envoyé
           séparément dans "message".

           Cela évite de l'envoyer deux fois
           à Gemini.
        */

        const historyToSend =
            jarvisHistory
                .slice(-10)
                .map(message => ({

                    role:
                        message.role === "assistant"
                            ? "model"
                            : message.role,

                    text:
                        message.text

                }));


        const response =
            await fetch(
                JARVIS_API_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                command,

                            history:
                                historyToSend

                        })
                }
            );


        /* ======================================
           ERREUR WORKER
        ====================================== */

        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "========== JARVIS ERREUR =========="
            );

            console.error(
                "Status :",
                response.status
            );

            console.error(
                "Réponse Worker :",
                errorText
            );

            console.error(
                "===================================="
            );


            let errorMessage =
                `Mon cerveau répond avec une erreur (${response.status}). ⚠️`;

            const retryDelayMs = getGeminiRetryDelayMs(errorText);

            if (retryDelayMs > 0) {
                geminiCooldownUntil = Date.now() + retryDelayMs;
            } else if (response.status === 429 || response.status === 503) {
                geminiCooldownUntil = Date.now() + 30000;
            }


            /*
               Essayer d'afficher le détail du Worker
               lorsque celui-ci renvoie du JSON.
            */

            try {

                const errorData =
                    JSON.parse(errorText);


                if (errorData.details) {

                    console.error(
                        "Détail Gemini :",
                        errorData.details
                    );
                }

            } catch {

                // La réponse n'était pas du JSON.
            }

            const fallbackReply = getLocalFallbackReply(command) || errorMessage;

            return {

                action:
                    "none",

                reply:
                    fallbackReply
            };
        }


        /* ======================================
           LECTURE JSON
        ====================================== */

        const result =
            await response.json();


        console.log(
            "Réponse JARVIS :",
            result
        );


        return result;


    } catch (error) {

        console.error(
            "Erreur communication JARVIS :",
            error
        );


        return {

            action:
                "none",

            reply:
                "Une erreur est survenue pendant la communication avec mon serveur. ⚠️"
        };
    }
}


/* ==========================================
   ENVOI D'UNE COMMANDE
========================================== */

async function sendCommand() {

    if (!jarvisInput) {
        return;
    }


    const command =
        jarvisInput.value.trim();


    if (command === "") {
        return;
    }


    /* ======================================
       AFFICHER LE MESSAGE UTILISATEUR
    ====================================== */

    addMessage(
        "Vous",
        command,
        "user"
    );


    /*
       IMPORTANT :

       On vide le champ et on désactive
       le bouton avant l'appel réseau.
    */

    jarvisInput.value = "";


    if (jarvisSend) {

        jarvisSend.disabled = true;
    }


    const localFallbackReply = getLocalFallbackReply(command);

    if (localFallbackReply) {

        addMessage(
            "JARVIS",
            localFallbackReply,
            "jarvis"
        );

        speakJarvisReply(localFallbackReply);

        addToJarvisHistory(
            "user",
            command
        );

        addToJarvisHistory(
            "model",
            localFallbackReply
        );

        if (jarvisSend) {
            jarvisSend.disabled = false;
        }

        if (jarvisInput) {
            jarvisInput.focus();
        }

        return;
    }


    const localQuickAction =
        getLocalQuickAction(command);


    if (localQuickAction) {

        const reply =
            await executeJarvisAction(
                localQuickAction
            );


        addMessage(
            "JARVIS",
            reply,
            "jarvis"
        );

        speakJarvisReply(reply);


        addToJarvisHistory(
            "user",
            command
        );


        addToJarvisHistory(
            "model",
            reply
        );


        if (jarvisSend) {
            jarvisSend.disabled = false;
        }


        if (jarvisInput) {
            jarvisInput.focus();
        }


        return;
    }


    /* ======================================
       MESSAGE TEMPORAIRE
    ====================================== */

    const thinkingMessage =
        addMessage(
            "JARVIS",
            "Je réfléchis... 🤖",
            "jarvis"
        );


    try {

        if (Date.now() < geminiCooldownUntil) {
            const localReply = getLocalFallbackReply(command) || "Le service de Jarvis est temporairement indisponible. Réessaie dans quelques secondes. 🤖";

            addMessage(
                "JARVIS",
                localReply,
                "jarvis"
            );

            speakJarvisReply(localReply);

            addToJarvisHistory("user", command);
            addToJarvisHistory("model", localReply);

            if (thinkingMessage) {
                thinkingMessage.remove();
            }

            if (jarvisSend) {
                jarvisSend.disabled = false;
            }

            if (jarvisInput) {
                jarvisInput.focus();
            }

            return;
        }

        /* ==================================
           ENVOYER LA COMMANDE
        ================================== */

        let result =
            await processCommand(
                command
            );


        /* ==================================
           SUPPRIMER "JE RÉFLÉCHIS..."
        ================================== */

        if (thinkingMessage) {

            thinkingMessage.remove();
        }


        const localFallbackReply = getLocalFallbackReply(command);

        if (
            result &&
            result.action === "none" &&
            typeof result.reply === "string" &&
            /erreur|error|quota|indisponible|impossible/i.test(result.reply) &&
            localFallbackReply
        ) {
            result = {
                action: "none",
                reply: localFallbackReply
            };
        }


        /* ==================================
           EXÉCUTER L'ACTION
        ================================== */

        const reply =
            await executeJarvisAction(
                result
            );


        /* ==================================
           AFFICHER LA RÉPONSE
        ================================== */

        addMessage(
            "JARVIS",
            reply,
            "jarvis"
        );

        speakJarvisReply(reply);


        /* ==================================
           MÉMOIRE

           On ajoute les deux messages
           APRÈS l'appel au Worker.

           Ainsi Gemini reçoit uniquement
           les messages précédents.
        ================================== */

        addToJarvisHistory(
            "user",
            command
        );


        addToJarvisHistory(
            "model",
            reply
        );


    } catch (error) {

        console.error(
            "Erreur pendant l'exécution de JARVIS :",
            error
        );


        if (thinkingMessage) {

            thinkingMessage.remove();
        }


        const errorReply =
            "Désolé, quelque chose s'est mal passé. ⚠️";


        addMessage(
            "JARVIS",
            errorReply,
            "jarvis"
        );

        speakJarvisReply(errorReply);


        addToJarvisHistory(
            "user",
            command
        );


        addToJarvisHistory(
            "model",
            errorReply
        );


    } finally {

        if (jarvisSend) {

            jarvisSend.disabled = false;
        }


        if (jarvisInput) {

            jarvisInput.focus();
        }
    }
}


/* ==========================================
   BOUTON ENVOYER
========================================== */

if (jarvisSend) {

    jarvisSend.addEventListener(
        "click",
        sendCommand
    );
}

if (voiceToggleButton) {
    voiceToggleButton.addEventListener(
        "click",
        startVoiceRecognition
    );
}


/* ==========================================
   TOUCHE ENTRÉE
========================================== */

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
   NAVIGATION SIDEBAR
========================================== */

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


const sidebar =
    document.querySelector(
        ".sidebar"
    );


navItems.forEach(item => {

    item.addEventListener(
        "click",
        () => {

            /* ==============================
               ACTIVE
            ============================== */

            navItems.forEach(nav => {

                nav.classList.remove(
                    "active"
                );
            });


            item.classList.add(
                "active"
            );


            /* ==============================
               RÉCUPÉRER LE NOM
            ============================== */

            const spans =
                item.querySelectorAll(
                    "span"
                );


            if (spans.length < 2) {
                return;
            }


            const pageName =
                spans[1]
                    .textContent
                    .trim();


            const sectionId =
                getSectionFromName(
                    pageName
                );


            if (sectionId) {

                showSection(
                    sectionId
                );
            }


            /* ==============================
               MENU MOBILE
            ============================== */

            if (sidebar) {

                sidebar.classList.remove(
                    "open"
                );
            }
        }
    );
});


/* ==========================================
   MENU MOBILE
========================================== */

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );


if (mobileMenu && sidebar) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );
        }
    );
}


/* ==========================================
   SPOTIFY
========================================== */

window.initSpotifyPlayer = function initSpotifyPlayer() {
    if (!spotifyAccessToken) {
        return;
    }

    if (typeof Spotify === "undefined") {
        console.warn("Spotify SDK pas encore prêt, tentative retardée.");
        return;
    }

    if (spotifyPlayer) {
        return;
    }

    initializeSpotifyPlayer(spotifyAccessToken);
};

const SPOTIFY_CLIENT_ID =
    "f921c0f743e04c6eafd0ebb1b2e79227";


const SPOTIFY_REDIRECT_URI =
    "https://quentwax.github.io/MyHub/";


const SPOTIFY_SCOPES = [

    "streaming",

    "user-read-email",

    "user-read-private",

    "user-read-playback-state",

    "user-modify-playback-state"

].join(" ");


/* ==========================================
   VARIABLES SPOTIFY
========================================== */

let spotifyPlayer = null;

let spotifyDeviceId = null;

let spotifyAccessToken =
    localStorage.getItem(
        "spotify_access_token"
    );

let spotifyCurrentState = null;

const spotifyVolumeSlider = document.getElementById("spotifyVolumeSlider");
const spotifyVolumeValue = document.getElementById("spotifyVolumeValue");

function syncSpotifyVolumeUi(value) {
    if (!spotifyVolumeSlider || !spotifyVolumeValue) {
        return;
    }

    const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

    spotifyVolumeSlider.value = String(safeValue);
    spotifyVolumeValue.textContent = `${safeValue}%`;
}

function setSpotifyVolume(value) {
    const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
    syncSpotifyVolumeUi(safeValue);

    if (!spotifyPlayer || typeof spotifyPlayer.setVolume !== "function") {
        return;
    }

    spotifyPlayer.setVolume(safeValue / 100)
        .catch(error => {
            console.warn("Impossible de régler le volume Spotify :", error);
        });
}

if (spotifyVolumeSlider) {
    spotifyVolumeSlider.addEventListener("input", () => {
        setSpotifyVolume(spotifyVolumeSlider.value);
    });
}

syncSpotifyVolumeUi(50);

/* ==========================================
   GÉNÉRER UNE CHAÎNE ALÉATOIRE
========================================== */

function generateRandomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";


    let result = "";


    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );
    }


    return result;
}


/* ==========================================
   CRÉER LE CODE CHALLENGE PKCE
========================================== */

async function generateCodeChallenge(
    codeVerifier
) {

    const data =
        new TextEncoder().encode(
            codeVerifier
        );


    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );


    return btoa(
        String.fromCharCode(
            ...new Uint8Array(digest)
        )
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


/* ==========================================
   CONNEXION SPOTIFY
========================================== */

async function connectSpotify() {

    try {

        const codeVerifier =
            generateRandomString(128);


        localStorage.setItem(
            "spotify_code_verifier",
            codeVerifier
        );


        const codeChallenge =
            await generateCodeChallenge(
                codeVerifier
            );


        const params =
            new URLSearchParams({

                client_id:
                    SPOTIFY_CLIENT_ID,

                response_type:
                    "code",

                redirect_uri:
                    SPOTIFY_REDIRECT_URI,

                scope:
                    SPOTIFY_SCOPES,

                code_challenge_method:
                    "S256",

                code_challenge:
                    codeChallenge

            });


        window.location.href =
            "https://accounts.spotify.com/authorize?" +
            params.toString();


    } catch (error) {

        console.error(
            "Erreur connexion Spotify :",
            error
        );
    }
}


/* ==========================================
   CALLBACK SPOTIFY
========================================== */

async function handleSpotifyCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const code =
        params.get("code");


    const error =
        params.get("error");


    /* ======================================
       REFUS
    ====================================== */

    if (error) {

        console.error(
            "Connexion Spotify refusée :",
            error
        );

        return;
    }


    /* ======================================
       PAS DE CODE
    ====================================== */

    if (!code) {

        if (spotifyAccessToken) {

            if (typeof Spotify === "undefined") {
                console.warn("SDK Spotify non prêt au chargement du callback.");
                return;
            }

            initializeSpotifyPlayer(
                spotifyAccessToken
            );
        }

        return;
    }


    /* ======================================
       VERIFIER
    ====================================== */

    const codeVerifier =
        localStorage.getItem(
            "spotify_code_verifier"
        );


    if (!codeVerifier) {

        console.error(
            "Code verifier Spotify introuvable."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "https://accounts.spotify.com/api/token",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body:
                        new URLSearchParams({

                            client_id:
                                SPOTIFY_CLIENT_ID,

                            grant_type:
                                "authorization_code",

                            code:
                                code,

                            redirect_uri:
                                SPOTIFY_REDIRECT_URI,

                            code_verifier:
                                codeVerifier
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Erreur Spotify :",
                data
            );

            return;
        }


        /* ==================================
           SAUVEGARDER TOKEN
        ================================== */

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );


        spotifyAccessToken =
            data.access_token;


        if (data.refresh_token) {

            localStorage.setItem(
                "spotify_refresh_token",
                data.refresh_token
            );
        }


        localStorage.removeItem(
            "spotify_code_verifier"
        );


        /* ==================================
           NETTOYER URL
        ================================== */

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );


        console.log(
            "Connexion Spotify réussie !"
        );


        if (typeof Spotify === "undefined") {
            console.warn("SDK Spotify non prêt à l’init après OAuth. Attente du callback de chargement.");
            return;
        }

        initializeSpotifyPlayer(
            data.access_token
        );


    } catch (error) {

        console.error(
            "Impossible de contacter Spotify :",
            error
        );
    }
}


/* ==========================================
   INITIALISATION LECTEUR SPOTIFY
========================================== */

function initializeSpotifyPlayer(
    accessToken
) {

    spotifyAccessToken =
        accessToken;


    if (
        typeof Spotify ===
        "undefined"
    ) {

        console.error(
            "Le SDK Spotify n'est pas encore chargé."
        );

        return;
    }


    if (spotifyPlayer) {

        console.log(
            "Le lecteur Spotify existe déjà."
        );

        return;
    }


    spotifyPlayer =
        new Spotify.Player({

            name:
                "MyHub",

            getOAuthToken:
                callback => {

                    callback(
                        spotifyAccessToken
                    );
                },

            volume:
                0.5
        });


    /* ======================================
       READY
    ====================================== */

    spotifyPlayer.addListener(
        "ready",
        ({ device_id }) => {

            spotifyDeviceId =
                device_id;


            console.log(
                "MyHub Spotify prêt :",
                device_id
            );


            const login =
                document.getElementById(
                    "spotifyLogin"
                );


            const player =
                document.getElementById(
                    "spotifyPlayer"
                );


            const status =
                document.getElementById(
                    "spotifyStatus"
                );


            if (login) {

                login.style.display =
                    "none";
            }


            if (player) {

                player.style.display =
                    "block";
            }


            if (status) {

                status.textContent =
                    "Connecté";
            }


            transferPlaybackToMyHub();

            getSpotifyCurrentlyPlaying();
        }
    );


    /* ======================================
       NOT READY
    ====================================== */

    spotifyPlayer.addListener(
        "not_ready",
        ({ device_id }) => {

            console.log(
                "Spotify déconnecté :",
                device_id
            );
        }
    );


    /* ======================================
       INITIALIZATION ERROR
    ====================================== */

    spotifyPlayer.addListener(
        "initialization_error",
        ({ message }) => {

            console.error(
                "Erreur d'initialisation Spotify :",
                message
            );
        }
    );


    /* ======================================
       AUTHENTICATION ERROR
    ====================================== */

    spotifyPlayer.addListener(
        "authentication_error",
        ({ message }) => {

            console.error(
                "Erreur d'authentification Spotify :",
                message
            );
        }
    );


    /* ======================================
       ACCOUNT ERROR
    ====================================== */

    spotifyPlayer.addListener(
        "account_error",
        ({ message }) => {

            console.error(
                "Erreur de compte Spotify :",
                message
            );
        }
    );


    /* ======================================
       PLAYBACK ERROR
    ====================================== */

    spotifyPlayer.addListener(
        "playback_error",
        ({ message }) => {

            console.error(
                "Erreur de lecture Spotify :",
                message
            );
        }
    );


    /* ======================================
       AUTOPLAY
    ====================================== */

    spotifyPlayer.addListener(
        "autoplay_failed",
        () => {

            console.warn(
                "Spotify a bloqué l'autoplay."
            );
        }
    );


    /* ======================================
       CHANGEMENT DE MORCEAU
    ====================================== */

    spotifyPlayer.addListener(
        "player_state_changed",
        state => {

            if (!state) {
                return;
            }


            spotifyCurrentState =
                state;


            updateSpotifyTrack(
                state
            );


            updateSpotifyProgress(
                state
            );


            updateSpotifyPlayButton(
                state
            );
        }
    );


    /* ======================================
       CONNECTER PLAYER
    ====================================== */

    spotifyPlayer.connect()

        .then(success => {

            console.log(
                "Connexion du lecteur Spotify :",
                success
            );

        })

        .catch(error => {

            console.error(
                "Erreur connexion lecteur Spotify :",
                error
            );
        });
}


/* ==========================================
   TRANSFÉRER LA LECTURE À MYHUB
========================================== */

async function transferPlaybackToMyHub() {

    if (
        !spotifyAccessToken ||
        !spotifyDeviceId
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                "https://api.spotify.com/v1/me/player",
                {

                    method: "PUT",

                    headers: {

                        Authorization:
                            `Bearer ${spotifyAccessToken}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            device_ids:
                                [spotifyDeviceId],

                            play:
                                false

                        })
                }
            );


        if (!response.ok) {

            console.error(
                "Impossible de transférer Spotify vers MyHub."
            );

            return;
        }


        console.log(
            "Lecture Spotify transférée vers MyHub."
        );


    } catch (error) {

        console.error(
            "Erreur transfert Spotify :",
            error
        );
    }
}


/* ==========================================
   MORCEAU ACTUEL
========================================== */

async function getSpotifyCurrentlyPlaying() {

    if (!spotifyAccessToken) {
        return;
    }


    try {

        const response =
            await fetch(
                "https://api.spotify.com/v1/me/player",
                {

                    headers: {

                        Authorization:
                            `Bearer ${spotifyAccessToken}`
                    }
                }
            );


        if (response.status === 204) {

            console.log(
                "Aucun morceau en cours."
            );

            return;
        }


        if (!response.ok) {

            console.error(
                "Impossible de récupérer la lecture Spotify."
            );

            return;
        }


        const data =
            await response.json();


        if (
            !data ||
            !data.item
        ) {

            return;
        }


        updateSpotifyTrackFromAPI(
            data
        );


        updateSpotifyProgressFromAPI(
            data
        );


    } catch (error) {

        console.error(
            "Erreur récupération morceau Spotify :",
            error
        );
    }
}


/* ==========================================
   AFFICHAGE MORCEAU VIA API
========================================== */

function updateSpotifyTrackFromAPI(data) {

    const track =
        data.item;


    const trackName =
        document.getElementById(
            "spotifyTrackName"
        );


    const artist =
        document.getElementById(
            "spotifyArtist"
        );


    const cover =
        document.getElementById(
            "spotifyCover"
        );


    if (
        trackName &&
        track
    ) {

        trackName.textContent =
            track.name;
    }


    if (
        artist &&
        track &&
        track.artists
    ) {

        artist.textContent =
            track.artists
                .map(
                    artist => artist.name
                )
                .join(", ");
    }


    if (
        cover &&
        track &&
        track.album &&
        track.album.images &&
        track.album.images.length > 0
    ) {

        cover.innerHTML = "";


        const image =
            document.createElement(
                "img"
            );


        image.src =
            track.album.images[0].url;


        image.alt =
            track.name;


        image.style.width =
            "100%";


        image.style.height =
            "100%";


        image.style.objectFit =
            "cover";


        image.style.borderRadius =
            "10px";


        cover.appendChild(
            image
        );
    }
}


/* ==========================================
   AFFICHAGE MORCEAU VIA SDK
========================================== */

function updateSpotifyTrack(state) {

    if (
        !state ||
        !state.track_window
    ) {

        return;
    }


    const track =
        state.track_window.current_track;


    if (!track) {
        return;
    }


    const trackName =
        document.getElementById(
            "spotifyTrackName"
        );


    const artist =
        document.getElementById(
            "spotifyArtist"
        );


    const cover =
        document.getElementById(
            "spotifyCover"
        );


    if (trackName) {

        trackName.textContent =
            track.name;
    }


    if (artist) {

        artist.textContent =
            track.artists
                .map(
                    artist => artist.name
                )
                .join(", ");
    }


    if (
        cover &&
        track.album &&
        track.album.images &&
        track.album.images.length > 0
    ) {

        cover.innerHTML = "";


        const image =
            document.createElement(
                "img"
            );


        image.src =
            track.album.images[0].url;


        image.alt =
            track.name;


        image.style.width =
            "100%";


        image.style.height =
            "100%";


        image.style.objectFit =
            "cover";


        image.style.borderRadius =
            "10px";


        cover.appendChild(
            image
        );
    }
}


/* ==========================================
   BOUTON PLAY / PAUSE
========================================== */

function updateSpotifyPlayButton(
    state
) {

    const button =
        document.getElementById(
            "spotifyPlay"
        );


    if (!button) {
        return;
    }


    button.textContent =
        state.paused
            ? "▶"
            : "⏸";
}


/* ==========================================
   PROGRESSION SPOTIFY
========================================== */

function updateSpotifyProgress(
    state
) {

    if (!state) {
        return;
    }


    const progress =
        document.getElementById(
            "spotifyProgress"
        );


    const currentTime =
        document.getElementById(
            "spotifyCurrentTime"
        );


    const duration =
        document.getElementById(
            "spotifyDuration"
        );


    if (progress) {

        progress.max =
            state.duration;

        progress.value =
            state.position;
    }


    if (currentTime) {

        currentTime.textContent =
            formatSpotifyTime(
                state.position
            );
    }


    if (duration) {

        duration.textContent =
            formatSpotifyTime(
                state.duration
            );
    }
}


/* ==========================================
   PROGRESSION VIA API
========================================== */

function updateSpotifyProgressFromAPI(
    data
) {

    if (!data) {
        return;
    }


    const progress =
        document.getElementById(
            "spotifyProgress"
        );


    const currentTime =
        document.getElementById(
            "spotifyCurrentTime"
        );


    const duration =
        document.getElementById(
            "spotifyDuration"
        );


    if (progress) {

        progress.max =
            data.item?.duration_ms || 0;

        progress.value =
            data.progress_ms || 0;
    }


    if (currentTime) {

        currentTime.textContent =
            formatSpotifyTime(
                data.progress_ms || 0
            );
    }


    if (duration) {

        duration.textContent =
            formatSpotifyTime(
                data.item?.duration_ms || 0
            );
    }
}


/* ==========================================
   FORMAT TEMPS SPOTIFY
========================================== */

function formatSpotifyTime(
    milliseconds
) {

    const totalSeconds =
        Math.floor(
            milliseconds / 1000
        );


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (
        `${minutes}:${String(seconds).padStart(2, "0")}`
    );
}


/* ==========================================
   BOUTON PLAY / PAUSE SPOTIFY
========================================== */

const spotifyPlay =
    document.getElementById(
        "spotifyPlay"
    );


if (spotifyPlay) {

    spotifyPlay.addEventListener(
        "click",
        async () => {

            if (!spotifyPlayer) {

                console.warn(
                    "Spotify n'est pas connecté."
                );

                return;
            }


            try {

                await spotifyPlayer.togglePlay();

            } catch (error) {

                console.error(
                    "Erreur Play/Pause Spotify :",
                    error
                );
            }
        }
    );
}


/* ==========================================
   PISTE PRÉCÉDENTE
========================================== */

const spotifyPrevious =
    document.getElementById(
        "spotifyPrevious"
    );


if (spotifyPrevious) {

    spotifyPrevious.addEventListener(
        "click",
        async () => {

            if (!spotifyPlayer) {
                return;
            }


            try {

                await spotifyPlayer.previousTrack();

            } catch (error) {

                console.error(
                    "Erreur piste précédente Spotify :",
                    error
                );
            }
        }
    );
}


/* ==========================================
   PISTE SUIVANTE
========================================== */

const spotifyNext =
    document.getElementById(
        "spotifyNext"
    );


if (spotifyNext) {

    spotifyNext.addEventListener(
        "click",
        async () => {

            if (!spotifyPlayer) {
                return;
            }


            try {

                await spotifyPlayer.nextTrack();

            } catch (error) {

                console.error(
                    "Erreur piste suivante Spotify :",
                    error
                );
            }
        }
    );
}


/* ==========================================
   BARRE DE PROGRESSION
========================================== */

const spotifyProgress =
    document.getElementById(
        "spotifyProgress"
    );


if (spotifyProgress) {

    spotifyProgress.addEventListener(
        "input",
        async () => {

            if (!spotifyPlayer) {
                return;
            }


            try {

                await spotifyPlayer.seek(
                    Number(
                        spotifyProgress.value
                    )
                );

            } catch (error) {

                console.error(
                    "Erreur déplacement Spotify :",
                    error
                );
            }
        }
    );
}


/* ==========================================
   BOUTON CONNEXION SPOTIFY
========================================== */

const spotifyConnectButton =
    document.getElementById(
        "spotifyConnectButton"
    );


if (spotifyConnectButton) {

    spotifyConnectButton.addEventListener(
        "click",
        connectSpotify
    );
}


/* ==========================================
   CHARGEMENT MÉMOIRE JARVIS
========================================== */

loadJarvisHistory();


/* ==========================================
   CALLBACK SPOTIFY
========================================== */

handleSpotifyCallback();


/* ==========================================
   LOG
========================================== */

console.log(
    "🔥 SCRIPT MYHUB V3 CHARGÉ"
);