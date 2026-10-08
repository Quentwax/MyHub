(() => {
    "use strict";

    const STORAGE_KEY = "myhub_disney_progress_v1";
    const EVENT_NAME = "myhub:disney-progress";
    const XP_PER_LEVEL = 750;
    const CHARACTER_IMAGES = window.MYHUB_DISNEY_CHARACTER_IMAGES || {};
    const RARITIES = [
        { id: "common", name: "Commun", chance: 55, duplicateXp: 25 },
        { id: "rare", name: "Rare", chance: 27, duplicateXp: 50 },
        { id: "epic", name: "Épique", chance: 14, duplicateXp: 100 },
        { id: "legendary", name: "Légendaire", chance: 4, duplicateXp: 200 }
    ];
    const CHARACTER_RARITIES = {
        common: [
            "donald", "daisy", "goofy", "olaf", "pluto", "chip", "dale", "peter-pan",
            "alice", "winnie", "tigger", "bambi", "dumbo", "jessie", "mike", "nemo",
            "dory", "remy-friend", "wall-e", "joy", "lightning-mcqueen", "timon", "pumbaa", "sulley", "luca"
        ],
        rare: [
            "mickey", "minnie", "stitch", "remy", "tinkerbell", "simba", "cheshire-cat",
            "cinderella", "ariel", "woody", "buzz", "mulan", "merida", "moana", "anna", "maui", "koda"
        ],
        epic: [
            "peter-pan-hook", "belle", "jasmine", "aurora", "rapunzel", "tiana", "elsa", "baymax",
            "pocahontas", "mirabel", "miguel"
        ],
        legendary: ["maleficent", "ursula", "scar"]
    };
    const CHARACTERS = [
        { id: "mickey", name: "Mickey", icon: "🐭" },
        { id: "minnie", name: "Minnie", icon: "🎀" },
        { id: "donald", name: "Donald", icon: "🦆" },
        { id: "daisy", name: "Daisy", icon: "🌼" },
        { id: "goofy", name: "Dingo", icon: "⭐" },
        { id: "stitch", name: "Stitch", icon: "🌺" },
        { id: "remy", name: "Rémy", icon: "🧀" },
        { id: "tinkerbell", name: "Clochette", icon: "✨" },
        { id: "simba", name: "Simba", icon: "🦁" },
        { id: "olaf", name: "Olaf", icon: "⛄" },
        { id: "pluto", name: "Pluto", icon: "🐕" },
        { id: "chip", name: "Tic", icon: "🐿️" },
        { id: "dale", name: "Tac", icon: "🌰" },
        { id: "peter-pan", name: "Peter Pan", icon: "🧚" },
        { id: "peter-pan-hook", name: "Capitaine Crochet", icon: "🏴‍☠️" },
        { id: "alice", name: "Alice", icon: "🐇" },
        { id: "cheshire-cat", name: "Chat du Cheshire", icon: "😺" },
        { id: "winnie", name: "Winnie l’ourson", icon: "🍯" },
        { id: "tigger", name: "Tigrou", icon: "🐯" },
        { id: "bambi", name: "Bambi", icon: "🦌" },
        { id: "dumbo", name: "Dumbo", icon: "🐘" },
        { id: "cinderella", name: "Cendrillon", icon: "👠" },
        { id: "belle", name: "Belle", icon: "🌹" },
        { id: "ariel", name: "Ariel", icon: "🧜‍♀️" },
        { id: "jasmine", name: "Jasmine", icon: "🪔" },
        { id: "aurora", name: "Aurore", icon: "👑" },
        { id: "mulan", name: "Mulan", icon: "🌸" },
        { id: "rapunzel", name: "Raiponce", icon: "🌞" },
        { id: "tiana", name: "Tiana", icon: "🐸" },
        { id: "merida", name: "Mérida", icon: "🏹" },
        { id: "moana", name: "Vaiana", icon: "🌊" },
        { id: "elsa", name: "Elsa", icon: "❄️" },
        { id: "anna", name: "Anna", icon: "⛄" },
        { id: "woody", name: "Woody", icon: "🤠" },
        { id: "buzz", name: "Buzz l’Éclair", icon: "🚀" },
        { id: "jessie", name: "Jessie", icon: "🤠" },
        { id: "sulley", name: "Sulli", icon: "👹" },
        { id: "mike", name: "Bob Razowski", icon: "👁️" },
        { id: "nemo", name: "Nemo", icon: "🐠" },
        { id: "dory", name: "Dory", icon: "🐟" },
        { id: "remy-friend", name: "Linguini", icon: "👨‍🍳" },
        { id: "wall-e", name: "WALL·E", icon: "🤖" },
        { id: "joy", name: "Joie", icon: "😊" },
        { id: "lightning-mcqueen", name: "Flash McQueen", icon: "🏎️" },
        { id: "timon", name: "Timon", icon: "🦦" },
        { id: "pumbaa", name: "Pumbaa", icon: "🐗" },
        { id: "baymax", name: "Baymax", icon: "🤍" },
        { id: "maleficent", name: "Maléfique", icon: "🐉" },
        { id: "ursula", name: "Ursula", icon: "🐙" },
        { id: "scar", name: "Scar", icon: "🦁" },
        { id: "maui", name: "Maui", icon: "🪝" },
        { id: "pocahontas", name: "Pocahontas", icon: "🍂" },
        { id: "mirabel", name: "Mirabel", icon: "🦋" },
        { id: "miguel", name: "Miguel", icon: "🎸" },
        { id: "luca", name: "Luca", icon: "🌊" },
        { id: "koda", name: "Koda", icon: "🐻" }
    ];
    for (const [rarity, characterIds] of Object.entries(CHARACTER_RARITIES)) {
        for (const id of characterIds) {
            const character = CHARACTERS.find(item => item.id === id);
            if (character) character.rarity = rarity;
        }
    }
    const CHARACTER_IDS = new Set(CHARACTERS.map(character => character.id));
    let discoveryOverlay = null;
    let discoveryQueue = Promise.resolve();

    function createDefaultProgress() {
        return { arcadeBestScore: 0, matchXp: 0, matchCapsules: 0, matchCapsulesSpent: 0, collection: [] };
    }

    function normalizeProgress(saved) {
        const progress = saved && typeof saved === "object" ? saved : {};
        const matchXp = Number.isSafeInteger(progress.matchXp) && progress.matchXp >= 0 ? progress.matchXp : 0;
        const earnedCapsules = Math.floor(matchXp / XP_PER_LEVEL);
        const matchCapsulesSpent = Number.isSafeInteger(progress.matchCapsulesSpent) && progress.matchCapsulesSpent >= 0
            ? progress.matchCapsulesSpent
            : Math.max(0, earnedCapsules - (Number.isSafeInteger(progress.matchCapsules) ? progress.matchCapsules : 0));
        return {
            arcadeBestScore: Number.isSafeInteger(progress.arcadeBestScore) && progress.arcadeBestScore >= 0
                ? progress.arcadeBestScore
                : 0,
            matchXp,
            matchCapsulesSpent,
            matchCapsules: Math.max(0, earnedCapsules - matchCapsulesSpent),
            collection: Array.isArray(progress.collection)
                ? [...new Set(progress.collection.filter(id => CHARACTER_IDS.has(id)))]
                : []
        };
    }

    function mergeProgress(local, remote) {
        const first = normalizeProgress(local);
        const second = normalizeProgress(remote);
        const matchXp = Math.max(first.matchXp, second.matchXp);
        const matchCapsulesSpent = Math.max(first.matchCapsulesSpent, second.matchCapsulesSpent);
        return normalizeProgress({
            arcadeBestScore: Math.max(first.arcadeBestScore, second.arcadeBestScore),
            matchXp,
            matchCapsulesSpent,
            collection: [...first.collection, ...second.collection]
        });
    }

    function readLegacyProgress() {
        const progress = createDefaultProgress();
        try {
            progress.arcadeBestScore = Math.max(0, Number(localStorage.getItem("myhub_disney_ticket_rush_v1")) || 0);
            const paradeCollection = JSON.parse(localStorage.getItem("myhub_parade_rush_collection_v1") || "[]");
            const matchProgress = JSON.parse(localStorage.getItem("myhub_disney_match_progress_v1") || "{}");
            if (matchProgress && typeof matchProgress === "object") {
                progress.matchXp = Number.isSafeInteger(matchProgress.xp) && matchProgress.xp >= 0 ? matchProgress.xp : 0;
                progress.matchCapsules = Number.isSafeInteger(matchProgress.capsules) && matchProgress.capsules >= 0
                    ? matchProgress.capsules
                    : 0;
                progress.matchCapsulesSpent = Math.max(
                    0,
                    Math.floor(progress.matchXp / XP_PER_LEVEL) - progress.matchCapsules
                );
            }
            progress.collection = [
                ...(Array.isArray(paradeCollection) ? paradeCollection : []),
                ...(Array.isArray(matchProgress?.collection) ? matchProgress.collection : [])
            ].filter(id => CHARACTER_IDS.has(id));
        } catch (error) {
            console.error("Impossible de charger les anciennes progressions Disney :", error);
        }
        return normalizeProgress(progress);
    }

    function read() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return normalizeProgress(JSON.parse(saved));
            const migrated = readLegacyProgress();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
        } catch (error) {
            console.error("Impossible de charger la progression Disney partagée :", error);
            return readLegacyProgress();
        }
    }

    function writeLocal(progress) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.error("Impossible d’enregistrer la progression Disney partagée :", error);
            throw error;
        }
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: progress }));
    }

    function createPortrait(character, className) {
        const portrait = document.createElement("span");
        portrait.className = className;
        portrait.setAttribute("aria-hidden", "true");

        const fallback = document.createElement("span");
        fallback.className = "disney-character-fallback";
        fallback.textContent = character.icon;
        portrait.appendChild(fallback);

        const imageSource = CHARACTER_IMAGES[character.id];
        if (typeof imageSource === "string" && imageSource.trim()) {
            const image = document.createElement("img");
            image.className = "disney-character-image";
            image.alt = "";
            image.loading = "lazy";
            image.addEventListener("load", () => {
                fallback.hidden = true;
                portrait.classList.add("has-image");
            }, { once: true });
            image.addEventListener("error", () => {
                console.warn(`Le portrait de ${character.name} n’a pas pu être chargé.`);
                image.remove();
            }, { once: true });
            image.src = imageSource;
            portrait.appendChild(image);
        }

        return portrait;
    }

    function createDiscoveryOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "discovery-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section class="discovery-card" role="dialog" aria-modal="true" aria-labelledby="discoveryTitle" aria-describedby="discoveryMessage" tabindex="-1">
                <button class="discovery-close" type="button" aria-label="Fermer">×</button>
                <span class="discovery-eyebrow">UNE NOUVELLE MERVEILLE !</span>
                <div class="discovery-stage" aria-hidden="true">
                    <div class="discovery-sparkles">✦ ✧ ✦</div>
                    <div class="discovery-capsule">
                        <span class="discovery-capsule-top"></span>
                        <span class="discovery-capsule-bottom"></span>
                        <span class="discovery-capsule-shine"></span>
                    </div>
                    <div class="discovery-portrait"></div>
                </div>
                <span class="discovery-rarity"></span>
                <h2 id="discoveryTitle">Une surprise t’attend…</h2>
                <p id="discoveryMessage">La capsule est en train de s’ouvrir.</p>
                <button class="discovery-continue" type="button">Continuer</button>
            </section>`;
        document.body.appendChild(overlay);

        return overlay;
    }

    function showDiscovery(character, alreadyCollected = false, onReveal = () => {}) {
        discoveryQueue = discoveryQueue.then(() => new Promise(resolve => {
            discoveryOverlay ||= createDiscoveryOverlay();
            const overlay = discoveryOverlay;
            const title = overlay.querySelector("#discoveryTitle");
            const message = overlay.querySelector("#discoveryMessage");
            const rarity = overlay.querySelector(".discovery-rarity");
            const portrait = overlay.querySelector(".discovery-portrait");
            const closeButton = overlay.querySelector(".discovery-close");
            const continueButton = overlay.querySelector(".discovery-continue");
            title.textContent = "Une surprise t’attend…";
            message.textContent = "La capsule est en train de s’ouvrir.";
            rarity.textContent = "";
            rarity.dataset.rarity = "";
            closeButton.disabled = true;
            continueButton.disabled = true;
            portrait.replaceChildren(createPortrait(character, "discovery-character-image"));
            overlay.hidden = false;
            overlay.classList.remove("is-revealed");
            void overlay.offsetWidth;
            overlay.classList.add("is-open");
            overlay.querySelector(".discovery-card").focus();

            const reveal = () => {
                const characterRarity = RARITIES.find(item => item.id === character.rarity);
                title.textContent = character.name;
                message.textContent = alreadyCollected
                    ? "Ce personnage fait déjà partie de ta collection !"
                    : "Ce personnage rejoint ta collection !";
                rarity.textContent = characterRarity?.name || "";
                rarity.dataset.rarity = character.rarity || "";
                onReveal();
                closeButton.disabled = false;
                continueButton.disabled = false;
                overlay.classList.add("is-revealed");
            };
            const finish = () => {
                overlay.hidden = true;
                overlay.classList.remove("is-open", "is-revealed");
                resolve();
            };
            const onContinue = () => {
                if (continueButton.disabled) return;
                continueButton.removeEventListener("click", onContinue);
                overlay.querySelector(".discovery-close").removeEventListener("click", onContinue);
                overlay.removeEventListener("click", onBackdrop);
                overlay.removeEventListener("keydown", onEscape);
                finish();
            };
            const onBackdrop = event => {
                if (event.target === overlay && !continueButton.disabled) onContinue();
            };
            const onEscape = event => {
                if (event.key === "Escape" && !continueButton.disabled) onContinue();
            };
            continueButton.addEventListener("click", onContinue, { once: true });
            overlay.querySelector(".discovery-close").addEventListener("click", onContinue, { once: true });
            overlay.addEventListener("click", onBackdrop);
            overlay.addEventListener("keydown", onEscape);

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                reveal();
            } else {
                window.setTimeout(reveal, 1050);
            }
        }));
        return discoveryQueue;
    }

    function update(changes) {
        const next = normalizeProgress({ ...read(), ...changes });
        writeLocal(next);
        window.MyHubCloudSync?.update("disneyProgress", next);
        return next;
    }

    window.MyHubCloudSync?.register("disneyProgress", {
        read,
        merge: mergeProgress,
        mergeUpdate: mergeProgress,
        apply: progress => writeLocal(normalizeProgress(progress))
    });

    window.MyHubDisneyProgress = {
        characters: CHARACTERS,
        rarities: RARITIES,
        createPortrait,
        showDiscovery,
        read,
        update,
        merge: mergeProgress,
        eventName: EVENT_NAME,
        storageKey: STORAGE_KEY
    };
})();
