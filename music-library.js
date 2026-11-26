/* ==========================================
   J.A.R.V.I.S MUSIC — bibliothèque locale
   Les fichiers restent dans IndexedDB sur cet appareil.
========================================== */
(() => {
    "use strict";

    const DB_NAME = "myhub-jarvis-music";
    const DB_VERSION = 1;
    const STORE_NAME = "tracks";
    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    const elements = {
        fileInput: document.getElementById("musicFileInput"),
        importButton: document.getElementById("musicImportButton"),
        search: document.getElementById("musicSearchInput"),
        list: document.getElementById("musicTrackList"),
        status: document.getElementById("musicLibraryStatus"),
        audio: document.getElementById("musicAudio"),
        title: document.getElementById("musicNowTitle"),
        artist: document.getElementById("musicNowArtist"),
        cover: document.getElementById("musicNowCover"),
        play: document.getElementById("musicPlayButton"),
        previous: document.getElementById("musicPreviousButton"),
        next: document.getElementById("musicNextButton"),
        progress: document.getElementById("musicProgress"),
        currentTime: document.getElementById("musicCurrentTime"),
        duration: document.getElementById("musicDuration"),
        volume: document.getElementById("musicVolume"),
        count: document.getElementById("musicTrackCount")
    };

    let database = null;
    let tracks = [];
    let currentTrackId = null;
    let currentObjectUrl = null;
    let displayedTracks = [];

    function setStatus(message, isError = false) {
        if (!elements.status) return;
        elements.status.textContent = message;
        elements.status.classList.toggle("is-error", isError);
    }

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(new Error("Ce navigateur ne prend pas en charge le stockage local des musiques."));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    store.createIndex("title", "title", { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Impossible d'ouvrir la bibliothèque."));
        });
    }

    function storeRequest(mode, action) {
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, mode);
            const request = action(transaction.objectStore(STORE_NAME));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Erreur de stockage."));
        });
    }

    function getAllTracks() {
        return storeRequest("readonly", store => store.getAll());
    }

    function saveTrack(track) {
        return storeRequest("readwrite", store => store.put(track));
    }

    function removeTrack(id) {
        return storeRequest("readwrite", store => store.delete(id));
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    }

    function makeId() {
        return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function getTrackTitle(fileName) {
        return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Sans titre";
    }

    async function importSelectedFiles() {
        const files = Array.from(elements.fileInput?.files || []);
        if (!files.length) {
            setStatus("Choisis d'abord un ou plusieurs fichiers audio.", true);
            return;
        }

        let imported = 0;
        let skipped = 0;
        setStatus("Importation en cours…");

        for (const file of files) {
            const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name);
            if (!isAudio || file.size > MAX_FILE_SIZE) {
                skipped++;
                continue;
            }

            try {
                await saveTrack({
                    id: makeId(),
                    title: getTrackTitle(file.name),
                    artist: "Artiste inconnu",
                    fileName: file.name,
                    type: file.type || "audio/mpeg",
                    size: file.size,
                    addedAt: Date.now(),
                    audioBlob: file,
                    favorite: false
                });
                imported++;
            } catch (error) {
                console.error("Importation audio impossible :", error);
                skipped++;
            }
        }

        elements.fileInput.value = "";
        await refreshLibrary();
        setStatus(`${imported} musique(s) importée(s)${skipped ? ` · ${skipped} fichier(s) ignoré(s)` : ""}.`);
    }

    function renderTracks() {
        if (!elements.list) return;
        const query = (elements.search?.value || "").trim().toLocaleLowerCase("fr");
        displayedTracks = tracks.filter(track => `${track.title} ${track.artist} ${track.fileName}`.toLocaleLowerCase("fr").includes(query));
        elements.list.replaceChildren();

        if (!displayedTracks.length) {
            const empty = document.createElement("div");
            empty.className = "music-empty-state";
            empty.textContent = tracks.length ? "Aucun résultat pour cette recherche." : "Ta bibliothèque est vide. Importe tes premiers fichiers audio pour commencer.";
            elements.list.appendChild(empty);
        } else {
            displayedTracks.forEach((track, index) => {
                const row = document.createElement("article");
                row.className = `music-track-row${track.id === currentTrackId ? " is-current" : ""}`;

                const play = document.createElement("button");
                play.className = "music-track-main";
                play.type = "button";
                play.setAttribute("aria-label", `Lire ${track.title}`);
                const icon = document.createElement("span");
                icon.className = "music-track-icon";
                icon.textContent = track.id === currentTrackId && !elements.audio.paused ? "♫" : "▶";
                const details = document.createElement("span");
                details.className = "music-track-details";
                const title = document.createElement("strong");
                title.textContent = track.title;
                const artist = document.createElement("small");
                artist.textContent = track.artist;
                details.append(title, artist);
                play.append(icon, details);
                play.addEventListener("click", () => playTrack(track.id));

                const favorite = document.createElement("button");
                favorite.className = "music-icon-button";
                favorite.type = "button";
                favorite.textContent = track.favorite ? "♥" : "♡";
                favorite.title = track.favorite ? "Retirer des favoris" : "Ajouter aux favoris";
                favorite.setAttribute("aria-label", favorite.title);
                favorite.addEventListener("click", async () => {
                    await saveTrack({ ...track, favorite: !track.favorite });
                    await refreshLibrary();
                });

                const remove = document.createElement("button");
                remove.className = "music-icon-button music-delete-button";
                remove.type = "button";
                remove.textContent = "×";
                remove.title = "Supprimer de la bibliothèque";
                remove.setAttribute("aria-label", `Supprimer ${track.title}`);
                remove.addEventListener("click", async () => {
                    if (!window.confirm(`Supprimer « ${track.title} » de ta bibliothèque sur cet appareil ?`)) return;
                    if (currentTrackId === track.id) stopPlayback();
                    await removeTrack(track.id);
                    await refreshLibrary();
                    setStatus("Musique supprimée de cet appareil.");
                });

                const number = document.createElement("span");
                number.className = "music-track-number";
                number.textContent = String(index + 1).padStart(2, "0");
                row.append(number, play, favorite, remove);
                elements.list.appendChild(row);
            });
        }

        if (elements.count) elements.count.textContent = `${tracks.length} titre${tracks.length === 1 ? "" : "s"}`;
    }

    async function refreshLibrary() {
        tracks = await getAllTracks();
        tracks.sort((a, b) => b.addedAt - a.addedAt);
        renderTracks();
    }

    function stopPlayback() {
        elements.audio.pause();
        elements.audio.removeAttribute("src");
        elements.audio.load();
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
        currentTrackId = null;
        elements.title.textContent = "Aucun morceau";
        elements.artist.textContent = "Choisis une musique dans ta bibliothèque";
        elements.cover.textContent = "♪";
        elements.play.textContent = "▶";
        elements.progress.value = "0";
        elements.currentTime.textContent = "0:00";
        elements.duration.textContent = "0:00";
        renderTracks();
    }

    async function playTrack(id) {
        const track = tracks.find(item => item.id === id) || await storeRequest("readonly", store => store.get(id));
        if (!track) return;

        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = URL.createObjectURL(track.audioBlob);
        currentTrackId = track.id;
        elements.audio.src = currentObjectUrl;
        elements.title.textContent = track.title;
        elements.artist.textContent = track.artist;
        elements.cover.textContent = "♫";
        elements.play.textContent = "Ⅱ";
        renderTracks();

        try {
            await elements.audio.play();
        } catch (error) {
            elements.play.textContent = "▶";
            setStatus("Lecture impossible. Vérifie le format du fichier audio.", true);
            console.error("Lecture audio impossible :", error);
        }
    }

    function playRelative(direction) {
        if (!tracks.length) return;
        const currentIndex = tracks.findIndex(track => track.id === currentTrackId);
        const nextIndex = currentIndex < 0
            ? 0
            : (currentIndex + direction + tracks.length) % tracks.length;
        playTrack(tracks[nextIndex].id);
    }

    function bindEvents() {
        elements.importButton?.addEventListener("click", () => elements.fileInput?.click());
        elements.fileInput?.addEventListener("change", importSelectedFiles);
        elements.search?.addEventListener("input", renderTracks);
        elements.play?.addEventListener("click", async () => {
            if (!currentTrackId) {
                playRelative(1);
            } else if (elements.audio.paused) {
                try { await elements.audio.play(); } catch (error) { setStatus("Impossible de reprendre la lecture.", true); }
            } else {
                elements.audio.pause();
            }
        });
        elements.previous?.addEventListener("click", () => playRelative(-1));
        elements.next?.addEventListener("click", () => playRelative(1));
        elements.volume?.addEventListener("input", () => { elements.audio.volume = Number(elements.volume.value) / 100; });
        elements.progress?.addEventListener("input", () => {
            if (Number.isFinite(elements.audio.duration)) {
                elements.audio.currentTime = (Number(elements.progress.value) / 100) * elements.audio.duration;
            }
        });
        elements.audio?.addEventListener("timeupdate", () => {
            const duration = elements.audio.duration || 0;
            elements.progress.value = duration ? String((elements.audio.currentTime / duration) * 100) : "0";
            elements.currentTime.textContent = formatTime(elements.audio.currentTime);
            elements.duration.textContent = formatTime(duration);
        });
        elements.audio?.addEventListener("play", () => { elements.play.textContent = "Ⅱ"; renderTracks(); });
        elements.audio?.addEventListener("pause", () => { elements.play.textContent = "▶"; renderTracks(); });
        elements.audio?.addEventListener("ended", () => playRelative(1));
    }

    async function initialize() {
        if (!elements.list) return;
        bindEvents();
        elements.audio.volume = Number(elements.volume?.value || 70) / 100;
        try {
            database = await openDatabase();
            await refreshLibrary();
            setStatus("Bibliothèque locale prête · tes fichiers restent sur cet appareil.");
        } catch (error) {
            console.error("Initialisation de JARVIS Music impossible :", error);
            setStatus(error.message || "Impossible de charger la bibliothèque musicale.", true);
            if (elements.importButton) elements.importButton.disabled = true;
        }
    }

    initialize();
    window.JarvisMusic = {
        play: () => currentTrackId ? elements.audio.play() : playRelative(1),
        pause: () => elements.audio.pause(),
        next: () => playRelative(1),
        previous: () => playRelative(-1),
        setVolume: value => { elements.audio.volume = Math.max(0, Math.min(1, Number(value) / 100)); },
        search: query => { if (elements.search) { elements.search.value = String(query || ""); renderTracks(); } },
        open: () => window.showSection?.("jarvisMusicSection")
    };
})();
