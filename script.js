console.log("🔥 SCRIPT.JS EST BIEN CHARGÉ 🔥");


/* ==========================================
   HORLOGE
========================================== */

function updateClock() {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const currentTime = document.getElementById("currentTime");

    if (currentTime) {
        currentTime.textContent = `${hours}:${minutes}:${seconds}`;
    }

    const currentDate = document.getElementById("currentDate");

    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    const bigClock = document.getElementById("bigClock");

    if (bigClock) {
        bigClock.textContent = `${hours}:${minutes}:${seconds}`;
    }

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
    jarvisChat.scrollTop = jarvisChat.scrollHeight;
}


function processCommand(command) {

    const text = command.toLowerCase().trim();


    /* ==============================
       BONJOUR
    ============================== */

    if (
        text.includes("bonjour") ||
        text.includes("salut") ||
        text.includes("hello")
    ) {
        return "Bonjour ! Ravi de te revoir. 👋";
    }


    /* ==============================
       HEURE
    ============================== */

    if (text.includes("heure")) {

        const now = new Date();

        return `Il est actuellement ${now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        })}.`;
    }


    /* ==============================
       MYDLP
    ============================== */

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


    /* ==============================
       LUDOTHÈQUE
    ============================== */

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


    /* ==============================
       GITHUB
    ============================== */

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


    /* ==============================
       AIDE
    ============================== */

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


    /* ==============================
       COMMANDE INCONNUE
    ============================== */

    return "Je n'ai pas encore appris cette commande. 🤔";
}


function sendCommand() {

    if (!jarvisInput) {
        return;
    }

    const command = jarvisInput.value.trim();

    if (command === "") {
        return;
    }

    addMessage(
        "Vous",
        command,
        "user"
    );

    jarvisInput.value = "";

    const response = processCommand(command);

    setTimeout(() => {

        addMessage(
            "JARVIS",
            response,
            "jarvis"
        );

    }, 300);
}


if (jarvisSend) {

    jarvisSend.addEventListener(
        "click",
        sendCommand
    );
}


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

const sections = {

    "Accueil": "homeSection",
    "JARVIS": "jarvisSection",
    "MyDLP": "mydlpSection",
    "Ludothèque": "ludothequeSection",
    "Musique": "musicSection",
    "Paramètres": "settingsSection"

};


function showSection(sectionId) {

    const allSections =
        document.querySelectorAll(".page-section");

    allSections.forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });

    const targetSection =
        document.getElementById(sectionId);

    if (targetSection) {

        targetSection.classList.add(
            "active-section"
        );

    }
}


const sidebar =
    document.querySelector(".sidebar");


navItems.forEach(item => {

    item.addEventListener("click", () => {

        navItems.forEach(nav => {

            nav.classList.remove("active");

        });

        item.classList.add("active");

        const spans =
            item.querySelectorAll("span");

        if (spans.length < 2) {
            return;
        }

        const pageName =
            spans[1].textContent.trim();

        const sectionId =
            sections[pageName];

        if (sectionId) {

            showSection(sectionId);

        }

        if (sidebar) {

            sidebar.classList.remove("open");

        }

    });

});


/* ==========================================
   MENU MOBILE
========================================== */

const mobileMenu =
    document.getElementById("mobileMenu");


if (mobileMenu && sidebar) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

        }
    );

}


/* ==========================================
   SPOTIFY
========================================== */

const SPOTIFY_CLIENT_ID =
    "f921c0f743e04c6eafd0ebb1b2e79227";


/*
    IMPORTANT :

    Cette URL doit être exactement la même
    que celle enregistrée dans Spotify Developer.
*/

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
    localStorage.getItem("spotify_access_token");

let spotifyCurrentState = null;


/* ==========================================
   ÉLÉMENTS HTML SPOTIFY
========================================== */

const spotifyLogin =
    document.getElementById("spotifyLogin");

const spotifyPlayerElement =
    document.getElementById("spotifyPlayer");

const spotifyStatus =
    document.getElementById("spotifyStatus");

const spotifyConnectButton =
    document.getElementById("spotifyConnectButton");

const spotifyPlay =
    document.getElementById("spotifyPlay");

const spotifyPrevious =
    document.getElementById("spotifyPrevious");

const spotifyNext =
    document.getElementById("spotifyNext");

const spotifyProgress =
    document.getElementById("spotifyProgress");


console.log(
    "🎵 Éléments Spotify :",
    {
        login: spotifyLogin,
        player: spotifyPlayerElement,
        button: spotifyConnectButton
    }
);


/* ==========================================
   PKCE
========================================== */

function generateRandomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {

        result += characters.charAt(
            Math.floor(
                Math.random() * characters.length
            )
        );

    }

    return result;
}


async function generateCodeChallenge(codeVerifier) {

    const data =
        new TextEncoder().encode(codeVerifier);

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

    console.log(
        "🎵 Connexion Spotify..."
    );

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

        const state =
            generateRandomString(32);

        localStorage.setItem(
            "spotify_auth_state",
            state
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

                state:
                    state,

                code_challenge_method:
                    "S256",

                code_challenge:
                    codeChallenge

            });

        const authorizationURL =
            "https://accounts.spotify.com/authorize?" +
            params.toString();

        console.log(
            "➡️ Redirection Spotify :",
            authorizationURL
        );

        window.location.href =
            authorizationURL;

    } catch (error) {

        console.error(
            "❌ Erreur connexion Spotify :",
            error
        );

    }
}


/* ==========================================
   RAFRAÎCHIR LE TOKEN
========================================== */

async function refreshSpotifyToken() {

    const refreshToken =
        localStorage.getItem(
            "spotify_refresh_token"
        );

    if (!refreshToken) {

        console.log(
            "ℹ️ Aucun refresh token Spotify."
        );

        return false;
    }

    try {

        console.log(
            "🔄 Rafraîchissement du token Spotify..."
        );

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

                            grant_type:
                                "refresh_token",

                            refresh_token:
                                refreshToken,

                            client_id:
                                SPOTIFY_CLIENT_ID

                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            console.error(
                "❌ Impossible de rafraîchir le token :",
                data
            );

            return false;
        }

        spotifyAccessToken =
            data.access_token;

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );

        if (data.refresh_token) {

            localStorage.setItem(
                "spotify_refresh_token",
                data.refresh_token
            );

        }

        if (data.expires_in) {

            localStorage.setItem(
                "spotify_token_expires_at",
                String(
                    Date.now() +
                    data.expires_in * 1000
                )
            );

        }

        console.log(
            "✅ Token Spotify rafraîchi."
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Erreur refresh Spotify :",
            error
        );

        return false;
    }
}


/* ==========================================
   TOKEN VALIDE
========================================== */

async function ensureSpotifyToken() {

    const expiresAt =
        Number(
            localStorage.getItem(
                "spotify_token_expires_at"
            )
        );

    /*
        On considère le token expiré
        60 secondes avant sa vraie expiration.
    */

    if (
        spotifyAccessToken &&
        expiresAt &&
        Date.now() < expiresAt - 60000
    ) {

        return true;
    }

    if (spotifyAccessToken && !expiresAt) {

        /*
            Ancien token provenant de l'ancienne version.
            On tente d'abord de l'utiliser.
        */

        return true;
    }

    return await refreshSpotifyToken();
}


/* ==========================================
   CALLBACK SPOTIFY
========================================== */

async function handleSpotifyCallback() {

    console.log(
        "🔎 Vérification du callback Spotify..."
    );

    const params =
        new URLSearchParams(
            window.location.search
        );

    const code =
        params.get("code");

    const error =
        params.get("error");

    const returnedState =
        params.get("state");


    /* ==============================
       ERREUR
    ============================== */

    if (error) {

        console.error(
            "❌ Connexion Spotify refusée :",
            error
        );

        return;
    }


    /* ==============================
       PAS DE CODE
    ============================== */

    if (!code) {

        const hasToken =
            await ensureSpotifyToken();

        if (hasToken) {

            console.log(
                "🔑 Token Spotify disponible."
            );

            initializeSpotifyPlayer(
                spotifyAccessToken
            );

        } else {

            console.log(
                "ℹ️ Aucun compte Spotify connecté."
            );

        }

        return;
    }


    /* ==============================
       VÉRIFICATION STATE
    ============================== */

    const savedState =
        localStorage.getItem(
            "spotify_auth_state"
        );

    if (
        !savedState ||
        returnedState !== savedState
    ) {

        console.error(
            "❌ Erreur de sécurité : state Spotify invalide."
        );

        return;
    }


    /* ==============================
       CODE VERIFIER
    ============================== */

    const codeVerifier =
        localStorage.getItem(
            "spotify_code_verifier"
        );

    if (!codeVerifier) {

        console.error(
            "❌ Code verifier Spotify introuvable."
        );

        return;
    }


    /* ==============================
       TOKEN
    ============================== */

    try {

        console.log(
            "🔄 Récupération du token Spotify..."
        );

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
                "❌ Erreur Spotify :",
                data
            );

            return;
        }


        console.log(
            "✅ Connexion Spotify réussie !"
        );


        /* ==============================
           SAUVEGARDE TOKEN
        ============================== */

        spotifyAccessToken =
            data.access_token;

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );


        if (data.refresh_token) {

            localStorage.setItem(
                "spotify_refresh_token",
                data.refresh_token
            );

        }


        if (data.expires_in) {

            localStorage.setItem(
                "spotify_token_expires_at",
                String(
                    Date.now() +
                    data.expires_in * 1000
                )
            );

        }


        localStorage.removeItem(
            "spotify_code_verifier"
        );

        localStorage.removeItem(
            "spotify_auth_state"
        );


        /* ==============================
           NETTOYAGE URL
        ============================== */

        window.history.replaceState(
            {},
            document.title,
            SPOTIFY_REDIRECT_URI
        );


        /* ==============================
           INITIALISATION
        ============================== */

        initializeSpotifyPlayer(
            spotifyAccessToken
        );

    } catch (error) {

        console.error(
            "❌ Impossible de contacter Spotify :",
            error
        );

    }
}


/* ==========================================
   INITIALISATION PLAYER
========================================== */

function initializeSpotifyPlayer(accessToken) {

    if (!accessToken) {

        console.error(
            "❌ Aucun token Spotify."
        );

        return;
    }

    spotifyAccessToken =
        accessToken;


    if (typeof Spotify === "undefined") {

        console.error(
            "❌ Le SDK Spotify n'est pas disponible."
        );

        return;
    }


    if (spotifyPlayer) {

        console.log(
            "ℹ️ Player Spotify déjà initialisé."
        );

        return;
    }


    console.log(
        "🎵 Initialisation du lecteur Spotify..."
    );


    spotifyPlayer =
        new Spotify.Player({

            name:
                "MyHub",

            getOAuthToken:
                async callback => {

                    const valid =
                        await ensureSpotifyToken();

                    if (valid) {

                        callback(
                            spotifyAccessToken
                        );

                    }

                },

            volume:
                0.5
        });


    /* ==========================================
       PLAYER PRÊT
    ========================================== */

    spotifyPlayer.addListener(
        "ready",
        async ({ device_id }) => {

            spotifyDeviceId =
                device_id;

            console.log(
                "🎵 MyHub Spotify prêt !"
            );

            console.log(
                "Device ID :",
                device_id
            );


            if (spotifyLogin) {

                spotifyLogin.style.display =
                    "none";

            }


            if (spotifyPlayerElement) {

                spotifyPlayerElement.style.display =
                    "block";

            }


            if (spotifyStatus) {

                spotifyStatus.textContent =
                    "Connecté";

            }


            await transferPlaybackToMyHub();

            await updateSpotifyState();

        }
    );


    /* ==========================================
       MORCEAU CHANGÉ
    ========================================== */

    spotifyPlayer.addListener(
        "player_state_changed",
        state => {

            if (!state) {

                console.log(
                    "ℹ️ Aucun morceau en cours."
                );

                return;
            }

            spotifyCurrentState =
                state;

            updateSpotifyTrack(state);

            updateSpotifyProgress(state);

            updateSpotifyPlayButton(state);

        }
    );


    /* ==========================================
       NOT READY
    ========================================== */

    spotifyPlayer.addListener(
        "not_ready",
        ({ device_id }) => {

            console.log(
                "⚠️ Spotify déconnecté :",
                device_id
            );

        }
    );


    /* ==========================================
       ERREURS
    ========================================== */

    spotifyPlayer.addListener(
        "initialization_error",
        ({ message }) => {

            console.error(
                "❌ Erreur initialisation Spotify :",
                message
            );

        }
    );


    spotifyPlayer.addListener(
        "authentication_error",
        ({ message }) => {

            console.error(
                "❌ Erreur authentification Spotify :",
                message
            );

        }
    );


    spotifyPlayer.addListener(
        "account_error",
        ({ message }) => {

            console.error(
                "❌ Erreur compte Spotify :",
                message
            );

        }
    );


    spotifyPlayer.addListener(
        "playback_error",
        ({ message }) => {

            console.error(
                "❌ Erreur lecture Spotify :",
                message
            );

        }
    );


    spotifyPlayer.addListener(
        "autoplay_failed",
        () => {

            console.log(
                "⚠️ Lecture automatique bloquée par le navigateur."
            );

        }
    );


    /* ==========================================
       CONNEXION
    ========================================== */

    spotifyPlayer
        .connect()
        .then(success => {

            console.log(
                "🔌 Connexion du player Spotify :",
                success
            );

        })
        .catch(error => {

            console.error(
                "❌ Impossible de connecter le player Spotify :",
                error
            );

        });
}


/* ==========================================
   TRANSFERT VERS MYHUB
========================================== */

async function transferPlaybackToMyHub() {

    if (
        !spotifyAccessToken ||
        !spotifyDeviceId
    ) {

        return;
    }


    console.log(
        "🔄 Transfert de la lecture vers MyHub..."
    );


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

                            device_ids: [
                                spotifyDeviceId
                            ],

                            play: false

                        })
                }
            );


        if (
            !response.ok &&
            response.status !== 204
        ) {

            const error =
                await response.text();

            console.error(
                "❌ Erreur transfert Spotify :",
                error
            );

            return;
        }


        console.log(
            "✅ Lecture transférée vers MyHub."
        );

    } catch (error) {

        console.error(
            "❌ Erreur transfert :",
            error
        );

    }
}


/* ==========================================
   ÉTAT DU PLAYER
========================================== */

async function updateSpotifyState() {

    if (!spotifyPlayer) {

        return;
    }


    try {

        const state =
            await spotifyPlayer.getCurrentState();


        if (!state) {

            console.log(
                "ℹ️ Aucun morceau dans le lecteur MyHub."
            );

            return;
        }


        spotifyCurrentState =
            state;

        updateSpotifyTrack(state);

        updateSpotifyProgress(state);

        updateSpotifyPlayButton(state);

    } catch (error) {

        console.error(
            "❌ Erreur état Spotify :",
            error
        );

    }
}


/* ==========================================
   AFFICHER LE MORCEAU
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
            document.createElement("img");


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

function updateSpotifyPlayButton(state) {

    if (!spotifyPlay) {

        return;
    }


    spotifyPlay.textContent =
        state.paused
            ? "▶"
            : "⏸";
}


/* ==========================================
   PROGRESSION
========================================== */

function updateSpotifyProgress(state) {

    if (!state) {

        return;
    }


    if (spotifyProgress) {

        spotifyProgress.max =
            state.duration;

        spotifyProgress.value =
            state.position;

    }


    const currentTime =
        document.getElementById(
            "spotifyCurrentTime"
        );

    const duration =
        document.getElementById(
            "spotifyDuration"
        );


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
   FORMAT TEMPS
========================================== */

function formatSpotifyTime(milliseconds) {

    if (!milliseconds) {

        return "0:00";
    }


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
        minutes +
        ":" +
        String(seconds).padStart(
            2,
            "0"
        )
    );
}


/* ==========================================
   PLAY / PAUSE
========================================== */

if (spotifyPlay) {

    spotifyPlay.addEventListener(
        "click",
        async () => {

            if (!spotifyPlayer) {

                console.warn(
                    "⚠️ Player Spotify non disponible."
                );

                return;
            }


            try {

                await spotifyPlayer.activateElement();

                await spotifyPlayer.togglePlay();

            } catch (error) {

                console.error(
                    "❌ Erreur Play/Pause :",
                    error
                );

            }

        }
    );

}


/* ==========================================
   MORCEAU PRÉCÉDENT
========================================== */

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
                    "❌ Erreur morceau précédent :",
                    error
                );

            }

        }
    );

}


/* ==========================================
   MORCEAU SUIVANT
========================================== */

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
                    "❌ Erreur morceau suivant :",
                    error
                );

            }

        }
    );

}


/* ==========================================
   BARRE DE PROGRESSION
========================================== */

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
                    "❌ Erreur déplacement dans le morceau :",
                    error
                );

            }

        }
    );

}


/* ==========================================
   BOUTON CONNEXION SPOTIFY
========================================== */

if (spotifyConnectButton) {

    spotifyConnectButton.addEventListener(
        "click",
        connectSpotify
    );

    console.log(
        "✅ Bouton Spotify trouvé."
    );

} else {

    console.warn(
        "⚠️ Bouton spotifyConnectButton introuvable dans le HTML."
    );

}


/* ==========================================
   LANCEMENT SPOTIFY
========================================== */

console.log(
    "🔥 SCRIPT MYHUB CHARGÉ"
);

handleSpotifyCallback();