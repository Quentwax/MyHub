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
   COMPTE À REBOURS DISNEY
========================================== */

const DISNEY_TRIP_STORAGE_KEY = "myhub_disney_target_date";
const DEFAULT_DISNEY_TRIP_DATE = "2026-07-18";
const disneyTripDateInput = document.getElementById("disneyTripDateInput");
const saveDisneyTripDateButton = document.getElementById("saveDisneyTripDateButton");
const disneyGoogleAuthButton = document.getElementById("disneyGoogleAuthButton");
const disneyGoogleSignOutButton = document.getElementById("disneyGoogleSignOutButton");
const disneyAuthStatus = document.getElementById("disneyAuthStatus");
window.MYHUB_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBb-2GlOsnUDzDXZ8-mgd6XIr8ny4ZkJoo",
    authDomain: "my-disneyland-paris.firebaseapp.com",
    databaseURL: "https://my-disneyland-paris-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-disneyland-paris",
    storageBucket: "my-disneyland-paris.firebasestorage.app",
    messagingSenderId: "787833723893",
    appId: "1:787833723893:web:0cd3c3f0f01dd7e8c09ebc"
};
const DISNEY_FIREBASE_CONFIG = window.MYHUB_FIREBASE_CONFIG;
let disneySourceDate = getDisneyTargetDate();
let disneySyncMode = "local";

function toDateFromInputValue(value) {
    if (!value) {
        return null;
    }

    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function getDisneyTargetDate() {

    try {
        const saved = localStorage.getItem(DISNEY_TRIP_STORAGE_KEY);

        if (saved) {
            const parsed = toDateFromInputValue(saved);

            if (parsed) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn("Impossible de lire la date du séjour Disney :", error);
    }

    const fallback = toDateFromInputValue(DEFAULT_DISNEY_TRIP_DATE);

    if (fallback) {
        return fallback;
    }

    return new Date();
}

function saveDisneyTripDate() {
    if (!disneyTripDateInput) {
        return;
    }

    const selectedValue = disneyTripDateInput.value;

    if (!selectedValue) {
        return;
    }

    try {
        localStorage.setItem(DISNEY_TRIP_STORAGE_KEY, selectedValue);
        disneySourceDate = toDateFromInputValue(selectedValue) || getDisneyTargetDate();
        disneySyncMode = "local";
        updateDisneyCountdown();
        window.MyHubCloudSync?.update("disneyTripDate", selectedValue);
    } catch (error) {
        console.warn("Impossible d'enregistrer la date du séjour Disney :", error);
    }
}

function syncDisneyDateInput() {
    if (!disneyTripDateInput) {
        return;
    }

    try {
        const saved = localStorage.getItem(DISNEY_TRIP_STORAGE_KEY);
        const nextDate = saved || DEFAULT_DISNEY_TRIP_DATE;
        disneyTripDateInput.value = nextDate;
    } catch (error) {
        disneyTripDateInput.value = DEFAULT_DISNEY_TRIP_DATE;
    }
}

function getNextDisneyEvent(eventsObject) {
    if (!eventsObject || typeof eventsObject !== "object") {
        return null;
    }

    const entries = Object.entries(eventsObject)
        .map(([eventId, event]) => {
            if (!event || typeof event !== "object") {
                return null;
            }

            const startValue = event.start || event.date || event.begin || event.debut;
            if (!startValue) {
                return null;
            }

            const parsed = toDateFromInputValue(startValue);

            if (!parsed) {
                return null;
            }

            return {
                id: eventId,
                start: startValue,
                date: parsed,
                details: event.details || "",
                end: event.end || startValue
            };
        })
        .filter(Boolean);

    if (!entries.length) {
        return null;
    }

    const now = new Date();
    const upcoming = entries
        .filter(item => item.date.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming[0] || null;
}

function applyDisneyDate(date, mode = "local") {
    if (!date || Number.isNaN(date.getTime())) {
        return;
    }

    disneySourceDate = date;
    disneySyncMode = mode;

    if (disneyTripDateInput) {
        disneyTripDateInput.value = date.toISOString().slice(0, 10);
    }

    updateDisneyCountdown();
}

function renderDisneyAuthUi(user) {
    if (!disneyGoogleAuthButton || !disneyGoogleSignOutButton || !disneyAuthStatus) {
        return;
    }

    if (user) {
        disneyGoogleAuthButton.hidden = true;
        disneyGoogleSignOutButton.hidden = false;
        disneyAuthStatus.textContent = `Connecté : ${user.displayName || user.email || "Compte Google"}`;
        return;
    }

    disneyGoogleAuthButton.hidden = false;
    disneyGoogleSignOutButton.hidden = true;
    disneyAuthStatus.textContent = "Non connecté";
}

async function signInDisneyWithGoogle() {
    try {
        if (!window.firebase || !firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(DISNEY_FIREBASE_CONFIG);
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const result = await firebase.auth().signInWithPopup(provider);
        renderDisneyAuthUi(result.user);
    } catch (error) {
        console.error("Erreur connexion Google Disney :", error);

        if (disneyAuthStatus) {
            disneyAuthStatus.textContent = "Connexion refusée ou impossible.";
        }
    }
}

async function signOutDisneyFromGoogle() {
    try {
        await firebase.auth().signOut();
        renderDisneyAuthUi(null);
    } catch (error) {
        console.error("Erreur déconnexion Google Disney :", error);
    }
}

function attachDisneyFirebaseListener() {
    if (!window.firebase || !firebase.apps || !firebase.apps.length) {
        try {
            firebase.initializeApp(DISNEY_FIREBASE_CONFIG);
        } catch (error) {
            console.warn("Impossible d'initialiser Firebase Disney :", error);
            return;
        }
    }

    const auth = firebase.auth();
    const db = firebase.database();

    auth.onAuthStateChanged((user) => {
        renderDisneyAuthUi(user);

        if (!user) {
            console.info("MyHub : pas d'utilisateur Firebase connecté pour le planning Disney.");
            return;
        }

        db.ref("planning/events")
            .on("value", (snapshot) => {
                const events = snapshot.val() || {};
                const nextEvent = getNextDisneyEvent(events);

                if (nextEvent) {
                    const nextDate = toDateFromInputValue(nextEvent.start) || nextEvent.date;
                    applyDisneyDate(nextDate, "firebase");
                    return;
                }

                applyDisneyDate(getDisneyTargetDate(), "local");
            });
    });
}

async function loadDlpStatsFromFirebase() {
    if (!window.firebase || !firebase.apps || !firebase.apps.length) {
        try {
            firebase.initializeApp(DISNEY_FIREBASE_CONFIG);
        } catch (error) {
            console.warn("Impossible d'initialiser Firebase MyDLP pour Jarvis :", error);
            return null;
        }
    }

    const auth = firebase.auth ? firebase.auth() : null;
    const db = firebase.database ? firebase.database() : null;

    if (!auth || !db) {
        return null;
    }

    const user = auth.currentUser;
    if (!user) {
        console.info("MyHub : aucun utilisateur Google connecté, donc Jarvis ne peut pas lire les données MyDLP.");
        return null;
    }

    try {
        const snapshot = await db.ref("planning/activities").once("value");
        const data = snapshot.val();

        if (data && typeof data === "object") {
            return data;
        }

        return null;
    } catch (error) {
        console.warn("Impossible de lire les données MyDLP depuis Firebase pour Jarvis :", error);
        return null;
    }
}

function formatDisneyCountdown(millisecondsLeft) {

    const totalSeconds = Math.max(0, Math.floor(millisecondsLeft / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
        return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
    }

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }

    return `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function updateDisneyCountdown() {

    const tripDateLabel = document.getElementById("disneyTripDateLabel");
    const countdownValue = document.getElementById("disneyCountdownValue");
    const countdownStatus = document.getElementById("disneyCountdownStatus");

    if (!tripDateLabel || !countdownValue || !countdownStatus) {
        return;
    }

    const targetDate = disneySourceDate || getDisneyTargetDate();
    const now = new Date();
    const remainingMs = targetDate.getTime() - now.getTime();

    const dateLabel = targetDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    tripDateLabel.textContent = `Départ le ${dateLabel}`;

    if (remainingMs <= 0) {
        countdownValue.textContent = "C’est le jour J !";
        countdownStatus.textContent = "Disneyland Paris, on y va !";
        return;
    }

    const daysLeft = Math.floor(remainingMs / 86400000);
    const hoursLeft = Math.floor((remainingMs % 86400000) / 3600000);
    const minutesLeft = Math.floor((remainingMs % 3600000) / 60000);

    countdownValue.textContent = formatDisneyCountdown(remainingMs);
    countdownStatus.textContent = `Encore ${daysLeft} jour${daysLeft > 1 ? "s" : ""} ${String(hoursLeft).padStart(2, "0")}h ${String(minutesLeft).padStart(2, "0")}m avant le départ.`;
}

syncDisneyDateInput();
updateDisneyCountdown();
setInterval(updateDisneyCountdown, 1000);

if (saveDisneyTripDateButton) {
    saveDisneyTripDateButton.addEventListener("click", saveDisneyTripDate);
}

if (disneyTripDateInput) {
    disneyTripDateInput.addEventListener("change", saveDisneyTripDate);
}

if (disneyGoogleAuthButton) {
    disneyGoogleAuthButton.addEventListener("click", signInDisneyWithGoogle);
}

if (disneyGoogleSignOutButton) {
    disneyGoogleSignOutButton.addEventListener("click", signOutDisneyFromGoogle);
}

renderDisneyAuthUi(null);
attachDisneyFirebaseListener();


/* ==========================================
   STOCKAGE PARTAGÉ (LOCAL + SYNCHRONISATION CLOUD)
========================================== */

const SHARED_STORE_KEY = "myhub_shared_store_v1";
const SHARED_DB_NAME = "myhub_shared_db";
const SHARED_DB_VERSION = 1;
const SHARED_DB_STORE = "state";
const REMOTE_DB_URL = (
    (typeof window !== "undefined" && window.MYHUB_DB_URL)
        ? window.MYHUB_DB_URL
        : ""
).trim();

const DEFAULT_TASKS = [
    "Configurer MyHub",
    "Créer les widgets",
    "Ajouter JARVIS"
];

let taskList = [];
let memoText = "";

const tasksListElement =
    document.getElementById("tasksList");

const addTaskButton =
    document.getElementById("addTaskButton");

const memoInput =
    document.getElementById("memoInput");

const memoStatus =
    document.getElementById("memoStatus");

function normalizeTaskList(items) {

    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter(item => typeof item === "string")
        .map(item => item.trim())
        .filter(item => item !== "");
}

function getDefaultState() {
    return {
        tasks: [...DEFAULT_TASKS],
        memo: ""
    };
}

function readLocalStorageState() {

    try {

        const saved =
            localStorage.getItem(SHARED_STORE_KEY);

        if (!saved) {
            return getDefaultState();
        }

        const parsed = JSON.parse(saved);

        if (!parsed || typeof parsed !== "object") {
            return getDefaultState();
        }

        return {
            tasks: normalizeTaskList(parsed.tasks),
            memo: typeof parsed.memo === "string" ? parsed.memo : ""
        };

    } catch (error) {
        console.error("Impossible de charger le stockage local partagé :", error);
        return getDefaultState();
    }
}

function writeLocalStorageState(state) {

    try {

        localStorage.setItem(
            SHARED_STORE_KEY,
            JSON.stringify({
                tasks: state.tasks,
                memo: state.memo
            })
        );

    } catch (error) {
        console.error("Impossible de sauvegarder le stockage local partagé :", error);
    }
}

function openSharedDatabase() {

    return new Promise((resolve, reject) => {

        if (!("indexedDB" in window)) {
            resolve(null);
            return;
        }

        const request = window.indexedDB.open(SHARED_DB_NAME, SHARED_DB_VERSION);

        request.onupgradeneeded = () => {

            const db = request.result;

            if (!db.objectStoreNames.contains(SHARED_DB_STORE)) {
                db.createObjectStore(SHARED_DB_STORE, { keyPath: "id" });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error || new Error("IndexedDB unavailable"));
        };
    });
}

function readDbState() {

    return new Promise(async resolve => {

        try {

            const db = await openSharedDatabase();

            if (!db) {
                resolve(readLocalStorageState());
                return;
            }

            const transaction = db.transaction(SHARED_DB_STORE, "readonly");
            const store = transaction.objectStore(SHARED_DB_STORE);
            const request = store.get("myhub_shared_state");

            request.onsuccess = () => {
                const payload = request.result && request.result.payload
                    ? request.result.payload
                    : null;

                resolve(payload || readLocalStorageState());
            };

            request.onerror = () => {
                resolve(readLocalStorageState());
            };

        } catch (error) {
            console.warn("IndexedDB indisponible, fallback sur localStorage.", error);
            resolve(readLocalStorageState());
        }
    });
}

function writeDbState(state) {

    return new Promise(async resolve => {

        try {

            const db = await openSharedDatabase();

            if (!db) {
                writeLocalStorageState(state);
                resolve();
                return;
            }

            const transaction = db.transaction(SHARED_DB_STORE, "readwrite");
            const store = transaction.objectStore(SHARED_DB_STORE);
            store.put({
                id: "myhub_shared_state",
                payload: state
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => {
                writeLocalStorageState(state);
                resolve();
            };

        } catch (error) {
            console.warn("Impossible d’écrire dans IndexedDB, fallback localStorage.", error);
            writeLocalStorageState(state);
            resolve();
        }
    });
}

async function readRemoteState() {

    if (!REMOTE_DB_URL) {
        return null;
    }

    try {

        const response = await fetch(REMOTE_DB_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json();

        if (payload && typeof payload === "object" && "payload" in payload) {
            return payload.payload;
        }

        return payload;

    } catch (error) {
        console.warn("Synchronisation cloud indisponible, stockage local conservé.", error);
        return null;
    }
}

async function saveRemoteState() {

    if (!REMOTE_DB_URL) {
        return;
    }

    try {

        await fetch(REMOTE_DB_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: "myhub_shared_state",
                payload: {
                    tasks: taskList,
                    memo: memoText
                }
            })
        });

    } catch (error) {
        console.warn("Impossible de synchroniser le stockage cloud.", error);
    }
}

async function persistSharedState() {

    const state = {
        tasks: taskList,
        memo: memoText
    };

    await writeDbState(state);
    await saveRemoteState();
    window.MyHubCloudSync?.update("shared", state);
}

async function loadSharedState() {

    const localState = await readDbState();
    const remoteState = await readRemoteState();

    const remoteTasks = normalizeTaskList(remoteState && remoteState.tasks);
    const localTasks = normalizeTaskList(localState.tasks);

    const hasRemoteData = remoteTasks.length > 0 || (
        remoteState && typeof remoteState.memo === "string" && remoteState.memo.trim() !== ""
    );

    taskList = hasRemoteData ? remoteTasks : localTasks.length > 0 ? localTasks : [...DEFAULT_TASKS];
    memoText = hasRemoteData
        ? (remoteState && typeof remoteState.memo === "string" ? remoteState.memo : localState.memo)
        : localState.memo;

    renderTasks();
    renderMemo();

    await writeDbState({
        tasks: taskList,
        memo: memoText
    });
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
                persistSharedState();
                renderTasks();
            }
        });

        label.appendChild(checkbox);
        label.appendChild(span);
        tasksListElement.appendChild(label);
    });
}

function renderMemo() {

    if (!memoInput) {
        return;
    }

    memoInput.value = memoText;

    if (memoStatus) {
        const accountConnected = Boolean(
            window.firebase?.apps?.length && firebase.auth().currentUser
        );
        memoStatus.textContent = REMOTE_DB_URL || accountConnected
            ? "Sauvegarde locale + synchronisation cloud"
            : "Sauvegarde locale · connecte-toi pour synchroniser";
    }

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
    persistSharedState();
    renderTasks();
}

if (memoInput) {
    memoInput.addEventListener("input", () => {
        memoText = memoInput.value;
        persistSharedState();

        if (memoStatus) {
            memoStatus.textContent = "Sauvegardé";
        }
    });
}

if (addTaskButton) {
    addTaskButton.addEventListener("click", addTask);
}

window.MyHubSharedStateReady = loadSharedState();
window.MyHubSharedStateReady.then(() => {
    window.MyHubCloudSync?.register("shared", {
        read: () => ({ tasks: taskList, memo: memoText }),
        merge: (local, remote) => remote && typeof remote === "object"
            ? {
                tasks: Array.isArray(remote.tasks) ? remote.tasks : local.tasks,
                memo: typeof remote.memo === "string" ? remote.memo : local.memo
            }
            : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            taskList = normalizeTaskList(remote?.tasks);
            memoText = typeof remote?.memo === "string" ? remote.memo : "";
            renderTasks();
            renderMemo();
            void writeDbState({ tasks: taskList, memo: memoText });
        }
    });
    window.MyHubCloudSync?.register("disneyTripDate", {
        read: () => localStorage.getItem(DISNEY_TRIP_STORAGE_KEY),
        merge: (local, remote) => typeof remote === "string" ? remote : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            if (typeof remote !== "string" || !toDateFromInputValue(remote)) return;
            localStorage.setItem(DISNEY_TRIP_STORAGE_KEY, remote);
            applyDisneyDate(toDateFromInputValue(remote), "cloud");
        }
    });
    window.MyHubCloudSync?.register("agenda", {
        read: () => agendaItems,
        merge: (local, remote) => Array.isArray(remote) ? remote : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            if (!Array.isArray(remote)) return;
            localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(remote));
            loadAgendaItems();
            renderAgendaCalendar();
            renderAgendaUpcoming();
        }
    });
    window.MyHubCloudSync?.register("jarvisSettings", {
        read: () => jarvisVoiceSettings,
        merge: (local, remote) => remote && typeof remote === "object" ? remote : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            if (!remote || typeof remote !== "object") return;
            jarvisVoiceSettings = {
                ...defaultJarvisSettings,
                ...remote,
                volume: clampJarvisVolume(remote.volume ?? defaultJarvisSettings.volume)
            };
            localStorage.setItem(JARVIS_SETTINGS_KEY, JSON.stringify(jarvisVoiceSettings));
            renderJarvisSettingsUi();
        }
    });
    window.MyHubCloudSync?.register("jarvisMemory", {
        read: () => jarvisLongTermMemory,
        merge: (local, remote) => Array.isArray(remote) ? remote : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            if (!Array.isArray(remote)) return;
            jarvisLongTermMemory = remote
                .filter(item => item && typeof item.text === "string" && item.date)
                .slice(-30);
            localStorage.setItem(JARVIS_MEMORY_KEY, JSON.stringify(jarvisLongTermMemory));
            renderJarvisMemory();
        }
    });
    window.MyHubCloudSync?.register("jarvisHistory", {
        read: () => jarvisHistory,
        merge: (local, remote) => Array.isArray(remote) ? remote : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            if (!Array.isArray(remote)) return;
            jarvisHistory = remote
                .filter(message => message &&
                    ["user", "model", "assistant"].includes(message.role) &&
                    typeof message.text === "string")
                .map(message => ({
                    role: message.role === "assistant" ? "model" : message.role,
                    text: message.text
                }))
                .slice(-30);
            localStorage.setItem(JARVIS_HISTORY_KEY, JSON.stringify(jarvisHistory));
        }
    });
    window.MyHubCloudSync?.register("spotifyRandomHistory", {
        read: () => {
            try {
                return JSON.parse(localStorage.getItem(spotifyRandomHistoryKey) || "{}");
            } catch (error) {
                console.warn("Impossible de charger l’historique Spotify :", error);
                return {};
            }
        },
        merge: (local, remote) => remote && typeof remote === "object" ? remote : local,
        mergeUpdate: incoming => incoming,
        apply: remote => {
            if (!remote || typeof remote !== "object") return;
            localStorage.setItem(spotifyRandomHistoryKey, JSON.stringify(remote));
        }
    });
});

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
        window.MyHubCloudSync?.update("jarvisSettings", jarvisVoiceSettings);
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

const JARVIS_MEMORY_KEY =
    "jarvis_long_term_memory";

let jarvisLongTermMemory = [];

function loadJarvisLongTermMemory() {
    try {
        const saved = localStorage.getItem(JARVIS_MEMORY_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        jarvisLongTermMemory = Array.isArray(parsed)
            ? parsed.filter(item => item && typeof item.text === "string").slice(-30)
            : [];
    } catch (error) {
        console.warn("Impossible de charger la mémoire longue de JARVIS :", error);
        jarvisLongTermMemory = [];
    }
}

function saveJarvisLongTermMemory() {
    const savedMemory = jarvisLongTermMemory.slice(-30);
    localStorage.setItem(JARVIS_MEMORY_KEY, JSON.stringify(savedMemory));
    window.MyHubCloudSync?.update("jarvisMemory", savedMemory);
}

function rememberJarvisPreference(text) {
    const normalized = String(text || "").trim();

    if (!/(j'aime|j aime|je prefere|je préfère|je n'aime pas|je n aime pas|je deteste|je déteste|mon |ma )/i.test(normalized)) {
        return;
    }

    if (jarvisLongTermMemory.some(item => item.text.toLowerCase() === normalized.toLowerCase())) {
        return;
    }

    jarvisLongTermMemory.push({
        text: normalized,
        date: new Date().toISOString()
    });
    saveJarvisLongTermMemory();
    renderJarvisMemory();
}

function renderJarvisMemory() {
    const memoryList = document.getElementById("jarvisMemoryList");

    if (!memoryList) {
        return;
    }

    memoryList.replaceChildren();

    if (jarvisLongTermMemory.length === 0) {
        memoryList.innerHTML = '<p class="memory-empty">Aucune préférence enregistrée pour le moment.</p>';
        return;
    }

    jarvisLongTermMemory.slice().reverse().forEach(item => {
        const entry = document.createElement("article");
        entry.className = "memory-entry";
        entry.innerHTML = `<strong>Préférence mémorisée</strong><p></p>`;
        entry.querySelector("p").textContent = item.text;
        memoryList.appendChild(entry);
    });
}

function clearJarvisMemory() {
    jarvisLongTermMemory = [];
    jarvisHistory = [];
    localStorage.removeItem(JARVIS_MEMORY_KEY);
    localStorage.removeItem(JARVIS_HISTORY_KEY);
    window.MyHubCloudSync?.update("jarvisMemory", []);
    window.MyHubCloudSync?.update("jarvisHistory", []);
    renderJarvisMemory();
}

const AGENDA_STORAGE_KEY = "myhub_agenda_items";
let agendaItems = [];
let agendaDisplayedWeek = getAgendaWeekStart(new Date());

function getAgendaDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getAgendaWeekStart(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    return start;
}

function getAgendaLocalDate(dateValue) {
    const [year, month, day] = String(dateValue).split("-").map(Number);
    return new Date(year, month - 1, day);
}

function loadAgendaItems() {
    try {
        const saved = JSON.parse(localStorage.getItem(AGENDA_STORAGE_KEY) || "[]");
        agendaItems = Array.isArray(saved)
            ? saved.filter(item => item?.id && item?.title && item?.date).map(item => ({
                ...item,
                type: item.type === "schedule" ? "course" : (item.type || "course"),
                startTime: item.startTime || item.time || "",
                endTime: item.endTime || "",
                recurring: Boolean(item.recurring),
                excludedDates: Array.isArray(item.excludedDates) ? item.excludedDates : []
            }))
            : [];
    } catch (error) {
        console.warn("Impossible de charger l'agenda :", error);
        agendaItems = [];
    }
}

function saveAgendaItems() {
    localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(agendaItems));
    window.MyHubCloudSync?.update("agenda", agendaItems);
}

function requestAgendaNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
    }
}

function checkAgendaReminders() {
    const now = new Date();
    const firedKey = "myhub_fired_reminders";
    let savedFired = [];

    try {
        savedFired = JSON.parse(localStorage.getItem(firedKey) || "[]");
    } catch {
        savedFired = [];
    }

    const fired = new Set(Array.isArray(savedFired) ? savedFired : []);

    agendaItems.filter(item => item.type === "reminder").forEach(item => {
        const reminderDate = getAgendaLocalDate(item.date);
        const [hour, minute] = (item.startTime || "09:00").split(":").map(Number);
        reminderDate.setHours(hour || 0, minute || 0, 0, 0);
        const uniqueKey = `${item.id}:${item.date}:${item.startTime}`;

        if (now >= reminderDate && !fired.has(uniqueKey)) {
            fired.add(uniqueKey);
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Rappel MyHub", { body: item.title });
            }
        }
    });

    localStorage.setItem(firedKey, JSON.stringify([...fired].slice(-100)));
}

function formatAgendaTime(time) {
    return time ? ` à ${time.replace(":", "h")}` : "";
}

function getAgendaSummary() {
    const todayKey = getAgendaDateKey(new Date());
    const entries = agendaItems
        .flatMap(item => item.recurring ? getUpcomingRecurringOccurrences(item) : [{ item, dateKey: item.date }])
        .filter(entry => entry.dateKey >= todayKey)
        .sort((first, second) => `${first.dateKey}${first.item.startTime || ""}`.localeCompare(`${second.dateKey}${second.item.startTime || ""}`))
        .slice(0, 8);

    if (entries.length === 0) {
        return "Ton agenda est vide pour les prochains jours. 📅";
    }

    return `Voici tes prochaines échéances : ${entries.map(({ item, dateKey }) =>
        `${item.title} le ${formatAgendaDate(dateKey)}${formatAgendaTime(item.startTime)}`
    ).join(" ; ")}.`;
}

function parseAgendaDate(command) {
    const normalized = normalizeCommandText(command);
    const now = new Date();

    if (/apres demain/.test(normalized)) {
        now.setDate(now.getDate() + 2);
        return getAgendaDateKey(now);
    }

    if (/demain/.test(normalized)) {
        now.setDate(now.getDate() + 1);
        return getAgendaDateKey(now);
    }

    const numericDate = normalized.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
    if (numericDate) {
        const year = numericDate[3] ? Number(numericDate[3].length === 2 ? `20${numericDate[3]}` : numericDate[3]) : now.getFullYear();
        return getAgendaDateKey(new Date(year, Number(numericDate[2]) - 1, Number(numericDate[1])));
    }

    const weekdays = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const weekdayIndex = weekdays.findIndex(day => normalized.includes(day));
    if (weekdayIndex >= 0) {
        const result = new Date(now);
        let daysAhead = (weekdayIndex - now.getDay() + 7) % 7;
        if (daysAhead === 0 && /prochain|next/.test(normalized)) {
            daysAhead = 7;
        }
        result.setDate(result.getDate() + daysAhead);
        return getAgendaDateKey(result);
    }

    return getAgendaDateKey(now);
}

function parseAgendaTime(command) {
    const match = normalizeCommandText(command).match(/\ba\s+(\d{1,2})(?:h| heure| heures)?(?:\s*(\d{2}))?\b/);
    if (!match) {
        return "09:00";
    }

    return `${String(Math.min(23, Number(match[1]))).padStart(2, "0")}:${String(Number(match[2] || 0)).padStart(2, "0")}`;
}

function getLocalAgendaAction(command) {
    const normalized = normalizeCommandText(command);
    const mentionsAgenda = /(agenda|rappel|rappelle|souviens toi|souviens-toi|devoirs?|cours|cette semaine|emploi du temps)/.test(normalized);

    if (!mentionsAgenda) {
        return null;
    }

    if (/(ouvre|ouvrir|affiche|montrer).*(agenda|emploi du temps)/.test(normalized)) {
        return {
            action: "agenda_control",
            command: "open",
            reply: "J'ouvre ton agenda. 📅"
        };
    }

    if (/(qu est ce que j ai|qu ai je|quoi|montre|affiche|rappels?|devoirs?|cours|emploi du temps)/.test(normalized) &&
        !/(rappelle moi|rappeler|ajoute|enregistre|cree|crée)/.test(normalized)) {
        return {
            action: "agenda_control",
            command: "list",
            reply: getAgendaSummary()
        };
    }

    if (/(rappelle moi|rappeler|ajoute un rappel|cree un rappel|crée un rappel|souviens toi)/.test(normalized)) {
        const title = normalized
            .replace(/.*?(rappelle moi de|rappelle moi|rappeler de|rappeler|ajoute un rappel pour|ajoute un rappel|cree un rappel de|cree un rappel|crée un rappel de|crée un rappel|souviens toi de)\s*/, "")
            .replace(/\b(demain|apres demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|prochain)\b/g, "")
            .replace(/\ba\s+\d{1,2}(?:h| heure| heures)?(?:\s*\d{2})?\b/g, "")
            .replace(/\s+/g, " ")
            .trim() || "Rappel";

        return {
            action: "agenda_control",
            command: "create_reminder",
            title,
            date: parseAgendaDate(command),
            time: parseAgendaTime(command)
        };
    }

    return null;
}

function formatAgendaDate(dateValue) {
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(getAgendaLocalDate(dateValue));
}

function getAgendaOccurrencesForWeek(item) {
    const occurrences = [];
    const startDate = getAgendaLocalDate(item.date);

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const occurrenceDate = new Date(agendaDisplayedWeek);
        occurrenceDate.setDate(agendaDisplayedWeek.getDate() + dayIndex);
        const dateKey = getAgendaDateKey(occurrenceDate);

        if (dateKey < item.date || item.excludedDates?.includes(dateKey)) {
            continue;
        }

        if (item.recurring) {
            if (item.recurrenceEnd && dateKey > item.recurrenceEnd) {
                continue;
            }
            if (occurrenceDate.getDay() !== startDate.getDay()) {
                continue;
            }
        } else if (dateKey !== item.date) {
            continue;
        }

        occurrences.push({ item, dateKey, date: occurrenceDate });
    }

    return occurrences;
}

function getAgendaItemsForWeek() {
    return agendaItems.flatMap(getAgendaOccurrencesForWeek);
}

function renderAgendaCalendar() {
    const calendar = document.getElementById("agendaCalendar");
    const weekHeader = document.getElementById("agendaWeekHeader");
    const monthLabel = document.getElementById("agendaMonthLabel");

    if (!calendar || !weekHeader || !monthLabel) {
        return;
    }

    const weekEnd = new Date(agendaDisplayedWeek);
    weekEnd.setDate(weekEnd.getDate() + 4);
    monthLabel.textContent = `${formatAgendaDate(getAgendaDateKey(agendaDisplayedWeek))} - ${formatAgendaDate(getAgendaDateKey(weekEnd))}`;
    weekHeader.replaceChildren();
    calendar.replaceChildren();
    const today = new Date();
    const todayKey = getAgendaDateKey(today);

    const headerSpacer = document.createElement("span");
    weekHeader.appendChild(headerSpacer);

    for (let dayIndex = 0; dayIndex < 5; dayIndex += 1) {
        const date = new Date(agendaDisplayedWeek);
        date.setDate(date.getDate() + dayIndex);
        const header = document.createElement("div");
        header.className = `week-day-header${getAgendaDateKey(date) === todayKey ? " today" : ""}`;
        header.textContent = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric" }).format(date);
        weekHeader.appendChild(header);
    }

    const timeAxis = document.createElement("div");
    timeAxis.className = "week-time-axis";
    const dayColumns = [];
    for (let hour = 8; hour <= 17; hour += 1) {
        const time = document.createElement("span");
        time.textContent = `${String(hour).padStart(2, "0")}:00`;
        timeAxis.appendChild(time);
    }
    calendar.appendChild(timeAxis);

    for (let dayIndex = 0; dayIndex < 5; dayIndex += 1) {
        const date = new Date(agendaDisplayedWeek);
        date.setDate(date.getDate() + dayIndex);
        const dateKey = getAgendaDateKey(date);
        const column = document.createElement("div");
        column.className = `week-day-column${dateKey === todayKey ? " today" : ""}`;
        for (let hour = 8; hour <= 17; hour += 1) {
            const line = document.createElement("span");
            line.className = "week-hour-line";
            line.style.top = `${(hour - 8) * (100 / 9)}%`;
            column.appendChild(line);
        }
        dayColumns.push(column);
        calendar.appendChild(column);
    }

    getAgendaItemsForWeek().forEach(({ item, dateKey }) => {
        const dateIndex = Math.round((getAgendaLocalDate(dateKey) - agendaDisplayedWeek) / 86400000);
        const column = dayColumns[dateIndex];
        if (!column) {
            return;
        }
        const [startHour, startMinute] = (item.startTime || "08:00").split(":").map(Number);
        const [endHour, endMinute] = (item.endTime || item.startTime || "09:00").split(":").map(Number);
        const startTotalMinutes = startHour * 60 + (startMinute || 0);
        const endTotalMinutes = endHour * 60 + (endMinute || 0);
        const visibleStart = Math.max(8 * 60, startTotalMinutes);
        const visibleEnd = Math.min(17 * 60, Math.max(startTotalMinutes + 30, endTotalMinutes));

        if (visibleEnd <= visibleStart) {
            return;
        }

        const event = document.createElement("article");
        event.className = `week-event ${item.type}`;
        event.style.top = `${(visibleStart - 8 * 60) / 540 * 100}%`;
        event.style.height = `${(visibleEnd - visibleStart) / 540 * 100}%`;
        event.innerHTML = `<strong></strong><span></span>`;
        event.querySelector("strong").textContent = item.title;
        event.querySelector("span").textContent = `${item.startTime || ""}${item.endTime ? ` - ${item.endTime}` : ""}`;
        event.addEventListener("click", () => removeAgendaItem(item, dateKey));
        column.appendChild(event);
    });
}

function renderAgendaUpcoming() {
    const upcoming = document.getElementById("agendaUpcoming");

    if (!upcoming) {
        return;
    }

    upcoming.replaceChildren();
    const sortedItems = agendaItems
        .slice()
        .flatMap(item => item.recurring ? getUpcomingRecurringOccurrences(item) : [{ item, dateKey: item.date }])
        .sort((first, second) => `${first.dateKey}${first.item.startTime || ""}`.localeCompare(`${second.dateKey}${second.item.startTime || ""}`))
        .filter(entry => entry.dateKey >= getAgendaDateKey(new Date()))
        .slice(0, 12);

    if (sortedItems.length === 0) {
        upcoming.innerHTML = '<p class="agenda-empty">Rien de prévu pour le moment.</p>';
        return;
    }

    sortedItems.forEach(({ item, dateKey }) => {
        const element = document.createElement("article");
        element.className = `agenda-item ${item.type}`;
        element.innerHTML = `<div class="agenda-item-meta"></div><strong></strong><p></p><button class="agenda-item-delete" type="button" aria-label="Gérer la suppression">×</button>`;
        element.querySelector(".agenda-item-meta").textContent = `${formatAgendaDate(dateKey)}${item.startTime ? ` à ${item.startTime}` : ""}${item.recurring ? " · chaque semaine" : ""}`;
        element.querySelector("strong").textContent = item.title;
        element.querySelector("p").textContent = item.description || (
            item.type === "homework" ? "Devoir à rendre" :
            item.type === "reminder" ? "Rappel" : "Cours"
        );
        element.querySelector(".agenda-item-delete").addEventListener("click", () => removeAgendaItem(item, dateKey));
        upcoming.appendChild(element);
    });
}

function getUpcomingRecurringOccurrences(item) {
    const occurrences = [];
    const start = new Date();
    for (let offset = 0; offset < 60 && occurrences.length < 12; offset += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + offset);
        const dateKey = getAgendaDateKey(date);
        if (dateKey >= item.date && (!item.recurrenceEnd || dateKey <= item.recurrenceEnd) && date.getDay() === getAgendaLocalDate(item.date).getDay() && !item.excludedDates?.includes(dateKey)) {
            occurrences.push({ item, dateKey });
        }
    }
    return occurrences;
}

function removeAgendaItem(item, occurrenceDate) {
    if (!item.recurring) {
        if (window.confirm("Supprimer ce cours ou devoir ?")) {
            agendaItems = agendaItems.filter(candidate => candidate.id !== item.id);
        }
    } else if (window.confirm("Supprimer toute la série hebdomadaire ?\n\nChoisis Annuler pour supprimer seulement cette occurrence.")) {
        agendaItems = agendaItems.filter(candidate => candidate.id !== item.id);
    } else if (window.confirm("Supprimer seulement cette occurrence ?")) {
        item.excludedDates = [...new Set([...(item.excludedDates || []), occurrenceDate])];
    }
    saveAgendaItems();
    renderAgendaCalendar();
    renderAgendaUpcoming();
}

function initializeAgenda() {
    loadAgendaItems();
    renderAgendaCalendar();
    renderAgendaUpcoming();

    const form = document.getElementById("agendaForm");
    const dateInput = document.getElementById("agendaDate");
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    form?.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(form);
        agendaItems.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: String(formData.get("title") || "").trim(),
            type: String(formData.get("type") || "course"),
            date: String(formData.get("date") || ""),
            startTime: String(formData.get("startTime") || ""),
            endTime: String(formData.get("endTime") || ""),
            recurring: formData.get("recurring") === "on",
            recurrenceEnd: String(formData.get("recurrenceEnd") || ""),
            excludedDates: [],
            description: String(formData.get("description") || "").trim()
        });
        if (formData.get("type") === "reminder") {
            requestAgendaNotificationPermission();
        }
        saveAgendaItems();
        form.reset();
        dateInput.value = new Date().toISOString().slice(0, 10);
        renderAgendaCalendar();
        renderAgendaUpcoming();
    });

    document.getElementById("agendaPreviousWeek")?.addEventListener("click", () => {
        agendaDisplayedWeek.setDate(agendaDisplayedWeek.getDate() - 7);
        renderAgendaCalendar();
    });
    document.getElementById("agendaNextWeek")?.addEventListener("click", () => {
        agendaDisplayedWeek.setDate(agendaDisplayedWeek.getDate() + 7);
        renderAgendaCalendar();
    });
    document.getElementById("agendaRecurring")?.addEventListener("change", event => {
        document.getElementById("agendaRecurrenceEndRow").hidden = !event.target.checked;
    });
    document.getElementById("agendaType")?.addEventListener("change", event => {
        const recurring = document.getElementById("agendaRecurring");
        const recurrenceEndRow = document.getElementById("agendaRecurrenceEndRow");
        const isCourse = event.target.value === "course";
        recurring.disabled = !isCourse;
        if (!isCourse) {
            recurring.checked = false;
            recurrenceEndRow.hidden = true;
        }
    });
    checkAgendaReminders();
    window.setInterval(checkAgendaReminders, 30000);
}


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
                .slice(-30);

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
                jarvisHistory.slice(-30)
            )
        );
        window.MyHubCloudSync?.update("jarvisHistory", jarvisHistory.slice(-30));

    } catch (error) {

        console.error(
            "Impossible de sauvegarder la mémoire JARVIS :",
            error
        );
    }
}


function addToJarvisHistory(role, text) {

    if (role === "user") {
        rememberJarvisPreference(text);
    }

    jarvisHistory.push({

        role: role,
        text: text

    });


    jarvisHistory =
        jarvisHistory.slice(-30);


    saveJarvisHistory();
}

loadJarvisLongTermMemory();
renderJarvisMemory();

document.getElementById("clearJarvisMemoryButton")?.addEventListener(
    "click",
    clearJarvisMemory
);


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

    agenda:
        "agendaSection",

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

        "DJ gestuel":
            "gestureDjSection",

        "Parade Rush":
            "disney2DSection",

        "Éclats de magie":
            "disneyMatchSection",

        "Dessin":
            "ludothequeSection",

        "Contrôle":
            "musicSection",

        "Agenda":
            "agendaSection",
        "Paramètres":
            "settingsSection"
    };


    return mapping[pageName] || null;
}


const siteCatalog = {
    myhub: {
        aliases: ["myhub", "my hub", "hub"],
        url: "index.html",
        local: true,
        section: "homeSection",
        label: "MyHub"
    },
    mydlp: {
        aliases: ["mydlp", "my dlp", "disneyland", "disneyland paris"],
        url: "https://quentwax.github.io/My-DLP/index.html",
        local: false,
        label: "MyDLP",
        searchParam: "?q="
    },
    ludotheque: {
        aliases: ["ludotheque", "ludothèque", "ma ludotheque", "ma ludothèque", "bibliotheque jeux", "bibliothèque jeux"],
        url: "https://quentwax.github.io/jeux_societe/",
        local: false,
        label: "Ludothèque",
        searchParam: "?search="
    },
    portfolio: {
        aliases: ["portfolio", "mon portfolio", "photo portfolio"],
        url: "https://jcphotographie276.github.io/portfolio/",
        local: false,
        label: "Portfolio"
    }
};

let mydlpDataCache = null;
let ludothequeDataCache = null;
let portfolioDataCache = null;

function readFirestoreField(value) {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (Object.prototype.hasOwnProperty.call(value, "stringValue")) {
        return value.stringValue;
    }

    if (Object.prototype.hasOwnProperty.call(value, "integerValue")) {
        return Number(value.integerValue);
    }

    if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) {
        return Number(value.doubleValue);
    }

    if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) {
        return Boolean(value.booleanValue);
    }

    if (Object.prototype.hasOwnProperty.call(value, "arrayValue")) {
        const items = value.arrayValue?.values || [];
        return items.map(readFirestoreField);
    }

    if (Object.prototype.hasOwnProperty.call(value, "mapValue")) {
        const fields = value.mapValue?.fields || {};
        const result = {};
        Object.entries(fields).forEach(([key, fieldValue]) => {
            result[key] = readFirestoreField(fieldValue);
        });
        return result;
    }

    return value;
}

function normalizeSiteTitleText(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizeMydlpText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\-_'’]/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const MYDLP_ATTRACTION_ALIASES = {
    "Frozen Ever After": ["frozen ever after", "frozen", "ever after", "everafter"],
    "Big Thunder Mountain": ["big thunder mountain", "big thunder", "btm", "thunder mountain"],
    "Hyperspace Mountain": ["hyperspace mountain", "space mountain", "space", "hyper space mountain"],
    "Indiana Jones et le Temple du Péril": ["indiana jones", "indiana jones et le temple du peril", "indiana jones et le temple du péril", "indiana"],
    "Pirates of the Caribbean": ["pirates of the caribbean", "pirates", "pirates du caribbean", "pirates of caribbean"],
    "Buzz Lightyear Laser Blast": ["buzz lightyear", "buzz lightyear laser blast", "buzz"],
    "Dumbo the Flying Elephant": ["dumbo", "dumbo the flying elephant"],
    "it's a small world": ["its a small world", "it's a small world", "small world", "small world attraction"],
    "Star Tours : L'Aventure Continue": ["star tours", "star tours l aventure continue", "star tours adventure continue"],
    "Avengers Assemble: Flight Force": ["flight force", "avengers flight force", "avengers assemble flight force", "flightforce"],
    "Spider-Man W.E.B. Adventure": ["spider man web adventure", "web adventure", "web"],
    "Crush's Coaster": ["crush coaster", "crushs coaster", "crush"],
    "Peter Pan's Flight": ["peter pan", "peter pan flight", "peter pan's flight", "peter pan s flight"],
    "Thunder Mesa Riverboat Landing": ["thunder mesa", "thunder mesa riverboat landing"],
    "Phantom Manor": ["phantom manor", "phantom"],
    "Mad Hatter's Tea Cups": ["mad hatter tea cups", "mad hatter", "mad hatter s tea cups"],
    "Casey Jr. Le Petit Train du Cirque": ["casey jr", "casey jr le petit train du cirque", "casey jr le petit train du cirque"],
    "La Cabane des Robinson": ["cabane des robinson", "la cabane des robinson", "robinson"],
    "Les Mystères du Nautilus": ["nautilus", "les mysteres du nautilus", "les mystères du nautilus"],
    "Le Carrousel de Lancelot": ["carrousel de lancelot", "lancelot", "le carrousel de lancelot"],
    "Autopia": ["autopia"],
    "Disneyland Railroad": ["disneyland railroad", "railroad", "le train"],
    "Les Voyages de Pinocchio": ["pinocchio", "les voyages de pinocchio"],
    "Orbitron": ["orbitron"],
    "Le Labyrinthe d'Alice": ["labyrinthe d alice", "labyrinthe d alice", "alice", "le labyrinthe d alice"],
    "Blanche-Neige et les Sept Nains": ["blanche neige", "blanche neige et les sept nains", "blanche neige et les 7 nains", "blanche neige et les sept nains"],
    "Le Passage Enchanté d'Aladdin": ["le passage enchante d aladdin", "passage enchante d aladdin", "aladdin", "le passage enchanté d aladdin"],
    "Le Pays des Contes de Fées": ["contes de fees", "contes de fées", "le pays des contes de fees", "pays des contes de fees"],
    "The Tower of Terror": ["tower of terror", "tower terror", "tower", "la tour des terror"],
    "Ratatouille": ["ratatouille", "ratatouille aventure"],
    "Cars ROAD TRIP": ["cars road trip", "cars roadtrip", "cars"],
    "Cars Quatre Roues Rallye": ["cars quatre roues", "cars quatre roues rallye", "cars quatres roues", "cars 4 roues"],
    "Les Tapis Volants": ["les tapis volants", "tapis volants"],
    "Raiponce Tangled Spin": ["raiponce tangles spin", "raiponce spin", "raiponce"],
    "RC Racer": ["rc racer", "rc"],
    "Slinky Dog Zigzag Spin": ["slinky dog zigzag spin", "slinky dog", "zigzag spin"],
    "Toy Soldiers Parachute Drop": ["toy soldiers", "toy soldiers parachute drop", "parachute drop"]
};

function findMydlpAttractionInText(text) {
    const normalizedText = normalizeMydlpText(text);

    if (!normalizedText) {
        return null;
    }

    const mapped = Object.entries(MYDLP_ATTRACTION_ALIASES);

    for (const [canonicalName, aliases] of mapped) {
        const variants = new Set([canonicalName, ...aliases].map(normalizeMydlpText).filter(Boolean));

        for (const variant of variants) {
            if (normalizedText.includes(variant)) {
                return canonicalName;
            }
        }
    }

    for (const [canonicalName, aliases] of mapped) {
        const trimmedText = normalizedText.replace(/\b(ja|j ai|j ai|jai|j ai|j ai)\b/g, "");
        const candidate = normalizeMydlpText(canonicalName);

        if (trimmedText.includes(candidate)) {
            return canonicalName;
        }

        for (const alias of aliases) {
            const normalizedAlias = normalizeMydlpText(alias);
            if (normalizedAlias && trimmedText.includes(normalizedAlias)) {
                return canonicalName;
            }
        }
    }

    return null;
}

function detectMydlpAttractionQuestion(command) {
    const normalized = normalizeCommandText(command || "");

    if (!normalized) {
        return null;
    }

    const attractionName = findMydlpAttractionInText(normalized);
    if (!attractionName) {
        return null;
    }

    const questions = /(combien|fois|nombre|total|temps|jai fait|j ai fait|fait.*combien|fait.*fois|fais.*combien|fais.*fois|how many|how often|times)/i;
    if (!questions.test(normalized)) {
        return null;
    }

    return attractionName;
}

function countMydlpAttractionVisits(data, attractionName) {
    if (!data || typeof data !== "object") {
        return 0;
    }

    const targetName = normalizeMydlpText(attractionName || "");
    if (!targetName) {
        return 0;
    }

    let count = 0;

    Object.values(data).forEach(day => {
        if (!day || typeof day !== "object") {
            return;
        }

        Object.values(day).forEach(entry => {
            if (!entry) {
                return;
            }

            const extractedText = typeof entry === "string"
                ? entry
                : entry.name || entry.id || entry.attraction || entry.title || entry.label || "";

            const normalizedEntry = normalizeMydlpText(extractedText);
            if (!normalizedEntry) {
                return;
            }

            const matches = Object.entries(MYDLP_ATTRACTION_ALIASES).some(([canonicalName, aliases]) => {
                const canonicalNormalized = normalizeMydlpText(canonicalName);
                if (canonicalNormalized === targetName || normalizedEntry.includes(canonicalNormalized) || targetName.includes(canonicalNormalized)) {
                    return true;
                }

                return aliases.some(alias => {
                    const normalizedAlias = normalizeMydlpText(alias);
                    return normalizedEntry.includes(normalizedAlias) && (normalizedAlias.length > 2 || targetName.includes(normalizedAlias));
                });
            });

            if (matches) {
                count += 1;
            }
        });
    });

    return count;
}

async function fetchJsonFromUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.warn("Impossible de lire la donnée distante :", url, error);
        return null;
    }
}

async function loadDlpStats() {
    if (mydlpDataCache) {
        return mydlpDataCache;
    }

    const url = "https://my-disneyland-paris-default-rtdb.europe-west1.firebasedatabase.app/planning/activities.json";
    let data = await fetchJsonFromUrl(url);

    if (!data || typeof data !== "object") {
        data = await loadDlpStatsFromFirebase();
    }

    if (!data || typeof data !== "object") {
        mydlpDataCache = { totalActivities: 0, frozenCount: 0, missing: true };
        return mydlpDataCache;
    }

    let frozenCount = 0;
    let totalActivities = 0;

    Object.values(data).forEach(day => {
        if (!day || typeof day !== "object") {
            return;
        }

        Object.values(day).forEach(entry => {
            totalActivities += 1;

            const normalizedEntry = typeof entry === "string"
                ? entry
                : (entry && typeof entry === "object" ? (entry.id || entry.name || "") : "");

            const text = normalizeSiteTitleText(normalizedEntry).toLowerCase();
            if (text.includes("frozen") || text.includes("ever after")) {
                frozenCount += 1;
            }
        });
    });

    mydlpDataCache = {
        totalActivities,
        frozenCount,
        missing: false,
        data
    };

    return mydlpDataCache;
}

async function loadLudothequeStats() {
    if (ludothequeDataCache) {
        return ludothequeDataCache;
    }

    const endpoint = "https://firestore.googleapis.com/v1/projects/jeux-societe-d11a9/databases/(default)/documents/games";
    const data = await fetchJsonFromUrl(endpoint);

    const documents = Array.isArray(data?.documents) ? data.documents : [];
    const games = documents.map(doc => {
        const fields = doc.fields || {};
        const normalized = {};

        Object.entries(fields).forEach(([key, value]) => {
            normalized[key] = readFirestoreField(value);
        });

        return normalized;
    });

    ludothequeDataCache = {
        total: games.length,
        names: games.map(game => game.name || game.titre || "Jeu sans nom").filter(Boolean),
        missing: games.length === 0
    };

    return ludothequeDataCache;
}

async function loadPortfolioStats() {
    if (portfolioDataCache) {
        return portfolioDataCache;
    }

    const endpoint = "https://firestore.googleapis.com/v1/projects/jade-photographie/databases/(default)/documents/photos";
    const data = await fetchJsonFromUrl(endpoint);

    const documents = Array.isArray(data?.documents) ? data.documents : [];
    const photos = documents.map(doc => {
        const fields = doc.fields || {};
        const normalized = {};

        Object.entries(fields).forEach(([key, value]) => {
            normalized[key] = readFirestoreField(value);
        });

        return normalized;
    });

    portfolioDataCache = {
        total: photos.length,
        titleList: photos.map(photo => photo.title || photo.name || photo.titre || "Photo sans titre").filter(Boolean),
        missing: photos.length === 0
    };

    return portfolioDataCache;
}

async function answerSiteFact(command) {
    const normalized = normalizeCommandText(command || "");

    if (!normalized) {
        return null;
    }

    const attractionName = detectMydlpAttractionQuestion(normalized);
    const asksForCount = /(combien|fois|nombre|total|temps|jai fait|j ai fait|fait.*combien|fait.*fois|how many|how often|times)/i.test(normalized);

    if (attractionName && asksForCount) {
        const stats = await loadDlpStats();

        if (stats && !stats.missing) {
            const rawData = stats.data || {};
            const exactCount = countMydlpAttractionVisits(rawData, attractionName);
            const count = Number.isFinite(exactCount) ? exactCount : 0;
            const label = attractionName === "Frozen Ever After" ? "Frozen Ever After" : attractionName;

            return {
                type: "answer",
                reply: `Tu as fait ${label} ${count} fois. 🎢`
            };
        }

        return {
            type: "open",
            site: "mydlp",
            reply: `J'ouvre MyDLP pour vérifier ${attractionName}. Je n’ai pas encore accès aux données depuis mon navigateur. 🎢`
        };
    }

    if (/(combien de|combien d|nombre de|total).*(jeu|jeux|societe|société)/.test(normalized) || /(jeu|jeux).*(combien|total|nombre)/.test(normalized)) {
        const stats = await loadLudothequeStats();

        if (stats && !stats.missing) {
            return {
                type: "answer",
                reply: `Tu as ${stats.total} jeux dans ta ludothèque. 🎲`
            };
        }

        return {
            type: "open",
            site: "ludotheque",
            reply: "J'ouvre ta ludothèque. Je n’ai pas encore accès aux données pour te donner ce total depuis mon navigateur. 🎲"
        };
    }

    if (/(frozen|ever after|everafter)/.test(normalized) && /(combien|fois|nombre)/.test(normalized)) {
        const stats = await loadDlpStats();

        if (stats && !stats.missing) {
            return {
                type: "answer",
                reply: `Tu as fait Frozen Ever After ${stats.frozenCount} fois. 🎢`
            };
        }

        return {
            type: "open",
            site: "mydlp",
            reply: "J'ouvre MyDLP. Je n’ai pas encore accès aux données de cette attraction depuis mon navigateur. 🎢"
        };
    }

    if (/portfolio/.test(normalized) && /(combien|nombre|total|photos?)/.test(normalized)) {
        const stats = await loadPortfolioStats();

        if (stats && !stats.missing) {
            return {
                type: "answer",
                reply: `Tu as ${stats.total} photos dans ton portfolio. 📸`
            };
        }

        return {
            type: "open",
            site: "portfolio",
            reply: "J'ouvre ton portfolio. Je n’ai pas encore accès aux données depuis mon navigateur. 📸"
        };
    }

    return null;
}

function getSiteDefinitionFromCommand(command) {
    const normalized = normalizeCommandText(command || "");

    if (!normalized) {
        return null;
    }

    const siteEntries = Object.entries(siteCatalog);

    for (const [siteName, siteInfo] of siteEntries) {
        const match = siteInfo.aliases.some(alias => normalized.includes(alias));

        if (match) {
            return {
                siteName,
                siteInfo
            };
        }
    }

    return null;
}

function buildSiteNavigationResult(command) {
    const normalized = normalizeCommandText(command || "");

    if (!normalized) {
        return null;
    }

    const siteMatch = getSiteDefinitionFromCommand(command);

    if (!siteMatch) {
        return null;
    }

    const { siteName, siteInfo } = siteMatch;

    const rawQuery = String(command || "")
        .replace(new RegExp(siteInfo.aliases.join("|"), "gi"), "")
        .replace(/(?:ouvre|ouvrir|va sur|vas sur|aller sur|lance|go|peux tu ouvrir|peut tu ouvrir|tu peux ouvrir|peux tu|peut tu|tu peux|montre|affiche|voir|regarde|cherche|recherche|trouve|trouver)/gi, "")
        .replace(/(?:combien de|combien d|quand|quel|quelle|ou|où|dans|sur|pour|de|a propos de|au sujet de)/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    const query = rawQuery || null;

    if (siteName === "mydlp" && /frozen|ever after|everafter/.test(normalized)) {
        return {
            action: "site_navigation",
            target: "mydlp",
            query: "Frozen Ever After",
            reply: "Je vais ouvrir MyDLP et aller voir Frozen Ever After. 🎢"
        };
    }

    if (siteName === "ludotheque" && /(combien de|combien d|nombre de|total).*(jeu|jeux|societe|société)/.test(normalized)) {
        return {
            action: "site_navigation",
            target: "ludotheque",
            query: "total jeux",
            reply: "Je vais ouvrir ta ludothèque pour vérifier le nombre total de jeux. 🎲"
        };
    }

    if (siteName === "mydlp" && /(combien de|combien d|nombre de|total|fois|nombre de fois).*(frozen|ever after|everafter)/.test(normalized)) {
        return {
            action: "site_navigation",
            target: "mydlp",
            query: "Frozen Ever After",
            reply: "Je vais ouvrir MyDLP et vérifier combien de fois tu as fait Frozen Ever After. 🎢"
        };
    }

    return {
        action: "site_navigation",
        target: siteName,
        query,
        reply: `J'ouvre ${siteInfo.label}. 🚀`
    };
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

    if (action === "agenda_control") {
        showSection("agendaSection");

        if (result.command === "open") {
            return result.reply || "J'ouvre ton agenda. 📅";
        }

        if (result.command === "list") {
            renderAgendaUpcoming();
            return result.reply || getAgendaSummary();
        }

        if (result.command === "create_reminder") {
            const reminder = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                title: String(result.title || "Rappel").trim(),
                type: "reminder",
                date: String(result.date || getAgendaDateKey(new Date())),
                startTime: String(result.time || "09:00"),
                endTime: "",
                recurring: false,
                recurrenceEnd: "",
                excludedDates: [],
                description: "Créé par JARVIS"
            };

            agendaItems.push(reminder);
            saveAgendaItems();
            renderAgendaCalendar();
            renderAgendaUpcoming();
            requestAgendaNotificationPermission();
            return `C'est noté : rappel « ${reminder.title} » le ${formatAgendaDate(reminder.date)}${formatAgendaTime(reminder.startTime)}. 🔔`;
        }
    }


    if (action === "site_navigation") {
        const siteName = String(result.target || "").toLowerCase().trim();
        const siteInfo = siteCatalog[siteName];

        if (!siteInfo) {
            return "Je ne connais pas ce site. 🤔";
        }

        if (siteInfo.local) {
            if (siteInfo.section) {
                showSection(siteInfo.section);
            }
            return result.reply || `J'ouvre ${siteInfo.label}. 🚀`;
        }

        let finalUrl = siteInfo.url;
        const query = String(result.query || "").trim();

        if (query && siteInfo.searchParam) {
            finalUrl = `${siteInfo.url}${siteInfo.searchParam}${encodeURIComponent(query)}`;
        }

        window.open(finalUrl, "_blank");

        return result.reply || `J'ouvre ${siteInfo.label}. 🚀`;
    }

    /* ======================================
       OUVRIR UN SITE
    ====================================== */

    if (action === "open_website") {

        const websites = {
            youtube: "https://www.youtube.com/",
            mydlp: "https://quentwax.github.io/My-DLP/index.html",
            ludotheque: "https://quentwax.github.io/jeux_societe/",
            github: "https://github.com/quentwax",
            portfolio: "https://jcphotographie276.github.io/portfolio/",
            discord: {
                app: "discord://",
                web: "https://discord.com/app"
            },
            whatsapp: {
                app: "whatsapp://",
                web: null
            },
            spotify: {
                app: "spotify://",
                web: null
            },
            steam: {
                app: "steam://rungameid/570",
                web: null
            },
            rainbowsix: {
                app: "steam://rungameid/359550",
                web: null
            },
            epicgames: {
                app: "com.epicgames.launcher://",
                web: null
            },
            uwamp: {
                app: "http://localhost/",
                web: null
            }
        };

        const target =
            String(result.target || "")
                .toLowerCase()
                .trim();

        if (!websites[target]) {
            return "Je ne connais pas ce site. 🤔";
        }

        const targetUrl = websites[target];

        if (typeof targetUrl === "string") {
            window.open(targetUrl, "_blank");
            return result.reply || "J'ouvre ça. 🚀";
        }

        try {
            window.location.href = targetUrl.app;
        } catch (error) {
            console.warn("Impossible d'ouvrir l'application locale, tentative sans fallback web :", error);
        }

        return result.reply || "J'ouvre ça. 🚀";
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
                "homeSection"
            );

            document.querySelector(".music-widget")?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


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

            if (command === "play") {
                if (result.query) {
                    const playback = await playSpotifySearchResult(result.query);

                    return playback.started
                        ? (result.reply || `Je lance ${result.query}. 🎵`)
                        : playback.reason === "no_results"
                            ? "Je n'ai trouvé aucun résultat pour ce titre sur Spotify. Vérifie le nom ou l'artiste. 🔎"
                            : playback.reason === "device_not_ready"
                                ? "Le lecteur Spotify n'est pas prêt. Réessaie dans un instant ou reconnecte Spotify. 🎵"
                                : playback.reason === "playback_rejected"
                                    ? "Spotify a trouvé le titre, mais a refusé de le lire. Vérifie que ton compte Premium est actif et que MyHub est bien le lecteur actif. ⚠️"
                                    : `La recherche Spotify a échoué${playback.status ? ` (HTTP ${playback.status})` : ""}. Reconnecte Spotify puis réessaie. ⚠️`;
                }

                    await spotifyPlayer.resume();

                return (
                    result.reply ||
                    "Je relance la lecture. ▶️"
                );
            }

            if (command === "theme") {
                const started = await playSpotifyTheme(result.query);

                return started
                    ? (result.reply || `Je lance une sélection aléatoire ${result.query}. 🎵`)
                    : `Je n'ai pas trouvé assez de musique ${result.query} sur Spotify. 🔎`;
            }

            if (command === "playlist" || command === "playlist_search") {
                const started = await playSpotifyPlaylistSearch(result.query);

                return started
                    ? (result.reply || `Je lance la playlist ${result.query}. 🎵`)
                    : "Je n'ai pas trouvé cette playlist sur Spotify. 🔎";
            }

            if (command === "pause") {
                await spotifyPlayer.pause();

                return (
                    result.reply ||
                    "Je mets Spotify en pause. ⏸️"
                );
            }

            if (command === "volume") {
                const volume = Math.min(100, Math.max(0, Number(result.volume)));

                if (!Number.isFinite(volume)) {
                    return "Indique-moi un volume entre 0 et 100 %. 🔊";
                }

                await setSpotifyVolume(volume);

                return (
                    result.reply ||
                    `Volume Spotify réglé à ${Math.round(volume)} %. 🔊`
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

    const normalized = String(command || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[-_]/g, " ")
        .replace(/[?!.,;:]/g, " ")
        .replace(/\bmy\s+dlp\b/g, "mydlp")
        .replace(/\s+/g, " ")
        .trim();

    return normalized;
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

function getRandomReply(options) {
    if (!Array.isArray(options) || options.length === 0) {
        return "Bien sûr. 🤖";
    }

    return options[Math.floor(Math.random() * options.length)];
}

function getLocalFallbackReply(command) {

    const normalized = normalizeCommandText(command);

    if (!normalized) {
        return null;
    }

    if (/(bonjour|salut|bonsoir|hey|coucou)/.test(normalized)) {
        return getRandomReply([
            "Bonjour ! Je suis Jarvis, ravi de te revoir.",
            "Salut ! Je suis prêt à t'aider avec plaisir.",
            "Bonsoir. Je suis Jarvis, en ligne et à l'écoute.",
            "Bonjour Monsieur. Que puis-je faire pour vous ?"
        ]);
    }

    if (/(qui es tu|qui tu es|presente toi|présente toi|qui est jarvis)/.test(normalized)) {
        return getRandomReply([
            "Je suis Jarvis, ton assistant personnel, conçu pour te simplifier la vie sur MyHub.",
            "Je suis Jarvis, ton aide perso. Je gère ton espace MyHub et je peux t'aider à naviguer, gérer des rappels et plus encore.",
            "Je suis Jarvis, ton assistant discret et efficace. Tu peux me demander ce que tu veux, quand tu veux."
        ]);
    }

    if (/(merci|thanks|thank you)/.test(normalized)) {
        return getRandomReply([
            "Avec plaisir Monsieur.",
            "De rien. Je suis là pour ça.",
            "Tout le plaisir est pour moi.",
            "Pas de souci, à votre service.",
            "Avec plaisir, Monsieur."
        ]);
    }

    if (/(quelle heure|heure qu'il est|il est quelle heure|donne l'heure|heure actuelle)/.test(normalized)) {
        const now = new Date();
        return getRandomReply([
            `Il est actuellement ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. ⏰`,
            `On est à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
            `Il est ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`
        ]);
    }

    if (/(quelle date|date d'aujourd'hui|date du jour|on est quel jour|donne la date)/.test(normalized)) {
        const now = new Date();
        const date = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        return getRandomReply([
            `Nous sommes le ${date}. 📅`,
            `Aujourd'hui, on est ${date}.`,
            `La date du jour est ${date}.`
        ]);
    }

    if (/(meteo|météo|temps|temperature|pluie|soleil|nuage|orage)/.test(normalized)) {
        return getWeatherReply();
    }

    if (/(comment ca va|ça va|ca va|comment tu vas|comment vas tu|vas tu bien)/.test(normalized)) {
        return getRandomReply([
            "Je vais très bien, merci. Et toi ?",
            "Très bien, merci. Toujours prêt pour la suite.",
            "Au top, comme un assistant bien en forme."
        ]);
    }

    if (/(tu es la|tu es là|tu es present|tu es présent)/.test(normalized)) {
        return getRandomReply([
            "Toujours là, Monsieur. Je suis prêt à vous aider.",
            "Oui, je suis bien là. Que puis-je faire pour vous ?",
            "Je suis là, comme toujours."
        ]);
    }

    return null;
}

function getLocalSpotifyAction(command) {
    const normalized = normalizeCommandText(command);

    if (!/(spotify|musique|chanson|morceau|playlist|volume|pause|lecture|joue|lis|ecoute|entendre|mets|mettre|passe|cherche|recherche|trouve|trouver|veux|voudrais|aimerais|disney|pixar|marvel|star wars)/.test(normalized)) {
        return null;
    }

    if (["spotify", "musique", "ouvre spotify", "ouvrir spotify", "ouvre la musique", "ouvrir la musique"].includes(normalized)) {
        return {
            action: "spotify_control",
            command: "open",
            reply: "J'ouvre le lecteur Spotify. 🎵"
        };
    }

    const volumeMatch = normalized.match(/(?:volume|son)\s*(?:a|à|de|sur)?\s*(\d{1,3})\s*(?:%|pourcent|pour cent)?/);

    if (volumeMatch) {
        const volume = Math.min(100, Math.max(0, Number(volumeMatch[1])));

        return {
            action: "spotify_control",
            command: "volume",
            volume,
            reply: `Volume Spotify réglé à ${volume} %. 🔊`
        };
    }

    if (/(passe|passer|suivante|suivant|prochaine|prochain)/.test(normalized) && !/(ne passe pas|ne passer pas)/.test(normalized)) {
        return {
            action: "spotify_control",
            command: "next",
            reply: "Je passe au morceau suivant. ⏭️"
        };
    }

    if (/(precedente|précédente|precedent|précédent|retourne|reviens)/.test(normalized)) {
        return {
            action: "spotify_control",
            command: "previous",
            reply: "Je reviens au morceau précédent. ⏮️"
        };
    }

    if (/(playlist|liste de lecture)/.test(normalized)) {
        const query = normalized
            .replace(/\b(?:spotify|musique|cherche|recherche|trouve|une|la|le|les|playlist|playlists|liste|de|lecture|moi|ma|mes|lance|lancer|joue|jouer|lis|lire|sur)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return {
            action: "spotify_control",
            command: "playlist",
            query: query || "mes playlists",
            reply: query ? `Je cherche la playlist ${query} sur Spotify. 🔎` : "Je cherche tes playlists Spotify. 🔎"
        };
    }

    if (/(disney|pixar|marvel|star wars)/.test(normalized) &&
        /(joue|jouer|mets|met|mettre|lance|lancer|musique|chanson|morceau|titre|écoute|ecoute|veux|voudrais|aimerais)/.test(normalized)) {
        const theme = normalized.match(/disney|pixar|marvel|star wars/)?.[0] || "disney";

        return {
            action: "spotify_control",
            command: "theme",
            query: theme,
            reply: `Je lance une sélection aléatoire ${theme} sur Spotify. 🎲`
        };
    }

    if (/(mets|met|mettre|mettre en|pause|arrete|arrête|stoppe|stop)/.test(normalized) && /pause|stop|arrete|arrête/.test(normalized)) {
        return {
            action: "spotify_control",
            command: "pause",
            reply: "Je mets Spotify en pause. ⏸️"
        };
    }

    if (/(reprends|reprend|relance|resume|lecture|joue|jouer|lis|lire|ecoute|entendre|mets|met|mettre|cherche|recherche|trouve|trouver|veux|voudrais|aimerais|peux tu|pourrais tu|play)/.test(normalized)) {
        const query = normalized
            .replace(/^(?:(?:s il te plait|s il vous plait)\s+)?(?:(?:est ce que\s+)?tu peux\s+|pourrais tu\s+|peux tu\s+|je veux\s+|je voudrais\s+|j aimerais\s+|j aimerai\s+)?(?:me\s+)?(?:faire\s+)?(?:ecouter|entendre|reprends|reprend|relance|resume|lecture|joue|jouer|lis|lire|play|lance|lancer|mets|met|mettre)\s+/i, "")
            .replace(/^(?:je veux|je voudrais|j aimerais|j aimerai)\s+(?:(?:une|la|le)\s+)?(?:chanson|morceau|titre)\s+(?:de\s+)?/i, "")
            .replace(/^(?:cherche|recherche|trouve|trouver)\s+(?:(?:moi|une|la|le|un)\s+)?(?:(?:chanson|morceau|titre)\s+(?:de\s+)?)?/i, "")
            .replace(/^(?:(?:moi|me)\s+)?(?:(?:une|la|le|un)\s+)?(?:chanson|morceau|titre)\s+(?:de\s+)?/i, "")
            .replace(/^(?:moi|me)\s+/i, "")
            .replace(/\b(?:spotify|sur spotify|s il te plait|s il vous plait)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return {
            action: "spotify_control",
            command: "play",
            query: query || null,
            reply: query ? `Je cherche ${query} sur Spotify. 🔎` : "Je relance la lecture. ▶️"
        };
    }

    if (/(active|ouvre|ouvrir|lance|lancer|affiche)/.test(normalized) && /spotify|musique/.test(normalized)) {
        return {
            action: "spotify_control",
            command: "open",
            reply: "J'ouvre le lecteur Spotify. 🎵"
        };
    }

    return null;
}

function getLocalQuickAction(command) {

    const normalized =
        normalizeCommandText(command);

    if (!normalized) {
        return null;
    }

    const agendaAction = getLocalAgendaAction(command);

    if (agendaAction) {
        return agendaAction;
    }

    const spotifyAction = getLocalSpotifyAction(command);

    if (spotifyAction) {
        return spotifyAction;
    }

    const websiteAliases = {

        myhub: {
            target: "myhub",
            reply: "J'ouvre MyHub. 🏠"
        },

        portfolio: {
            target: "portfolio",
            reply: "J'ouvre ton portfolio. 🖼️"
        },

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

        discord: {
            target: "discord",
            reply: "J'ouvre Discord. 💬"
        },

        whatsapp: {
            target: "whatsapp",
            reply: "J'ouvre WhatsApp. 💬"
        },

        spotify: {
            target: "spotify",
            reply: "J'ouvre Spotify. 🎵"
        },

        steam: {
            target: "steam",
            reply: "J'ouvre Steam. 🎮"
        },

        rainbowsix: {
            target: "rainbowsix",
            reply: "J'ouvre Rainbow Six Siege. 🔫"
        },

        epicgames: {
            target: "epicgames",
            reply: "J'ouvre Epic Games. 🎮"
        },

        uwamp: {
            target: "uwamp",
            reply: "J'ouvre UwAmp. 🖥️"
        }
    };

    for (const [siteName, siteData] of Object.entries(websiteAliases)) {

        const aliasPatterns = new Set([
            siteName,
            siteName.replace(/\s+/g, ""),
            siteName === "mydlp" ? "my dlp" : siteName,
            siteName === "mydlp" ? "ouvre my dlp" : `ouvre ${siteName}`,
            siteName === "mydlp" ? "ouvrir my dlp" : `ouvrir ${siteName}`,
            siteName === "mydlp" ? "va sur my dlp" : `va sur ${siteName}`,
            siteName === "mydlp" ? "vas sur my dlp" : `vas sur ${siteName}`,
            siteName === "mydlp" ? "aller sur my dlp" : `aller sur ${siteName}`,
            siteName === "mydlp" ? "lance my dlp" : `lance ${siteName}`,
            siteName === "mydlp" ? "go my dlp" : `go ${siteName}`,
            siteName === "mydlp" ? "peux tu ouvrir my dlp" : `peux tu ouvrir ${siteName}`,
            siteName === "mydlp" ? "peut tu ouvrir my dlp" : `peut tu ouvrir ${siteName}`,
            siteName === "mydlp" ? "tu peux ouvrir my dlp" : `tu peux ouvrir ${siteName}`,
            siteName === "mydlp" ? "peux tu my dlp" : `peux tu ${siteName}`,
            siteName === "mydlp" ? "peut tu my dlp" : `peut tu ${siteName}`,
            siteName === "mydlp" ? "tu peux my dlp" : `tu peux ${siteName}`,
            siteName === "mydlp" ? "ouvre le site my dlp" : `ouvre le site ${siteName}`,
            siteName === "mydlp" ? "ouvrir le site my dlp" : `ouvrir le site ${siteName}`,
            siteName === "mydlp" ? "va sur le site my dlp" : `va sur le site ${siteName}`,
            siteName === "mydlp" ? "vas sur le site my dlp" : `vas sur le site ${siteName}`,
            siteName === "rainbowsix" ? "rainbow six siege" : siteName,
            siteName === "rainbowsix" ? "rainbow six" : siteName,
            siteName === "rainbowsix" ? "r6" : siteName,
            siteName === "epicgames" ? "epic games" : siteName,
            siteName === "uwamp" ? "uw amp" : siteName,
            siteName === "steam" ? "steam" : siteName,
            siteName === "steam" ? "lance steam" : siteName
        ]);

        const directPatterns = Array.from(aliasPatterns);

        if (directPatterns.includes(normalized)) {
            return {
                action: "open_website",
                target: siteData.target,
                reply: siteData.reply
            };
        }

        const keywordMatches = [
            siteName,
            siteName.replace(/\s+/g, ""),
            siteName === "rainbowsix" ? "rainbow six siege" : "",
            siteName === "rainbowsix" ? "rainbow six" : "",
            siteName === "rainbowsix" ? "r6" : "",
            siteName === "epicgames" ? "epic games" : "",
            siteName === "uwamp" ? "uw amp" : "",
            siteName === "steam" ? "steam" : "",
            siteName === "whatsapp" ? "whats app" : "",
            siteName === "spotify" ? "spotif" : ""
        ].filter(Boolean);

        const genericOpenPattern =
            /(?:ouvre|ouvrir|va sur|vas sur|aller sur|lance|go|peux tu ouvrir|peut tu ouvrir|tu peux ouvrir|peux tu|peut tu|tu peux)/
            .test(normalized) &&
            keywordMatches.some(keyword => normalized.includes(keyword));

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
        myhub: "home",
        jarvis: "jarvis",
        mydlp: "mydlp",
        ludotheque: "ludotheque",
        musique: "music",
        music: "music",
        parametres: "settings",
        settings: "settings",
        portfolio: "home"
    };

    const routedSiteCommand = buildSiteNavigationResult(command);

    if (routedSiteCommand) {
        return {
            action: "site_navigation",
            target: routedSiteCommand.target,
            query: routedSiteCommand.query,
            reply: routedSiteCommand.reply
        };
    }

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

function cleanWebSearchResult(text) {
    return String(text || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\s+\|\s+/g, " ")
        .replace(/\s+[-–—]\s+/g, " ")
        .replace(/\s+\(.*?\)/g, " ")
        .replace(/\s+\[[^\]]*\]/g, " ")
        .replace(/\s+(?:et|ou|ainsi|donc|c'est|cela|ceci|également)\s+/gi, " ")
        .trim();
}

function shortenSearchAnswer(text, maxLength = 220) {
    const raw = cleanWebSearchResult(text);

    if (!raw) {
        return "";
    }

    const sentences = raw.split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);

    if (sentences.length > 0) {
        const firstSentence = sentences[0];

        if (firstSentence.length <= maxLength) {
            return firstSentence;
        }
    }

    const trimmed = raw.slice(0, maxLength).trim();
    const withoutTrailing = trimmed.replace(/[\s.,;:!?]+$/g, "");

    if (!withoutTrailing) {
        return raw;
    }

    return withoutTrailing.length < raw.length ? `${withoutTrailing}…` : withoutTrailing;
}

function normalizeSearchQueryForWeb(rawQuery) {
    const text = String(rawQuery || "")
        .trim()
        .replace(/^(?:cherche|recherche|trouve|trouver|look up|search)\s+/i, "")
        .replace(/^(?:quel(?:le)? est|qui est|qu'est ce que|qu est ce que|c'est quoi|c est quoi|ce que c'est|que veut dire|qu est ce que|what is|who is|who's|what's)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
        return "";
    }

    const englishFriendly = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\bnumero\b/gi, "number")
        .replace(/\bpokemon\b/gi, "Pokemon")
        .replace(/\bmeteo\b/gi, "weather")
        .replace(/\bcapitale\b/gi, "capital")
        .replace(/\bquel\b/gi, "what")
        .replace(/\bquelle\b/gi, "what")
        .replace(/\bcombien\b/gi, "how much")
        .replace(/\bc'est\b/gi, "is")
        .replace(/\bje veux savoir\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    return englishFriendly || text;
}

async function fetchJson(url) {
    try {
        const response = await fetch(url, {
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        return null;
    }
}

function extractDuckDuckGoAnswer(data) {
    const answerText = cleanWebSearchResult(data?.Answer || data?.AnswerText || "");
    if (answerText) {
        return answerText;
    }

    const abstractText = cleanWebSearchResult(data?.AbstractText || "");
    if (abstractText) {
        return abstractText;
    }

    const firstTopic = data?.RelatedTopics?.[0];
    const firstTopicText = cleanWebSearchResult(firstTopic?.Text || firstTopic?.Result || "");
    if (firstTopicText) {
        return firstTopicText;
    }

    const firstResult = data?.Results?.[0];
    const firstResultText = cleanWebSearchResult(firstResult?.Text || firstResult?.Result || "");
    if (firstResultText) {
        return firstResultText;
    }

    return null;
}

async function searchWikipediaSummary(query) {
    const safe = String(query || "").trim();

    if (!safe) {
        return null;
    }

    const endpoint = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(safe)}&format=json&origin=*&srlimit=1`;
    const results = await fetchJson(endpoint);
    const title = results?.query?.search?.[0]?.title;

    if (!title) {
        return null;
    }

    const summaryEndpoint = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryData = await fetchJson(summaryEndpoint);

    if (!summaryData) {
        return null;
    }

    const summaryText = cleanWebSearchResult(summaryData.extract || summaryData.description || "");
    if (summaryText) {
        return summaryText;
    }

    return null;
}

async function searchTheWeb(query) {
    const original = String(query || "").trim();

    if (!original) {
        return null;
    }

    const searchCandidates = [
        original,
        normalizeSearchQueryForWeb(original)
    ].filter(Boolean);

    const uniqueCandidates = [...new Set(searchCandidates)];

    for (const candidate of uniqueCandidates) {
        const ddgEndpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(candidate)}&format=json&no_redirect=1&no_html=1&skip_disambig=1&kl=fr-fr`;
        const ddgData = await fetchJson(ddgEndpoint);
        const ddgAnswer = extractDuckDuckGoAnswer(ddgData);

        if (ddgAnswer) {
            return shortenSearchAnswer(ddgAnswer);
        }

        const fallbackQuery = candidate
            .replace(/\bwhat\b/gi, "")
            .replace(/\bis\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        if (fallbackQuery) {
            const wikiAnswer = await searchWikipediaSummary(fallbackQuery);
            if (wikiAnswer) {
                return shortenSearchAnswer(wikiAnswer);
            }
        }
    }

    for (const candidate of uniqueCandidates) {
        const fallbackQuery = candidate
            .replace(/\bwhat\b/gi, "")
            .replace(/\bis\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        if (fallbackQuery) {
            const wikiAnswer = await searchWikipediaSummary(fallbackQuery);
            if (wikiAnswer) {
                return shortenSearchAnswer(wikiAnswer);
            }
        }
    }

    return null;
}

function getWebSearchQuery(command) {
    const input = String(command || "").trim();

    if (!input) {
        return null;
    }

    const withoutIntro = input
        .replace(/^(?:cherche|recherche|trouve|trouver|look up|search)\s+/i, "")
        .replace(/^(?:quel(?:le)? est|qui est|qu'est ce que|qu est ce que|c'est quoi|c est quoi|ce que c'est|que veut dire)\s+/i, "")
        .trim();

    return withoutIntro || input;
}

function shouldUseLocalWebSearch(command) {
    const normalized = normalizeCommandText(command);

    if (!normalized) {
        return false;
    }

    const searchPatterns = [
        /(cherche|recherche|trouve|trouver|look up|search)/,
        /(quel est|quelle est|qui est|qu'est ce que|qu est ce que|c'est quoi|c est quoi|que veut dire|combien de|combien d|combien)/
    ];

    const ignoredPatterns = [
        /(meteo|météo|temperature|heure|date|minuteur|timer|youtube|spotify|mydlp|ludotheque|github|portfolio|discord|whatsapp|bonjour|merci|salut|ca va|comment tu vas)/
    ];

    if (ignoredPatterns.some(pattern => pattern.test(normalized))) {
        return false;
    }

    return searchPatterns.some(pattern => pattern.test(normalized));
}


/* ==========================================
   COMMUNICATION AVEC LE WORKER GEMINI
========================================== */

let geminiCooldownUntil = 0;
let isJarvisOffline = false;

function getJarvisOfflineReply(command) {
    const localReply = getLocalFallbackReply(command);

    if (localReply) {
        return localReply;
    }

    return "Jarvis est en mode local pour le moment. Je peux quand même t'aider pour l'heure, le minuteur, la météo, l'ouverture des sites ou MyDLP. 🤖";
}

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
    if (isJarvisOffline || Date.now() < geminiCooldownUntil) {
        return {
            action: "none",
            reply: getJarvisOfflineReply(command)
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
                .slice(-30)
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
                                historyToSend,

                            memory:
                                jarvisLongTermMemory.slice(-30)

                        })
                }
            );

        isJarvisOffline = false;


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
            } else if ([500, 502, 503, 504, 429].includes(response.status)) {
                geminiCooldownUntil = Date.now() + 30000;
                isJarvisOffline = true;
            }

            const offlineFallback = getJarvisOfflineReply(command) || errorMessage;

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

            return {

                action:
                    "none",

                reply:
                    offlineFallback
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

        isJarvisOffline = false;

        return result;


    } catch (error) {

        console.error(
            "Erreur communication JARVIS :",
            error
        );

        isJarvisOffline = true;
        geminiCooldownUntil = Date.now() + 30000;

        return {

            action:
                "none",

            reply:
                getJarvisOfflineReply(command)
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


    const structuredDataReply = await answerSiteFact(command);

    if (structuredDataReply) {
        if (structuredDataReply.type === "answer") {
            addMessage("JARVIS", structuredDataReply.reply, "jarvis");
            speakJarvisReply(structuredDataReply.reply);
            addToJarvisHistory("user", command);
            addToJarvisHistory("model", structuredDataReply.reply);

            if (jarvisSend) {
                jarvisSend.disabled = false;
            }

            if (jarvisInput) {
                jarvisInput.focus();
            }

            return;
        }

        const openResult = await executeJarvisAction({
            action: "site_navigation",
            target: structuredDataReply.site,
            query: "",
            reply: structuredDataReply.reply
        });

        addMessage("JARVIS", openResult, "jarvis");
        speakJarvisReply(openResult);
        addToJarvisHistory("user", command);
        addToJarvisHistory("model", openResult);

        if (jarvisSend) {
            jarvisSend.disabled = false;
        }

        if (jarvisInput) {
            jarvisInput.focus();
        }

        return;
    }

    const mydlpDirectAnswer = await answerSiteFact(command);
    if (mydlpDirectAnswer) {
        if (mydlpDirectAnswer.type === "answer") {
            addMessage("JARVIS", mydlpDirectAnswer.reply, "jarvis");
            speakJarvisReply(mydlpDirectAnswer.reply);
            addToJarvisHistory("user", command);
            addToJarvisHistory("model", mydlpDirectAnswer.reply);

            if (jarvisSend) {
                jarvisSend.disabled = false;
            }

            if (jarvisInput) {
                jarvisInput.focus();
            }

            return;
        }

        const openResult = await executeJarvisAction({
            action: "site_navigation",
            target: mydlpDirectAnswer.site,
            query: "",
            reply: mydlpDirectAnswer.reply
        });

        addMessage("JARVIS", openResult, "jarvis");
        speakJarvisReply(openResult);
        addToJarvisHistory("user", command);
        addToJarvisHistory("model", openResult);

        if (jarvisSend) {
            jarvisSend.disabled = false;
        }

        if (jarvisInput) {
            jarvisInput.focus();
        }

        return;
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

    if (shouldUseLocalWebSearch(command)) {
        const webQuery = getWebSearchQuery(command);
        const webResult = await searchTheWeb(webQuery);

        if (webResult) {
            const reply = shortenSearchAnswer(webResult, 180);

            addMessage("JARVIS", reply, "jarvis");
            speakJarvisReply(reply);
            addToJarvisHistory("user", command);
            addToJarvisHistory("model", reply);

            if (jarvisSend) {
                jarvisSend.disabled = false;
            }

            if (jarvisInput) {
                jarvisInput.focus();
            }

            return;
        }
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
                item.dataset.section ||
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

    "user-modify-playback-state",

    "user-library-read",

    "playlist-read-private",

    "playlist-read-collaborative"

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

const spotifyQueuedTrackIds = new Set();
const spotifyQueuedTrackFingerprints = new Set();
let spotifyRecommendationRequest = null;
let spotifyLastRecommendationTrackId = null;
let spotifyFallbackTracks = [];
let spotifyFallbackLastTransitionTrackId = null;
const spotifyRandomHistoryKey = "spotify_random_theme_history";

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

    return spotifyPlayer.setVolume(safeValue / 100)
        .catch(error => {
            console.warn("Impossible de régler le volume Spotify :", error);
        });
}

async function spotifyApiFetch(endpoint, options = {}) {
    const makeRequest = () => fetch(
        `https://api.spotify.com/v1${endpoint}`,
        {
            ...options,
            headers: {
                Authorization: `Bearer ${spotifyAccessToken}`,
                ...(options.headers || {})
            }
        }
    );

    let response = await makeRequest();

    if (response.status === 401 && await refreshSpotifyAccessToken()) {
        response = await makeRequest();
    }

    return response;
}

function getSpotifyTrackFingerprint(track) {
    return String(track?.name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
        .replace(/\b(feat|featuring|ft|live|remaster(?:ed)?|remix|edit|version|acoustic|karaoke|radio)\b/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function getSpotifyRandomHistory(theme) {
    try {
        const history = JSON.parse(localStorage.getItem(spotifyRandomHistoryKey) || "{}");
        return new Set(history[theme] || []);
    } catch {
        return new Set();
    }
}

function saveSpotifyRandomHistory(theme, history) {
    try {
        const savedHistory = JSON.parse(localStorage.getItem(spotifyRandomHistoryKey) || "{}");
        savedHistory[theme] = [...history];
        localStorage.setItem(spotifyRandomHistoryKey, JSON.stringify(savedHistory));
        window.MyHubCloudSync?.update("spotifyRandomHistory", savedHistory);
    } catch (error) {
        console.warn("Impossible de mémoriser l'historique Spotify :", error);
    }
}

function shuffleSpotifyTracks(tracks) {
    const shuffled = [...tracks];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

async function getSpotifyLikedTracks() {
    const tracks = [];
    let endpoint = "/me/tracks?limit=50";

    while (endpoint && tracks.length < 200) {
        const response = await spotifyApiFetch(endpoint);

        if (!response.ok) {
            return tracks;
        }

        const data = await response.json();
        tracks.push(...(data.items || []).map(item => item.track).filter(Boolean));
        endpoint = data.next?.replace("https://api.spotify.com/v1", "") || null;
    }

    return tracks;
}

async function playSpotifyTheme(theme) {
    const safeTheme = String(theme || "").trim().toLowerCase();

    if (!safeTheme || !spotifyAccessToken || !spotifyDeviceId) {
        return false;
    }

    try {
        const [searchResponse, likedTracks] = await Promise.all([
            spotifyApiFetch(`/search?type=track&limit=50&q=${encodeURIComponent(safeTheme)}`),
            getSpotifyLikedTracks()
        ]);
        const searchData = searchResponse.ok ? await searchResponse.json() : null;
        const searchTracks = searchData?.tracks?.items || [];
        const matchingLikedTracks = likedTracks.filter(track => {
            const text = [track.name, track.album?.name, ...(track.artists || []).map(artist => artist.name)]
                .join(" ")
                .toLowerCase();

            return text.includes(safeTheme);
        });
        const candidates = [...matchingLikedTracks, ...searchTracks];
        const uniqueTracks = [...new Map(candidates
            .filter(track => track?.id && track?.uri)
            .map(track => [track.id, track])).values()];
        const byFingerprint = new Map();

        uniqueTracks.forEach(track => {
            const fingerprint = getSpotifyTrackFingerprint(track);

            if (fingerprint && !byFingerprint.has(fingerprint)) {
                byFingerprint.set(fingerprint, track);
            }
        });

        let availableTracks = [...byFingerprint.values()];
        let history = getSpotifyRandomHistory(safeTheme);
        let freshTracks = availableTracks.filter(track => !history.has(track.id));

        if (freshTracks.length === 0) {
            history = new Set();
            freshTracks = availableTracks;
        }

        const selectedTracks = shuffleSpotifyTracks(freshTracks).slice(0, 6);
        const selectedTrack = selectedTracks[0];

        if (!selectedTrack) {
            return false;
        }

        const playResponse = await spotifyApiFetch(
            `/me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uris: [selectedTrack.uri] })
            }
        );

        if (!playResponse.ok) {
            return false;
        }

        history.add(selectedTrack.id);
        saveSpotifyRandomHistory(safeTheme, history);
        spotifyQueuedTrackIds.clear();
        spotifyQueuedTrackFingerprints.clear();
        spotifyLastRecommendationTrackId = null;

        for (const track of selectedTracks.slice(1)) {
            const queueResponse = await spotifyApiFetch(
                `/me/player/queue?uri=${encodeURIComponent(track.uri)}&device_id=${encodeURIComponent(spotifyDeviceId)}`,
                { method: "POST" }
            );

            if (!queueResponse.ok) {
                break;
            }

            history.add(track.id);
            spotifyQueuedTrackIds.add(track.id);
            spotifyQueuedTrackFingerprints.add(getSpotifyTrackFingerprint(track));
        }

        saveSpotifyRandomHistory(safeTheme, history);
        return true;
    } catch (error) {
        console.warn("Impossible de lancer une sélection Spotify aléatoire :", error);
        return false;
    }
}

async function queueSpotifyRecommendations(trackOrId) {
    const track = typeof trackOrId === "object" ? trackOrId : null;
    const trackId = track?.id || trackOrId;

    if (!trackId || !spotifyAccessToken || !spotifyDeviceId || spotifyLastRecommendationTrackId === trackId) {
        return;
    }

    if (spotifyRecommendationRequest) {
        return spotifyRecommendationRequest.then(() => queueSpotifyRecommendations(trackOrId));
    }

    spotifyLastRecommendationTrackId = trackId;
    spotifyRecommendationRequest = (async () => {
        try {
            let recommendations = [];
            try {
                const response = await spotifyApiFetch(
                    `/recommendations?limit=10&seed_tracks=${encodeURIComponent(trackId)}`
                );

                if (response.ok) {
                    const data = await response.json();
                    recommendations = data?.tracks || [];
                }
            } catch (error) {
                console.warn("Recommandations Spotify indisponibles, recherche par artiste utilisée :", error);
            }

            recommendations = recommendations
                .filter(track => {
                    const fingerprint = getSpotifyTrackFingerprint(track);

                    return track?.id &&
                        !spotifyQueuedTrackIds.has(track.id) &&
                        fingerprint &&
                        !spotifyQueuedTrackFingerprints.has(fingerprint);
                })
                .slice(0, 5);

            if (recommendations.length < 5 && track?.artists?.length) {
                const artistName = track.artists[0].name;
                const artistResponse = await spotifyApiFetch(
                    `/search?type=track&limit=20&q=${encodeURIComponent(`artist:"${artistName}"`)}`
                );

                if (artistResponse.ok) {
                    const artistData = await artistResponse.json();
                    const artistTracks = (artistData?.tracks?.items || [])
                        .filter(candidate => {
                            const hasArtist = candidate.artists?.some(artist =>
                                artist.name.toLowerCase() === artistName.toLowerCase()
                            );
                            const fingerprint = getSpotifyTrackFingerprint(candidate);

                            return hasArtist &&
                                candidate.id !== trackId &&
                                !spotifyQueuedTrackIds.has(candidate.id) &&
                                fingerprint &&
                                !spotifyQueuedTrackFingerprints.has(fingerprint);
                        });

                    recommendations = [
                        ...recommendations,
                        ...shuffleSpotifyTracks(artistTracks).slice(0, 5 - recommendations.length)
                    ];
                }
            }

            const requestTrackIds = new Set();
            const requestFingerprints = new Set();

            let queuedCount = 0;

            for (let index = 0; index < recommendations.length; index += 1) {
                const track = recommendations[index];
                const fingerprint = getSpotifyTrackFingerprint(track);
                if (
                    !track?.id ||
                    requestTrackIds.has(track.id) ||
                    requestFingerprints.has(fingerprint) ||
                    spotifyQueuedTrackIds.has(track.id) ||
                    spotifyQueuedTrackFingerprints.has(fingerprint)
                ) {
                    continue;
                }

                const queueResponse = await spotifyApiFetch(
                    `/me/player/queue?uri=${encodeURIComponent(track.uri)}&device_id=${encodeURIComponent(spotifyDeviceId)}`,
                    { method: "POST" }
                );

                if (!queueResponse.ok) {
                    console.warn("Spotify n'a pas accepté l'ajout à la file :", queueResponse.status);
                    if (queuedCount === 0) {
                        recommendations.slice(index).forEach(candidate => {
                            const fingerprint = getSpotifyTrackFingerprint(candidate);
                            const alreadyQueued = spotifyFallbackTracks.some(track =>
                                track.id === candidate.id || getSpotifyTrackFingerprint(track) === fingerprint
                            );

                            if (!alreadyQueued) {
                                spotifyFallbackTracks.push(candidate);
                                spotifyQueuedTrackIds.add(candidate.id);
                                spotifyQueuedTrackFingerprints.add(fingerprint);
                            }
                        });
                    }
                    break;
                }

                queuedCount += 1;
                requestTrackIds.add(track.id);
                requestFingerprints.add(fingerprint);
                spotifyQueuedTrackIds.add(track.id);
                spotifyQueuedTrackFingerprints.add(fingerprint);
            }

            const queueInfo = document.getElementById("gestureDjQueueInfo");
            if (queueInfo) {
                queueInfo.textContent = spotifyQueuedTrackIds.size > 1
                    ? `${spotifyQueuedTrackIds.size - 1} titre(s) en file`
                    : "File en cours de préparation";
            }
        } catch (error) {
            console.warn("Impossible de remplir la file Spotify :", error);
        } finally {
            spotifyRecommendationRequest = null;
        }
    })();

    return spotifyRecommendationRequest;
}

function scoreSpotifyTrack(track, query) {
    const normalize = value => String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const wanted = normalize(query);
    const title = normalize(track.name);
    const artists = normalize((track.artists || []).map(artist => artist.name).join(" "));
    const album = normalize(track.album?.name);
    const terms = wanted.split(/\s+/).filter(term => term.length > 1);

    if (title === wanted) return 1000 + (track.popularity || 0);

    let score = 0;
    if (title.includes(wanted)) score += 30;
    if (artists.includes(wanted)) score += 18;

    terms.forEach(term => {
        if (title.includes(term)) score += 5;
        else if (artists.includes(term)) score += 4;
        else if (album.includes(term)) score += 1;
    });

    return score + (track.popularity || 0) / 100;
}

async function startSpotifyTrack(track, { continuation = false } = {}) {
    if (!track?.uri || !spotifyAccessToken || !spotifyDeviceId) {
        return false;
    }

    try {
        const playResponse = await spotifyApiFetch(
            `/me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uris: [track.uri] })
            }
        );

        if (!playResponse.ok) {
            console.warn("Spotify n'a pas pu démarrer ce morceau :", playResponse.status);
            return false;
        }

        if (!continuation) {
            spotifyQueuedTrackIds.clear();
            spotifyQueuedTrackFingerprints.clear();
            spotifyFallbackTracks = [];
        }
        spotifyLastRecommendationTrackId = null;
        spotifyFallbackLastTransitionTrackId = null;
        spotifyQueuedTrackIds.add(track.id);
        spotifyQueuedTrackFingerprints.add(getSpotifyTrackFingerprint(track));

        const queueInfo = document.getElementById("gestureDjQueueInfo");
        if (queueInfo) queueInfo.textContent = "File en cours de préparation";

        void queueSpotifyRecommendations(track);
        return true;
    } catch (error) {
        console.warn("Impossible de lancer ce morceau sur Spotify :", error);
        return false;
    }
}

window.setInterval(async () => {
    if (!spotifyPlayer || spotifyFallbackTracks.length === 0) {
        return;
    }

    try {
        spotifyCurrentState = await spotifyPlayer.getCurrentState() || spotifyCurrentState;
    } catch {
        return;
    }

    const state = spotifyCurrentState;
    const currentTrack = state?.track_window?.current_track;
    const nextTracks = state?.track_window?.next_tracks || [];

    if (
        !state ||
        state.paused ||
        !currentTrack?.id ||
        nextTracks.length > 0 ||
        spotifyFallbackTracks.length === 0 ||
        state.duration - state.position > 3000 ||
        spotifyFallbackLastTransitionTrackId === currentTrack.id
    ) {
        return;
    }

    const nextTrack = spotifyFallbackTracks.shift();
    spotifyFallbackLastTransitionTrackId = currentTrack.id;
    void startSpotifyTrack(nextTrack, { continuation: true });
}, 1000);

async function searchSpotifyTracks(query, limit = 10) {
    const safeQuery = String(query || "").trim();
    if (!safeQuery || !spotifyAccessToken) return [];

    const response = await spotifyApiFetch(
        `/search?type=track&limit=${limit}&q=${encodeURIComponent(safeQuery)}`
    );

    if (!response.ok) {
        const error = new Error(`Recherche Spotify refusée (HTTP ${response.status})`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    return data?.tracks?.items?.filter(track => track?.uri) || [];
}

async function playSpotifySearchResult(query) {
    const safeQuery = String(query || "").trim();

    if (!safeQuery) {
        return { started: false, reason: "no_results" };
    }

    if (!spotifyAccessToken) {
        return { started: false, reason: "search_error" };
    }

    if (!spotifyDeviceId) {
        return { started: false, reason: "device_not_ready" };
    }

    try {
        const tracks = await searchSpotifyTracks(safeQuery, 20);
        if (tracks.length === 0) {
            return { started: false, reason: "no_results" };
        }

        const track = tracks.sort((first, second) =>
            scoreSpotifyTrack(second, safeQuery) - scoreSpotifyTrack(first, safeQuery)
        )[0];

        const started = await startSpotifyTrack(track);
        return { started, reason: started ? null : "playback_rejected" };
    } catch (error) {
        console.warn("Impossible de lancer une recherche Spotify :", error);
        return { started: false, reason: "search_error", status: error.status };
    }
}

async function getSpotifyPlaylists(query) {
    const safeQuery = String(query || "").trim();
    const userPlaylists = [];
    let nextUrl = "/me/playlists?limit=50";

    while (nextUrl && userPlaylists.length < 100) {
        const endpoint = nextUrl.replace("https://api.spotify.com/v1", "");
        const response = await spotifyApiFetch(endpoint);

        if (!response.ok) {
            break;
        }

        const data = await response.json();
        userPlaylists.push(...(data.items || []));
        nextUrl = data.next;
    }

    if (["mes playlists", "ma playlist", "mes playlist"].includes(safeQuery)) {
        return userPlaylists;
    }

    const response = await spotifyApiFetch(
        `/search?type=playlist&limit=10&q=${encodeURIComponent(safeQuery)}`
    );

    if (!response.ok) {
        return userPlaylists.filter(item =>
            item.name?.toLowerCase().includes(safeQuery.toLowerCase())
        );
    }

    const data = await response.json();
    const publicPlaylists = data?.playlists?.items?.filter(Boolean) || [];
    const matchingUserPlaylists = userPlaylists.filter(item =>
        item.name?.toLowerCase().includes(safeQuery.toLowerCase())
    );
    const knownUris = new Set(matchingUserPlaylists.map(item => item.uri));

    return [
        ...matchingUserPlaylists,
        ...publicPlaylists.filter(item => !knownUris.has(item.uri))
    ];
}

async function playSpotifyPlaylistSearch(query) {
    if (!spotifyAccessToken || !spotifyDeviceId) {
        return false;
    }

    try {
        const playlists = await getSpotifyPlaylists(query);
        const wanted = String(query || "").trim().toLowerCase();
        const playlist = playlists.find(item =>
            item.name?.toLowerCase() === wanted
        ) || playlists[0];

        if (!playlist?.uri) {
            return false;
        }

        const response = await spotifyApiFetch(
            `/me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ context_uri: playlist.uri })
            }
        );

        return response.ok;
    } catch (error) {
        console.warn("Impossible de lancer une playlist Spotify :", error);
        return false;
    }
}

async function refreshSpotifyAccessToken() {
    const refreshToken = localStorage.getItem("spotify_refresh_token");

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: SPOTIFY_CLIENT_ID,
                grant_type: "refresh_token",
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        if (!data.access_token) {
            return false;
        }

        spotifyAccessToken = data.access_token;
        localStorage.setItem("spotify_access_token", spotifyAccessToken);

        if (data.refresh_token) {
            localStorage.setItem("spotify_refresh_token", data.refresh_token);
        }

        return true;
    } catch (error) {
        console.warn("Impossible de renouveler le token Spotify :", error);
        return false;
    }
}

if (spotifyVolumeSlider) {
    spotifyVolumeSlider.addEventListener("input", () => {
        setSpotifyVolume(spotifyVolumeSlider.value);
    });
}

function hydrateSpotifyVolumeFromPlayer() {
    if (!spotifyPlayer || typeof spotifyPlayer.getVolume !== "function") {
        return;
    }

    spotifyPlayer.getVolume()
        .then(volume => {
            if (typeof volume === "number") {
                syncSpotifyVolumeUi(Math.round(volume * 100));
            }
        })
        .catch(error => {
            console.warn("Impossible de lire le volume Spotify :", error);
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

            const djConnect = document.getElementById("gestureDjConnect");
            if (djConnect) djConnect.hidden = true;


            transferPlaybackToMyHub();
            hydrateSpotifyVolumeFromPlayer();
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

            const currentTrack =
                state.track_window?.current_track;

            if (currentTrack?.id) {
                spotifyQueuedTrackIds.add(currentTrack.id);
                spotifyQueuedTrackFingerprints.add(
                    getSpotifyTrackFingerprint(currentTrack)
                );
                void queueSpotifyRecommendations(currentTrack);
            }

            const queueInfo = document.getElementById("gestureDjQueueInfo");
            if (queueInfo && spotifyQueuedTrackIds.size > 1) {
                queueInfo.textContent = `${spotifyQueuedTrackIds.size - 1} titre(s) en file`;
            }


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

        updateSpotifyPlayButton({ paused: !data.is_playing });


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

function updateGestureDjTrack(track) {
    const name = document.getElementById("gestureDjTrackName");
    const artist = document.getElementById("gestureDjArtist");
    const cover = document.getElementById("gestureDjCover");

    if (name) name.textContent = track?.name || "Aucun morceau";
    if (artist) {
        artist.textContent = (track?.artists || []).map(item => item.name).join(", ") || "Spotify";
    }

    if (cover && track?.album?.images?.length) {
        cover.replaceChildren();
        const image = document.createElement("img");
        image.src = track.album.images[0].url;
        image.alt = `Pochette de ${track.name}`;
        cover.appendChild(image);
    }
}

function updateSpotifyTrackFromAPI(data) {

    const track =
        data.item;

    updateGestureDjTrack(track);


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

    updateGestureDjTrack(track);


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

    const djButton = document.getElementById("gestureDjPlay");
    const djState = document.getElementById("gestureDjPlaybackState");


    if (!button && !djButton) {
        return;
    }


    if (button) {
        button.textContent = state.paused ? "▶" : "⏸";
    }

    if (djButton) {
        djButton.textContent = state.paused ? "▶" : "⏸";
        djButton.setAttribute("aria-label", state.paused ? "Lecture" : "Pause");
    }

    if (djState) {
        djState.textContent = state.paused ? "En pause" : "En lecture";
    }
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

    const djProgress = document.getElementById("gestureDjProgress");
    const djCurrentTime = document.getElementById("gestureDjCurrentTime");
    const djDuration = document.getElementById("gestureDjDuration");


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

    if (djProgress) {
        djProgress.max = state.duration || 0;
        djProgress.value = state.position || 0;
    }

    if (djCurrentTime) djCurrentTime.textContent = formatSpotifyTime(state.position || 0);
    if (djDuration) djDuration.textContent = formatSpotifyTime(state.duration || 0);
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

    const djProgress = document.getElementById("gestureDjProgress");
    const djCurrentTime = document.getElementById("gestureDjCurrentTime");
    const djDuration = document.getElementById("gestureDjDuration");


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

    if (djProgress) {
        djProgress.max = data.item?.duration_ms || 0;
        djProgress.value = data.progress_ms || 0;
    }

    if (djCurrentTime) djCurrentTime.textContent = formatSpotifyTime(data.progress_ms || 0);
    if (djDuration) djDuration.textContent = formatSpotifyTime(data.item?.duration_ms || 0);
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

const gestureDjSearchForm = document.getElementById("gestureDjSearchForm");
const gestureDjSearchInput = document.getElementById("gestureDjSearchInput");
const gestureDjSearchButton = document.getElementById("gestureDjSearchButton");
const gestureDjSearchStatus = document.getElementById("gestureDjSearchStatus");
const gestureDjSearchResults = document.getElementById("gestureDjSearchResults");
const gestureDjConnectButton = document.getElementById("gestureDjConnect");

if (gestureDjConnectButton) {
    gestureDjConnectButton.hidden = Boolean(spotifyPlayer && spotifyDeviceId);
    gestureDjConnectButton.textContent = spotifyAccessToken
        ? "Activer le lecteur Spotify"
        : "Connecter Spotify";
    gestureDjConnectButton.addEventListener("click", () => {
        if (spotifyAccessToken) {
            window.initSpotifyPlayer?.();
            if (gestureDjSearchStatus) {
                gestureDjSearchStatus.textContent = "Connexion du lecteur Spotify…";
            }
        } else {
            connectSpotify();
        }
    });
}

function renderGestureDjSearchResults(tracks) {
    if (!gestureDjSearchResults) return;

    gestureDjSearchResults.replaceChildren();

    tracks.slice(0, 6).forEach(track => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "dj-result-item";

        const image = document.createElement("img");
        image.className = "dj-result-cover";
        image.alt = "";
        image.src = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || "";

        const copy = document.createElement("span");
        copy.className = "dj-result-copy";

        const title = document.createElement("strong");
        title.textContent = track.name;

        const artist = document.createElement("small");
        artist.textContent = (track.artists || []).map(item => item.name).join(", ");

        const playMark = document.createElement("span");
        playMark.className = "dj-result-play";
        playMark.textContent = "▶";
        playMark.setAttribute("aria-hidden", "true");

        copy.append(title, artist);
        button.append(image, copy, playMark);
        button.addEventListener("click", async () => {
            if (!spotifyDeviceId) {
                if (gestureDjSearchStatus) {
                    gestureDjSearchStatus.textContent = "Connecte Spotify et active le lecteur depuis l’accueil.";
                }
                return;
            }

            if (gestureDjSearchStatus) gestureDjSearchStatus.textContent = `Lancement de « ${track.name} »…`;
            const started = await startSpotifyTrack(track);
            if (gestureDjSearchStatus) {
                gestureDjSearchStatus.textContent = started
                    ? `« ${track.name} » lancé · la suite se prépare en arrière-plan.`
                    : "Spotify n’a pas pu lancer ce titre. Vérifie qu’un appareil Spotify est actif.";
            }
        });

        gestureDjSearchResults.appendChild(button);
    });
}

gestureDjSearchForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const query = gestureDjSearchInput?.value.trim();
    if (!query) return;

    if (!spotifyAccessToken) {
        if (gestureDjSearchStatus) gestureDjSearchStatus.textContent = "Connecte ton compte Spotify pour rechercher.";
        gestureDjConnectButton?.removeAttribute("hidden");
        return;
    }

    if (gestureDjSearchButton) gestureDjSearchButton.disabled = true;
    if (gestureDjSearchStatus) gestureDjSearchStatus.textContent = "Recherche en cours…";

    try {
        const tracks = await searchSpotifyTracks(query, 10);
        const rankedTracks = tracks.sort((first, second) =>
            scoreSpotifyTrack(second, query) - scoreSpotifyTrack(first, query)
        );

        renderGestureDjSearchResults(rankedTracks);
        if (gestureDjSearchStatus) {
            gestureDjSearchStatus.textContent = rankedTracks.length
                ? `${rankedTracks.length} résultat(s) · sélectionne un titre pour lancer la file.`
                : "Aucun résultat. Essaie avec un titre ou un artiste différent.";
        }
    } catch (error) {
        console.warn("Recherche DJ Spotify impossible :", error);
        if (gestureDjSearchStatus) gestureDjSearchStatus.textContent = "La recherche Spotify a échoué. Réessaie dans un instant.";
    } finally {
        if (gestureDjSearchButton) gestureDjSearchButton.disabled = false;
    }
});

document.getElementById("gestureDjPlay")?.addEventListener("click", async () => {
    if (!spotifyPlayer) {
        if (gestureDjSearchStatus) gestureDjSearchStatus.textContent = "Connecte Spotify depuis l’accueil pour contrôler la lecture.";
        return;
    }

    try {
        if (spotifyCurrentState?.paused) await spotifyPlayer.resume();
        else await spotifyPlayer.togglePlay();
    } catch (error) {
        console.error("Commande lecture DJ impossible :", error);
    }
});

document.getElementById("gestureDjPrevious")?.addEventListener("click", () => spotifyPlayer?.previousTrack());
document.getElementById("gestureDjNext")?.addEventListener("click", () => spotifyPlayer?.nextTrack());

document.getElementById("gestureDjProgress")?.addEventListener("change", event => {
    if (spotifyPlayer) spotifyPlayer.seek(Number(event.target.value));
});


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
initializeAgenda();


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

/* =========================================================
   JARVIS - GESTURE CONTROL V4
   Caméra + MediaPipe + Curseur + Pinch
   ========================================================= */

(() => {

    console.log("🤖 JARVIS Gesture Control V4 : chargement...");

    const gestureCamera =
        document.getElementById("gestureCamera");

    const gestureCanvas =
        document.getElementById("gestureCanvas");

    const gestureToggleButton =
        document.getElementById("gestureToggleButton");

    const studioGestureToggle =
        document.getElementById("studioGestureToggle");

    const studioGestureState =
        document.getElementById("studioGestureState");

    const studioGestureDot =
        document.getElementById("studioGestureDot");

    const gestureStatus =
        document.getElementById("gestureStatus");

    const gestureCameraStatus =
        document.getElementById("gestureCameraStatus");

    const gestureCameraSelect =
        document.getElementById("gestureCameraSelect");

    if (
        !gestureCamera ||
        !gestureCanvas ||
        !gestureToggleButton ||
        !gestureStatus ||
        !gestureCameraStatus ||
        !gestureCameraSelect
    ) {

        console.warn(
            "🤖 Gesture Control : éléments HTML introuvables."
        );

        return;
    }


    const gestureCtx =
        gestureCanvas.getContext("2d");


    /* =====================================================
       VARIABLES
    ===================================================== */

    let gestureStream = null;

    let handLandmarker = null;

    let gestureRunning = false;

    let detectingHands = false;

    let lastVideoTime = -1;

    let camerasLoaded = false;

    let pointerPoseSince = null;

    let musicSwipeStartX = null;

    let musicSwipeStartedAt = 0;

    let musicSwipeConsumed = false;

    let musicSwipePoseSince = null;

    let lastMusicSwipeTime = 0;

    let transportGesturePose = null;

    let transportGestureStartedAt = 0;

    let transportGestureConsumed = false;

    let lastTransportGestureTime = 0;


    /* =====================================================
   CURSEUR - STABILISATION
===================================================== */

let cursorX =
    window.innerWidth / 2;

let cursorY =
    window.innerHeight / 2;

/*
 * Plus cette valeur est basse,
 * plus le curseur est fluide.
 */
const CURSOR_SMOOTHING = 0.12;

/*
 * Zone morte :
 * les tout petits mouvements de la main
 * ne font pas bouger le curseur.
 */
const CURSOR_DEADZONE = 8;

/*
 * Nombre de frames pendant lesquelles
 * on garde le curseur à sa position
 * si MediaPipe perd momentanément la main.
 */
const HAND_LOST_TOLERANCE = 8;

let handLostFrames = 0;


    /* =====================================================
       PINCH
    ===================================================== */

    let pinchActive = false;

    let lastClickTime = 0;

    const CLICK_COOLDOWN = 600;

    const PINCH_DISTANCE = 0.065;

    const POINTER_POSE_HOLD = 250;

    const MUSIC_SWIPE_POSE_HOLD = 100;

    const MUSIC_SWIPE_DISTANCE = 0.075;

    const MUSIC_SWIPE_TIMEOUT = 1800;

    const TRANSPORT_POSE_HOLD = 700;


    /* =====================================================
       ZONE DE MOUVEMENT
    ===================================================== */

    const GESTURE_LEFT = 0.15;

    const GESTURE_RIGHT = 0.85;

    const GESTURE_TOP = 0.10;

    const GESTURE_BOTTOM = 0.90;

    function isFingerExtended(hand, tipIndex, jointIndex, extensionRatio = 1.12) {
        const wrist = hand[0];
        const tip = hand[tipIndex];
        const joint = hand[jointIndex];
        const tipDistance = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const jointDistance = Math.hypot(joint.x - wrist.x, joint.y - wrist.y);

        return tipDistance > jointDistance * extensionRatio;
    }

    function isIndexPointing(hand) {
        return isFingerExtended(hand, 8, 6) &&
            !isFingerExtended(hand, 12, 10) &&
            !isFingerExtended(hand, 16, 14) &&
            !isFingerExtended(hand, 20, 18);
    }

    function isTwoFingerSwipePose(hand) {
        return isFingerExtended(hand, 8, 6) &&
            isFingerExtended(hand, 12, 10) &&
            !isFingerExtended(hand, 16, 14) &&
            !isFingerExtended(hand, 20, 18);
    }

    function isOpenPalmGesture(hand) {
        const thumbOpen = Math.hypot(
            hand[4].x - hand[5].x,
            hand[4].y - hand[5].y
        ) > Math.hypot(
            hand[3].x - hand[5].x,
            hand[3].y - hand[5].y
        ) * 1.18;

        return thumbOpen &&
            isFingerExtended(hand, 8, 6, 1.22) &&
            isFingerExtended(hand, 12, 10, 1.22) &&
            isFingerExtended(hand, 16, 14, 1.22) &&
            isFingerExtended(hand, 20, 18, 1.22);
    }

    function isThumbsUpGesture(hand) {
        const thumbPointsUp =
            hand[4].y < hand[3].y - 0.035 &&
            hand[4].y < hand[9].y;

        return thumbPointsUp &&
            !isFingerExtended(hand, 8, 6) &&
            !isFingerExtended(hand, 12, 10) &&
            !isFingerExtended(hand, 16, 14) &&
            !isFingerExtended(hand, 20, 18);
    }

    function isVolumeGesture(hand, pinchDistance) {
        return pinchDistance < PINCH_DISTANCE &&
            isFingerExtended(hand, 12, 10) &&
            isFingerExtended(hand, 16, 14) &&
            isFingerExtended(hand, 20, 18);
    }

    function drawDetectedHands(results) {
        for (const landmarks of results.landmarks) {
            drawHand(landmarks);
        }
    }

    /* =====================================================
       CURSEUR VISUEL
    ===================================================== */

    const virtualCursor =
        document.createElement("div");

    virtualCursor.id =
        "jarvisGestureCursor";

    virtualCursor.innerHTML = `
        <div class="jarvis-cursor-core"></div>
        <div class="jarvis-cursor-ring"></div>
    `;

    document.body.appendChild(
        virtualCursor
    );


    const cursorStyle =
        document.createElement("style");

    cursorStyle.textContent = `

        #jarvisGestureCursor {

            position: fixed;

            left: 0;
            top: 0;

            width: 28px;
            height: 28px;

            transform:
                translate(-50%, -50%);

            pointer-events: none;

            z-index: 999999;

            display: none;
        }


        .jarvis-cursor-core {

            position: absolute;

            left: 50%;
            top: 50%;

            width: 8px;
            height: 8px;

            transform:
                translate(-50%, -50%);

            border-radius: 50%;

            background: #101513;

            border: 2px solid white;

            box-shadow:
                0 0 0 1px #101513,
                0 0 8px rgba(255,255,255,0.95);
        }


        .jarvis-cursor-ring {

            position: absolute;

            left: 50%;
            top: 50%;

            width: 26px;
            height: 26px;

            transform:
                translate(-50%, -50%);

            border-radius: 50%;

            border:
                2px solid #101513;

            box-shadow:
                0 0 0 2px rgba(255,255,255,0.92),
                0 0 0 3px rgba(16,21,19,0.75);

            transition:
                width 0.12s,
                height 0.12s,
                border-color 0.12s,
                box-shadow 0.12s;
        }


        #jarvisGestureCursor.pinching
        .jarvis-cursor-ring {

            width: 36px;
            height: 36px;

            border-color:
                rgba(255,100,100,1);

            box-shadow:
                0 0 25px rgba(255,80,80,0.9);
        }


        #jarvisGestureCursor.clicked
        .jarvis-cursor-ring {

            width: 48px;
            height: 48px;

            border-color:
                white;

            box-shadow:
                0 0 30px white;
        }

    `;

    document.head.appendChild(
        cursorStyle
    );


    /* =====================================================
       CHARGEMENT DES CAMÉRAS
    ===================================================== */

    async function loadCameras() {

        try {

            gestureCameraStatus.textContent =
                "Recherche des caméras...";


            /*
             * On demande temporairement l'accès
             * pour que le navigateur révèle les noms
             * et les deviceId des caméras.
             */

            const temporaryStream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });


            temporaryStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });


            const devices =
                await navigator.mediaDevices.enumerateDevices();


            const videoDevices =
                devices.filter(
                    device =>
                        device.kind === "videoinput"
                );


            gestureCameraSelect.innerHTML = "";


            if (videoDevices.length === 0) {

                const option =
                    document.createElement("option");

                option.textContent =
                    "Aucune caméra détectée";

                option.value = "";

                gestureCameraSelect.appendChild(
                    option
                );

                return false;
            }


            /*
             * Ajout des caméras dans le menu.
             */

            videoDevices.forEach(
                (device, index) => {

                    const option =
                        document.createElement("option");

                    option.value =
                        device.deviceId;

                    option.textContent =
                        device.label ||
                        `Caméra ${index + 1}`;

                    gestureCameraSelect.appendChild(
                        option
                    );

                }
            );


            /*
             * On cherche une webcam / caméra PC.
             */

            const pcCamera =
                videoDevices.find(
                    device => {

                        const name =
                            device.label.toLowerCase();

                        return (
                            name.includes("webcam") ||
                            name.includes("integrated") ||
                            name.includes("built-in") ||
                            name.includes("hd camera") ||
                            name.includes("camera")
                        );

                    }
                );


            if (pcCamera) {

                gestureCameraSelect.value =
                    pcCamera.deviceId;

                console.log(
                    "📷 Caméra PC sélectionnée :",
                    pcCamera.label
                );

            } else {

                /*
                 * Si aucune caméra PC identifiable
                 * n'est trouvée, on prend la première.
                 */

                gestureCameraSelect.value =
                    videoDevices[0].deviceId;

                console.log(
                    "📷 Caméra par défaut :",
                    videoDevices[0].label
                );
            }


            camerasLoaded = true;

            console.log(
                "📷 Caméras disponibles :",
                videoDevices
            );


            return true;

        } catch (error) {

            console.error(
                "❌ Impossible de récupérer les caméras :",
                error
            );

            gestureCameraStatus.textContent =
                "Autorisation caméra nécessaire";

            return false;
        }
    }


    /* =====================================================
       CHARGEMENT MEDIAPIPE
    ===================================================== */

    async function loadMediaPipe() {

        gestureCameraStatus.textContent =
            "Chargement du système de vision...";

        gestureStatus.textContent =
            "● Initialisation";


        try {

            const module =
                await import(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/+esm"
                );


            const HandLandmarker =
                module.HandLandmarker;

            const FilesetResolver =
                module.FilesetResolver;


            const vision =
                await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm"
                );


            handLandmarker =
                await HandLandmarker.createFromOptions(
                    vision,
                    {

                        baseOptions: {

                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

                            delegate:
                                "GPU"
                        },

                        runningMode:
                            "VIDEO",

                        numHands:
                            2
                    }
                );


            console.log(
                "🤖 MediaPipe chargé."
            );


            return true;


        } catch (error) {

            console.error(
                "❌ Erreur MediaPipe :",
                error
            );


            gestureCameraStatus.textContent =
                "Erreur de chargement MediaPipe";

            gestureStatus.textContent =
                "● Erreur";


            return false;
        }
    }


    /* =====================================================
       DÉMARRAGE
    ===================================================== */

    async function startGestureControl() {

        if (gestureRunning) {

            stopGestureControl();

            return;
        }


        gestureToggleButton.disabled =
            true;

        if (studioGestureState) {
            studioGestureState.textContent = "Activation en cours";
        }

        studioGestureDot?.classList.remove("active");


        gestureStatus.textContent =
            "● Démarrage";


        /*
         * 1. Charger les caméras
         */

        if (!camerasLoaded) {

            const camerasOK =
                await loadCameras();

            if (!camerasOK) {

                gestureToggleButton.disabled =
                    false;

                if (studioGestureState) {
                    studioGestureState.textContent = "Caméra inactive";
                }

                studioGestureDot?.classList.remove("active");

                return;
            }
        }


        /*
         * 2. Charger MediaPipe
         */

        if (!handLandmarker) {

            const loaded =
                await loadMediaPipe();

            if (!loaded) {

                gestureToggleButton.disabled =
                    false;

                if (studioGestureState) {
                    studioGestureState.textContent = "Caméra inactive";
                }

                studioGestureDot?.classList.remove("active");

                return;
            }
        }


        /*
         * 3. Récupérer la caméra sélectionnée
         */

        const selectedCamera =
            gestureCameraSelect.value;


        try {

            gestureStream =
                await navigator.mediaDevices.getUserMedia({

                    video: selectedCamera
                        ? {
                            deviceId: {
                                exact:
                                    selectedCamera
                            },

                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }
                        }

                        : {
                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }
                        },

                    audio: false
                });


            gestureCamera.srcObject =
                gestureStream;


            await gestureCamera.play();


            /*
             * Dimensions réelles de la vidéo.
             */

            gestureCanvas.width =
                gestureCamera.videoWidth;

            gestureCanvas.height =
                gestureCamera.videoHeight;


            console.log(
                "📷 Résolution caméra :",
                gestureCamera.videoWidth,
                "x",
                gestureCamera.videoHeight
            );


            gestureRunning =
                true;


            gestureToggleButton.disabled =
                false;


            gestureToggleButton.textContent =
                "🛑 Désactiver le contrôle gestuel";

            if (studioGestureToggle) {
                studioGestureToggle.setAttribute("aria-pressed", "true");
                studioGestureToggle.querySelector("span:last-child").textContent = "Désactiver le curseur";
            }

            if (studioGestureState) {
                studioGestureState.textContent = "Curseur actif";
            }

            studioGestureDot?.classList.add("active");


            gestureStatus.textContent =
                "● Caméra active";


            gestureCameraStatus.textContent =
                "Paume tenue 0,7 s : pause · pouce levé : lecture · deux doigts : pistes";


            virtualCursor.style.display =
                "none";


            document
                .querySelector(".gesture-widget")
                ?.classList.add(
                    "gesture-active"
                );


            console.log(
                "🤖 Contrôle gestuel activé."
            );


            /*
             * IMPORTANT :
             * on remet le compteur vidéo à zéro.
             */

            lastVideoTime =
                -1;


            detectHands();


        } catch (error) {

            console.error(
                "❌ Erreur caméra :",
                error
            );


            gestureToggleButton.disabled =
                false;


            gestureStatus.textContent =
                "● Erreur caméra";


            gestureCameraStatus.textContent =
                error.name === "NotAllowedError"

                    ? "Autorisation caméra refusée"

                    : error.message;

            if (studioGestureToggle) {
                studioGestureToggle.setAttribute("aria-pressed", "false");
                studioGestureToggle.querySelector("span:last-child").textContent = "Activer le curseur";
            }

            if (studioGestureState) {
                studioGestureState.textContent = "Caméra indisponible";
            }

            studioGestureDot?.classList.remove("active");
        }

    }


    /* =====================================================
       ARRÊT
    ===================================================== */

    function stopGestureControl() {

        gestureRunning =
            false;


        if (gestureStream) {

            gestureStream
                .getTracks()
                .forEach(track => {

                    track.stop();

                });

            gestureStream =
                null;
        }


        gestureCamera.srcObject =
            null;


        gestureCtx.clearRect(
            0,
            0,
            gestureCanvas.width,
            gestureCanvas.height
        );


        virtualCursor.style.display =
            "none";


        virtualCursor.classList.remove(
            "pinching"
        );


        virtualCursor.classList.remove(
            "clicked"
        );


        gestureToggleButton.textContent =
            "✋ Activer le contrôle gestuel";

        if (studioGestureToggle) {
            studioGestureToggle.setAttribute("aria-pressed", "false");
            studioGestureToggle.querySelector("span:last-child").textContent = "Activer le curseur";
        }

        if (studioGestureState) {
            studioGestureState.textContent = "Caméra inactive";
        }

        studioGestureDot?.classList.remove("active");


        gestureStatus.textContent =
            "● Inactif";


        gestureCameraStatus.textContent =
            "Contrôle gestuel désactivé";


        document
            .querySelector(".gesture-widget")
            ?.classList.remove(
                "gesture-active"
            );


        pinchActive =
            false;
        pointerPoseSince = null;
        musicSwipeStartX = null;
        musicSwipeConsumed = false;
        musicSwipePoseSince = null;
        transportGesturePose = null;
        transportGestureStartedAt = 0;
        transportGestureConsumed = false;

        if (typeof window.myHubVolumeGesture === "function") {
            window.myHubVolumeGesture(null);
        }


        console.log(
            "🤖 Contrôle gestuel désactivé."
        );
    }


    /* =====================================================
       DÉTECTION DES MAINS
    ===================================================== */

    async function detectHands() {

        if (!gestureRunning)
            return;


        if (detectingHands)
            return;


        detectingHands =
            true;


        try {

            if (

                gestureCamera.readyState >= 2 &&

                gestureCamera.currentTime !==
                lastVideoTime

            ) {

                lastVideoTime =
                    gestureCamera.currentTime;


                const results =
                    handLandmarker.detectForVideo(
                        gestureCamera,
                        performance.now()
                    );


                processHands(
                    results
                );
            }


        } catch (error) {

            console.error(
                "❌ Erreur détection main :",
                error
            );

        }


        detectingHands =
            false;


        if (gestureRunning) {

            requestAnimationFrame(
                detectHands
            );

        }

    }


    /* =====================================================
       TRAITEMENT DES MAINS
    ===================================================== */

    function processHands(results) {

        gestureCtx.clearRect(
            0,
            0,
            gestureCanvas.width,
            gestureCanvas.height
        );


        if (
    !results ||
    !results.landmarks ||
    results.landmarks.length === 0
) {

    handLostFrames++;

    gestureStatus.textContent =
        "● Aucune main";

    pinchActive =
        false;
    pointerPoseSince = null;
    musicSwipeStartX = null;
    musicSwipeConsumed = false;
    musicSwipePoseSince = null;
    transportGesturePose = null;
    transportGestureStartedAt = 0;
    transportGestureConsumed = false;

    if (typeof window.myHubVolumeGesture === "function") {
        window.myHubVolumeGesture(null);
    }

    /*
     * On ne fait disparaître le curseur
     * qu'après plusieurs frames sans main.
     */
    if (
        handLostFrames >
        HAND_LOST_TOLERANCE
    ) {

        virtualCursor.style.display =
            "none";
    }

    return;
}


/*
 * Une main est retrouvée.
 */
handLostFrames = 0;


        /*
 * Main principale
 */

const hand =
    results.landmarks[0];

const indexTip = hand[8];
const thumbTip = hand[4];
const pinchDistance = Math.hypot(
    thumbTip.x - indexTip.x,
    thumbTip.y - indexTip.y
);
const isPinching = pinchDistance < PINCH_DISTANCE;

const transportPose = isOpenPalmGesture(hand)
    ? "pause"
    : isThumbsUpGesture(hand)
        ? "play"
        : null;

if (transportPose) {
    pointerPoseSince = null;
    pinchActive = false;
    musicSwipeStartX = null;
    musicSwipePoseSince = null;
    musicSwipeConsumed = false;
    virtualCursor.style.display = "none";
    virtualCursor.classList.remove("pinching");

    if (typeof window.myHubVolumeGesture === "function") {
        window.myHubVolumeGesture(null);
    }

    const transportNow = performance.now();

    if (transportGesturePose !== transportPose) {
        transportGesturePose = transportPose;
        transportGestureStartedAt = transportNow;
        transportGestureConsumed = false;
    } else if (
        !transportGestureConsumed &&
        transportNow - transportGestureStartedAt >= TRANSPORT_POSE_HOLD
    ) {
        transportGestureConsumed = true;

        if (Date.now() - lastTransportGestureTime >= 1200) {
            lastTransportGestureTime = Date.now();

            if (spotifyPlayer) {
                const playbackAction = transportPose === "pause" ? "pause" : "resume";
                spotifyPlayer[playbackAction]().then(() => {
                    gestureStatus.textContent = transportPose === "pause"
                        ? "● Pause Spotify"
                        : "● Lecture Spotify";
                }).catch(error => {
                    console.error("Commande de lecture gestuelle impossible :", error);
                    gestureStatus.textContent = "● Commande Spotify impossible";
                });
            } else {
                gestureStatus.textContent = "● Connecte Spotify pour utiliser la lecture gestuelle";
            }
        }
    }

    if (!transportGestureConsumed) {
        gestureStatus.textContent = transportPose === "pause"
            ? "● Maintiens la paume pour mettre en pause"
            : "● Maintiens le pouce levé pour lancer la lecture";
    }

    drawDetectedHands(results);
    return;
}

transportGesturePose = null;
transportGestureStartedAt = 0;
transportGestureConsumed = false;

if (isTwoFingerSwipePose(hand)) {
    pointerPoseSince = null;
    pinchActive = false;
    virtualCursor.style.display = "none";
    virtualCursor.classList.remove("pinching");

    if (typeof window.myHubVolumeGesture === "function") {
        window.myHubVolumeGesture(null);
    }

    const swipeX = Math.max(0, Math.min(1, 1 - hand[9].x));
    const swipeNow = performance.now();

    if (musicSwipePoseSince === null) {
        musicSwipePoseSince = swipeNow;
        musicSwipeStartX = swipeX;
        musicSwipeStartedAt = swipeNow;
        musicSwipeConsumed = false;
    }

    if (swipeNow - musicSwipePoseSince < MUSIC_SWIPE_POSE_HOLD) {
        gestureStatus.textContent = "● Pose reconnue — balaie à gauche ou à droite";
    } else if (
        !musicSwipeConsumed &&
        swipeNow - musicSwipeStartedAt <= MUSIC_SWIPE_TIMEOUT &&
        Math.abs(swipeX - musicSwipeStartX) >= MUSIC_SWIPE_DISTANCE
    ) {
        musicSwipeConsumed = true;

        const movedRight = swipeX > musicSwipeStartX;
        const playerAction = movedRight ? "nextTrack" : "previousTrack";

        if (Date.now() - lastMusicSwipeTime >= 850) {
            lastMusicSwipeTime = Date.now();

            if (spotifyPlayer && typeof spotifyPlayer[playerAction] === "function") {
                spotifyPlayer[playerAction]().then(() => {
                    gestureStatus.textContent = movedRight
                        ? "● Morceau suivant"
                        : "● Morceau précédent";
                }).catch(error => {
                    console.error("Erreur de changement de piste par geste :", error);
                    gestureStatus.textContent = "● Impossible de changer de morceau";
                });
            } else {
                gestureStatus.textContent = "● Connecte Spotify pour changer de morceau";
            }
        }
    } else if (
        !musicSwipeConsumed &&
        swipeNow - musicSwipeStartedAt > MUSIC_SWIPE_TIMEOUT
    ) {
        musicSwipeConsumed = true;
        gestureStatus.textContent = "● Geste expiré — baisse les doigts et recommence";
    }

    drawDetectedHands(results);
    return;
}

musicSwipeStartX = null;
musicSwipeConsumed = false;
musicSwipePoseSince = null;

if (isVolumeGesture(hand, pinchDistance)) {
    pointerPoseSince = null;
    pinchActive = false;
    virtualCursor.style.display = "none";
    virtualCursor.classList.remove("pinching");

    if (typeof window.myHubVolumeGesture === "function") {
        window.myHubVolumeGesture(hand);
    }

    gestureStatus.textContent = "● Volume — tourne la main";

    if (typeof window.myHubDrawingGesture === "function") {
        window.myHubDrawingGesture(cursorX, cursorY, false);
    }

    drawDetectedHands(results);
    return;
}

if (typeof window.myHubVolumeGesture === "function") {
    window.myHubVolumeGesture(null);
}

const now = performance.now();

if (!isIndexPointing(hand)) {
    pointerPoseSince = null;
    pinchActive = false;
    virtualCursor.style.display = "none";
    virtualCursor.classList.remove("pinching");
    gestureStatus.textContent = "● Garde l’index pointé";

    if (typeof window.myHubDrawingGesture === "function") {
        window.myHubDrawingGesture(cursorX, cursorY, false);
    }

    drawDetectedHands(results);
    return;
}

if (pointerPoseSince === null) {
    pointerPoseSince = now;
    pinchActive = false;
    virtualCursor.style.display = "none";
    gestureStatus.textContent = "● Stabilisation du pointage...";
    drawDetectedHands(results);
    return;
}

if (now - pointerPoseSince < POINTER_POSE_HOLD) {
    virtualCursor.style.display = "none";
    gestureStatus.textContent = "● Stabilisation du pointage...";
    drawDetectedHands(results);
    return;
}

virtualCursor.style.display = "block";

        let x =
            indexTip.x;

        let y =
            indexTip.y;


        x =
            Math.max(
                0,
                Math.min(1, x)
            );


        y =
            Math.max(
                0,
                Math.min(1, y)
            );


        /*
         * Image miroir.
         */

        x =
            1 - x;


        const targetX =
            x *
            window.innerWidth;


        const targetY =
            y *
            window.innerHeight;


        /*
         * Lissage du curseur.
         */

        /* =====================================================
   LISSAGE + ZONE MORTE
===================================================== */

const distanceX =
    targetX - cursorX;

const distanceY =
    targetY - cursorY;


/*
 * Si le mouvement est minuscule,
 * on ne bouge pas le curseur.
 */
if (
    Math.abs(distanceX) >
    CURSOR_DEADZONE
) {

    cursorX +=
        distanceX *
        CURSOR_SMOOTHING;
}


if (
    Math.abs(distanceY) >
    CURSOR_DEADZONE
) {

    cursorY +=
        distanceY *
        CURSOR_SMOOTHING;
}

        /* ==========================================
   DESSIN PAR GESTES
========================================== */

if (
    typeof window.myHubDrawingGesture === "function"
) {
    window.myHubDrawingGesture(
        cursorX,
        cursorY,
        pinchActive
    );
}

        virtualCursor.style.left =
            `${cursorX}px`;


        virtualCursor.style.top =
            `${cursorY}px`;


        virtualCursor.style.display =
            "block";


        gestureStatus.textContent =
            "● Main détectée";


        /*
         * PINCH
         */

        if (isPinching) {

            virtualCursor.classList.add(
                "pinching"
            );


            gestureStatus.textContent =
                "● Sélection";


            if (!pinchActive) {

                const now =
                    Date.now();


                if (

                    now -
                    lastClickTime >
                    CLICK_COOLDOWN

                ) {

                    performGestureClick();


                    lastClickTime =
                        now;
                }


                pinchActive =
                    true;
            }


        } else {

            virtualCursor.classList.remove(
                "pinching"
            );


            pinchActive =
                false;
        }


        /*
         * DESSIN MEDIAPIPE
         */

        for (

            const landmarks
            of results.landmarks

        ) {

            drawHand(
                landmarks
            );

        }

    }


    /* =====================================================
       CLIC
    ===================================================== */

    function performGestureClick() {

        console.log(
            "👆 JARVIS : clic gestuel"
        );


        const element =
            document.elementFromPoint(
                cursorX,
                cursorY
            );


        if (!element)
            return;


        if (

            element ===
            virtualCursor ||

            virtualCursor.contains(
                element
            )

        ) {

            return;
        }


        console.log(
            "Élément sélectionné :",
            element
        );


        element.click();


        virtualCursor.classList.add(
            "clicked"
        );


        setTimeout(
            () => {

                virtualCursor.classList.remove(
                    "clicked"
                );

            },
            180
        );

    }


    /* =====================================================
       DESSIN DE LA MAIN
    ===================================================== */

    function drawHand(landmarks) {

        const connections = [

            [0,1],
            [1,2],
            [2,3],
            [3,4],

            [0,5],
            [5,6],
            [6,7],
            [7,8],

            [0,9],
            [9,10],
            [10,11],
            [11,12],

            [0,13],
            [13,14],
            [14,15],
            [15,16],

            [0,17],
            [17,18],
            [18,19],
            [19,20],

            [5,9],
            [9,13],
            [13,17]

        ];


        gestureCtx.strokeStyle =
            "rgba(255,255,255,0.8)";


        gestureCtx.lineWidth =
            2;


        for (

            const [start, end]
            of connections

        ) {

            const x1 =
                landmarks[start].x *
                gestureCanvas.width;


            const y1 =
                landmarks[start].y *
                gestureCanvas.height;


            const x2 =
                landmarks[end].x *
                gestureCanvas.width;


            const y2 =
                landmarks[end].y *
                gestureCanvas.height;


            gestureCtx.beginPath();


            gestureCtx.moveTo(
                x1,
                y1
            );


            gestureCtx.lineTo(
                x2,
                y2
            );


            gestureCtx.stroke();

        }


        /*
         * Points
         */

        for (

            const point
            of landmarks

        ) {

            const x =
                point.x *
                gestureCanvas.width;


            const y =
                point.y *
                gestureCanvas.height;


            gestureCtx.beginPath();


            gestureCtx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );


            gestureCtx.fillStyle =
                "white";


            gestureCtx.fill();

        }

    }


    /* =====================================================
       CHANGEMENT DE CAMÉRA
    ===================================================== */

    gestureCameraSelect.addEventListener(
        "change",
        () => {

            if (!gestureRunning)
                return;


            /*
             * On redémarre avec
             * la nouvelle caméra.
             */

            stopGestureControl();

            startGestureControl();

        }
    );


    /* =====================================================
       BOUTON
    ===================================================== */

    gestureToggleButton.addEventListener(
        "click",
        () => {

            if (gestureRunning) {

                stopGestureControl();

            } else {

                startGestureControl();

            }

        }
    );

    studioGestureToggle?.addEventListener(
        "click",
        () => {
            if (gestureRunning) {
                stopGestureControl();
            } else {
                startGestureControl();
            }
        }
    );

    /* =====================================================
       REDIMENSIONNEMENT
    ===================================================== */

    window.addEventListener(
        "resize",
        () => {

            cursorX =
                window.innerWidth / 2;

            cursorY =
                window.innerHeight / 2;

        }
    );


    /* =====================================================
       API JARVIS
    ===================================================== */

    window.jarvisGestureControl = {

        start:
            startGestureControl,

        stop:
            stopGestureControl,

        toggle:
            () => {

                if (gestureRunning) {

                    stopGestureControl();

                } else {

                    startGestureControl();

                }

            },

        isActive:
            () =>
                gestureRunning

    };


    console.log(
        "🤖 JARVIS Gesture Control V4 prêt."
    );

})();


/* ==========================================
   MYHUB - ZONE DE DESSIN V3
========================================== */

(() => {

    const canvas = document.getElementById("drawingCanvas");
    const workspace = document.querySelector(".drawing-workspace");
    const palette = document.getElementById("drawingPalette");

    if (!canvas || !workspace || !palette) return;

    const ctx = canvas.getContext("2d");

    let drawing = false;
    let currentColor = "#202820";
    let currentColorName = "Charbon";
    let currentSize = 5;
    let eraser = false;

    let history = [];
    let redoHistory = [];

    /* ==============================
       CANVAS
    ============================== */

    function resizeCanvas() {

        const rect = workspace.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }

        const oldCanvas = document.createElement("canvas");

        oldCanvas.width = canvas.width || 1;
        oldCanvas.height = canvas.height || 1;

        if (canvas.width > 1 && canvas.height > 1) {
            oldCanvas
                .getContext("2d")
                .drawImage(canvas, 0, 0);
        }

        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        if (
            oldCanvas.width > 1 &&
            oldCanvas.height > 1
        ) {
            ctx.drawImage(
                oldCanvas,
                0,
                0,
                oldCanvas.width,
                oldCanvas.height,
                0,
                0,
                canvas.width,
                canvas.height
            );
        }

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }

    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    /* Permet au canvas de se redimensionner
       quand la section devient visible */

    if (window.ResizeObserver) {

        const observer =
            new ResizeObserver(() => {

                if (
                    workspace.offsetWidth > 0 &&
                    workspace.offsetHeight > 0
                ) {
                    resizeCanvas();
                }

            });

        observer.observe(workspace);
    }

    /* ==============================
       POSITION
    ============================== */

    function getPosition(x, y) {

        const rect =
            canvas.getBoundingClientRect();

        return {
            x:
                (x - rect.left) *
                (canvas.width / rect.width),

            y:
                (y - rect.top) *
                (canvas.height / rect.height)
        };
    }

    /* ==============================
       HISTORIQUE
    ============================== */

    function saveHistory() {

        if (
            canvas.width <= 0 ||
            canvas.height <= 0
        ) {
            return;
        }

        history.push(
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            )
        );

        if (history.length > 30) {
            history.shift();
        }

        redoHistory = [];
    }

    /* ==============================
       STYLE
    ============================== */

    function updateBrush() {

        ctx.lineWidth = currentSize;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = eraser
            ? "destination-out"
            : "source-over";

        if (eraser) {

            ctx.strokeStyle = "#ffffff";

        } else {

            ctx.strokeStyle = currentColor;
        }
    }

    function updateStudioStatus() {
        const toolState = document.getElementById("studioToolState");
        const sizeValue = document.getElementById("drawingSizeValue");

        if (toolState) {
            toolState.textContent = `${eraser ? "Gomme" : "Pinceau"} · ${currentColorName} · ${currentSize} px`;
        }

        if (sizeValue) {
            sizeValue.textContent = `${currentSize} px`;
        }
    }

    /* ==============================
       DESSIN
    ============================== */

    function beginDrawing(x, y) {

        const position =
            getPosition(x, y);

        saveHistory();

        drawing = true;

        updateBrush();

        ctx.beginPath();

        ctx.arc(
            position.x,
            position.y,
            currentSize / 2,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            eraser
                ? "#ffffff"
                : currentColor;

        ctx.fill();

        ctx.beginPath();

        ctx.moveTo(
            position.x,
            position.y
        );
    }

    function continueDrawing(x, y) {

        if (!drawing) return;

        const position =
            getPosition(x, y);

        updateBrush();

        ctx.lineTo(
            position.x,
            position.y
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(
            position.x,
            position.y
        );
    }

    function endDrawing() {

        if (!drawing) return;

        drawing = false;

        ctx.beginPath();
    }

    /* ==============================
       SOURIS / DOIGT
    ============================== */

    canvas.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            canvas.setPointerCapture(
                event.pointerId
            );

            beginDrawing(
                event.clientX,
                event.clientY
            );
        }
    );

    canvas.addEventListener(
        "pointermove",
        event => {

            if (!drawing) return;

            event.preventDefault();

            continueDrawing(
                event.clientX,
                event.clientY
            );
        }
    );

    canvas.addEventListener(
        "pointerup",
        endDrawing
    );

    canvas.addEventListener(
        "pointercancel",
        endDrawing
    );

    canvas.addEventListener(
        "pointerleave",
        event => {

            if (
                drawing &&
                event.buttons === 0
            ) {
                endDrawing();
            }
        }
    );

    /* ==============================
       COULEURS
    ============================== */

    const colorButtons =
        document.querySelectorAll(
            ".drawing-color"
        );

    colorButtons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const selectedColor =
                    button.getAttribute(
                        "data-color"
                    );

                if (!selectedColor) return;

                currentColor =
                    selectedColor;
                currentColorName =
                    button.title || "Couleur";

                eraser = false;

                colorButtons.forEach(
                    other => {

                        other.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add(
                    "active"
                );

                const customColor = document.getElementById("drawingCustomColor");
                if (customColor) customColor.value = currentColor;

                document
                    .getElementById(
                        "drawingBrush"
                    )
                    ?.classList.add("active");

                document
                    .getElementById(
                        "drawingEraser"
                    )
                    ?.classList.remove("active");

                updateStudioStatus();

                console.log(
                    "🎨 Couleur :",
                    currentColor
                );
            }
        );
    });

    /* ==============================
       ÉPAISSEUR
    ============================== */

    const sizeSlider =
        document.getElementById(
            "drawingSize"
        );

    if (sizeSlider) {

        currentSize =
            Number(sizeSlider.value) || 5;

        sizeSlider.addEventListener(
            "input",
            () => {

                currentSize =
                    Number(sizeSlider.value);

                if (
                    currentSize < 1
                ) {
                    currentSize = 1;
                }

                updateStudioStatus();
            }
        );
    }

    /* ==============================
       PINCEAU
    ============================== */

    const brush =
        document.getElementById(
            "drawingBrush"
        );

    const eraserButton =
        document.getElementById(
            "drawingEraser"
        );

    brush?.addEventListener(
        "click",
        () => {

            eraser = false;
            currentColorName = document.querySelector(".drawing-color.active")?.title || currentColorName;

            brush.classList.add(
                "active"
            );

            eraserButton?.classList.remove(
                "active"
            );

            updateStudioStatus();
        }
    );

    /* ==============================
       GOMME
    ============================== */

    eraserButton?.addEventListener(
        "click",
        () => {

            eraser = true;
            currentColorName = "Blanc";

            eraserButton.classList.add(
                "active"
            );

            brush?.classList.remove(
                "active"
            );

            updateStudioStatus();
        }
    );

    /* ==============================
       ANNULER
    ============================== */

    document
        .getElementById("drawingUndo")
        ?.addEventListener(
            "click",
            () => {

                if (history.length === 0) return;

                redoHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                ctx.putImageData(history.pop(), 0, 0);
            }
        );

    document
        .getElementById("drawingRedo")
        ?.addEventListener("click", () => {
            if (redoHistory.length === 0) return;

            history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            ctx.putImageData(redoHistory.pop(), 0, 0);
        });

    /* ==============================
       EFFACER
    ============================== */

    document
        .getElementById("drawingClear")
        ?.addEventListener(
            "click",
            () => {

                saveHistory();

                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            }
        );

    /* ==============================
       SAUVEGARDER
    ============================== */

    document
        .getElementById("drawingSave")
        ?.addEventListener(
            "click",
            () => {

                const link =
                    document.createElement(
                        "a"
                    );

                link.download =
                    "atelier-myhub.png";

                const exportCanvas = document.createElement("canvas");
                exportCanvas.width = canvas.width;
                exportCanvas.height = canvas.height;
                const exportContext = exportCanvas.getContext("2d");
                exportContext.fillStyle = "#fbfaf6";
                exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                exportContext.drawImage(canvas, 0, 0);
                link.href = exportCanvas.toDataURL("image/png");

                link.click();
            }
        );

    document
        .getElementById("drawingCustomColor")
        ?.addEventListener("input", event => {
            currentColor = event.target.value;
            currentColorName = "Personnalisée";
            eraser = false;

            colorButtons.forEach(button => button.classList.remove("active"));
            brush?.classList.add("active");
            eraserButton?.classList.remove("active");
            updateStudioStatus();
        });

    updateStudioStatus();

    /* ==============================
       PALETTE À LA SOURIS
    ============================== */

    let paletteDragging = false;

    let paletteOffsetX = 0;
    let paletteOffsetY = 0;

    const paletteHandle =
        palette.querySelector(
            ".drawing-palette-handle"
        );

    function movePalette(
        clientX,
        clientY
    ) {

        const workspaceRect =
            workspace.getBoundingClientRect();

        let x =
            clientX -
            workspaceRect.left -
            paletteOffsetX;

        let y =
            clientY -
            workspaceRect.top -
            paletteOffsetY;

        const maxX =
            workspaceRect.width -
            palette.offsetWidth;

        const maxY =
            workspaceRect.height -
            palette.offsetHeight;

        x = Math.max(
            0,
            Math.min(x, maxX)
        );

        y = Math.max(
            0,
            Math.min(y, maxY)
        );

        palette.style.left =
            `${x}px`;

        palette.style.top =
            `${y}px`;

        palette.style.right =
            "auto";
    }

    if (paletteHandle) {

        paletteHandle.addEventListener(
            "pointerdown",
            event => {

                paletteDragging = true;

                const rect =
                    palette.getBoundingClientRect();

                paletteOffsetX =
                    event.clientX -
                    rect.left;

                paletteOffsetY =
                    event.clientY -
                    rect.top;

                paletteHandle.setPointerCapture(
                    event.pointerId
                );

                event.preventDefault();
            }
        );

        paletteHandle.addEventListener(
            "pointermove",
            event => {

                if (!paletteDragging) {
                    return;
                }

                movePalette(
                    event.clientX,
                    event.clientY
                );
            }
        );

        paletteHandle.addEventListener(
            "pointerup",
            event => {

                paletteDragging = false;

                try {
                    paletteHandle.releasePointerCapture(
                        event.pointerId
                    );
                } catch {}
            }
        );
    }

    /* ==============================
       GESTES
    ============================== */

    let gestureDrawing = false;
    let gesturePaletteDragging = false;

    window.myHubDrawingGesture =
        function(
            x,
            y,
            pinch
        ) {

            if (
                typeof x !== "number" ||
                typeof y !== "number"
            ) {
                return;
            }

            const handle =
                palette.querySelector(
                    ".drawing-palette-handle"
                );

            const handleRect =
                handle?.getBoundingClientRect();

            const overHandle =
                handleRect &&
                x >= handleRect.left &&
                x <= handleRect.right &&
                y >= handleRect.top &&
                y <= handleRect.bottom;

            /* PALETTE */

            if (
                pinch &&
                overHandle
            ) {

                const paletteRect =
                    palette.getBoundingClientRect();

                if (
                    !gesturePaletteDragging
                ) {

                    gesturePaletteDragging = true;

                    paletteOffsetX =
                        x -
                        paletteRect.left;

                    paletteOffsetY =
                        y -
                        paletteRect.top;
                }

                movePalette(
                    x,
                    y
                );

                return;
            }

            if (
                !pinch &&
                gesturePaletteDragging
            ) {

                gesturePaletteDragging = false;
            }

            /* CANVAS */

            const canvasRect =
                canvas.getBoundingClientRect();

            const insideCanvas =
                x >= canvasRect.left &&
                x <= canvasRect.right &&
                y >= canvasRect.top &&
                y <= canvasRect.bottom;

            if (!insideCanvas) {

                if (gestureDrawing) {

                    endDrawing();

                    gestureDrawing = false;
                }

                return;
            }

            /* PINCH = DESSIN */

            if (pinch) {

                if (!gestureDrawing) {

                    beginDrawing(
                        x,
                        y
                    );

                    gestureDrawing = true;

                } else {

                    continueDrawing(
                        x,
                        y
                    );
                }

            } else {

                if (gestureDrawing) {

                    endDrawing();

                    gestureDrawing = false;
                }
            }
        };

    console.log(
        "🎨 Zone de dessin V3 chargée."
    );

})();

/* ==========================================\r\n   MYHUB - CONTRÔLE DU VOLUME PAR LA MAIN
========================================== */

(() => {

    const volumeIndicator =
        document.getElementById(
            "gestureVolumeIndicator"
        );

    const volumeFill =
        document.getElementById(
            "gestureVolumeFill"
        );

    const volumeValue =
        document.getElementById(
            "gestureVolumeValue"
        );

    if (
        !volumeIndicator ||
        !volumeFill ||
        !volumeValue
    ) {
        console.warn(
            "🔊 Système de volume : éléments HTML introuvables."
        );

        return;
    }

    const initialSliderVolume = Number(spotifyVolumeSlider?.value);
    let currentVolume = Number.isFinite(initialSliderVolume) ? initialSliderVolume : 50;

    let targetVolume = currentVolume;

    let volumeActive = false;
    let lastPalmAngle = null;
    let volumeHasStarted = false;
    let lastAppliedVolume = Math.round(currentVolume);

    const VOLUME_PER_DEGREE = 0.6;
    const ROTATION_DEADZONE = 1.5 * Math.PI / 180;

    /*
     * Lissage
     */

    const SMOOTHING = 0.15;


    /* ==========================================
       CALCUL DU VOLUME
    ========================================== */

    function updateVolumeFromRotation(
        landmarks
    ) {

        if (!landmarks || landmarks.length < 18) {
            lastPalmAngle = null;
            volumeActive = false;
            volumeIndicator.classList.remove("active");
            return;
        }

        if (!volumeHasStarted) {
            const sliderVolume = Number(spotifyVolumeSlider?.value);
            currentVolume = Number.isFinite(sliderVolume) ? sliderVolume : currentVolume;
            targetVolume = currentVolume;
            lastAppliedVolume = Math.round(currentVolume);
            volumeHasStarted = true;
        }

        const indexKnuckle = landmarks[5];
        const pinkyKnuckle = landmarks[17];
        const palmAngle = Math.atan2(
            pinkyKnuckle.y - indexKnuckle.y,
            pinkyKnuckle.x - indexKnuckle.x
        );

        if (lastPalmAngle !== null) {
            let angleDelta = palmAngle - lastPalmAngle;

            if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
            if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;

            if (Math.abs(angleDelta) >= ROTATION_DEADZONE) {
                targetVolume = Math.max(
                    0,
                    Math.min(
                        100,
                        targetVolume - angleDelta * 180 / Math.PI * VOLUME_PER_DEGREE
                    )
                );
            }
        }

        lastPalmAngle = palmAngle;

        volumeActive = true;

        volumeIndicator.classList.add(
            "active"
        );
    }


    /* ==========================================
       ANIMATION / LISSAGE
    ========================================== */

    function animateVolume() {

        currentVolume +=
            (
                targetVolume -
                currentVolume
            ) * SMOOTHING;

        const rounded =
            Math.round(
                currentVolume
            );

        volumeFill.style.width =
            `${rounded}%`;

        volumeValue.textContent =
            `${rounded} %`;

        if (rounded !== lastAppliedVolume) {
            applyVolume(rounded);
            lastAppliedVolume = rounded;
        }

        requestAnimationFrame(
            animateVolume
        );
    }


    /* ==========================================
       APPLICATION DU VOLUME
    ========================================== */

    function applyVolume(
        volume
    ) {

        setSpotifyVolume(volume);
    }


    /* ==========================================
       API POUR LE SYSTÈME DE GESTES
    ========================================== */

    window.myHubVolumeGesture =
        function(
            landmarks
        ) {

            updateVolumeFromRotation(landmarks);
        };


    /* ==========================================
       DÉMARRAGE
    ========================================== */

    animateVolume();

    console.log(
        "🔊 Contrôle du volume chargé."
    );

})();