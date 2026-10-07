(() => {
    "use strict";

    const STORAGE_KEY = "myhub_disney_match_progress_v1";
    const BOARD_SIZE = 8;
    const ROUND_SECONDS = 60;
    const XP_PER_LEVEL = 750;
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
        { id: "scar", name: "Scar", icon: "🦁" }
    ];
    const TILES = [
        { icon: "🏰", name: "château" },
        { icon: "🎠", name: "manège" },
        { icon: "🎆", name: "feu d’artifice" },
        { icon: "🎈", name: "ballon" },
        { icon: "🍭", name: "sucrerie" },
        { icon: "⭐", name: "étoile" }
    ];

    const boardElement = document.getElementById("matchBoard");
    const messageElement = document.getElementById("matchMessage");
    if (!boardElement || !messageElement) return;

    const ui = {
        level: document.getElementById("matchLevel"),
        xpText: document.getElementById("matchXpText"),
        xpFill: document.getElementById("matchXpFill"),
        xpTrack: document.querySelector(".match-xp-track"),
        capsules: document.getElementById("matchCapsules"),
        timer: document.getElementById("matchTimer"),
        sessionXp: document.getElementById("matchSessionXp"),
        start: document.getElementById("matchStart"),
        shuffle: document.getElementById("matchShuffle"),
        gacha: document.getElementById("matchGacha"),
        reveal: document.getElementById("matchReveal"),
        collection: document.getElementById("matchCollection"),
        collectionCount: document.getElementById("matchCollectionCount")
    };

    let xp = 0;
    let capsules = 0;
    let collection = [];
    let board = [];
    let selectedIndex = null;
    let sessionXp = 0;
    let deadline = 0;
    let timerInterval = null;
    let playing = false;
    let resolving = false;
    let turnId = 0;

    function showMessage(text) {
        messageElement.textContent = text;
    }

    function currentLevel() {
        return Math.floor(xp / XP_PER_LEVEL) + 1;
    }

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp, capsules, collection }));
        } catch {
            showMessage("La progression n’a pas pu être enregistrée sur cet appareil.");
        }
    }

    function loadProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            xp = Number.isSafeInteger(saved.xp) && saved.xp >= 0 ? saved.xp : 0;
            capsules = Number.isSafeInteger(saved.capsules) && saved.capsules >= 0 ? saved.capsules : 0;
            collection = Array.isArray(saved.collection)
                ? CHARACTERS.filter(character => saved.collection.includes(character.id)).map(character => character.id)
                : [];
        } catch {
            showMessage("La sauvegarde n’a pas pu être lue. Une nouvelle progression a été créée.");
        }
    }

    function renderProgress() {
        const progress = xp % XP_PER_LEVEL;
        ui.level.textContent = String(currentLevel());
        ui.xpText.textContent = `${progress} / ${XP_PER_LEVEL} XP`;
        ui.xpFill.style.width = `${progress}%`;
        ui.xpTrack.setAttribute("aria-valuemax", String(XP_PER_LEVEL));
        ui.xpTrack.setAttribute("aria-valuenow", String(progress));
        ui.capsules.textContent = String(capsules);
        ui.gacha.disabled = capsules === 0;
    }

    function renderCollection() {
        ui.collectionCount.textContent = `${collection.length} / ${CHARACTERS.length}`;
        ui.collection.replaceChildren(...CHARACTERS.map(character => {
            const isCollected = collection.includes(character.id);
            const item = document.createElement("div");
            const icon = document.createElement("span");
            const name = document.createElement("strong");
            item.className = `match-character${isCollected ? " collected" : ""}`;
            item.setAttribute("aria-label", isCollected ? `${character.name}, collectionné` : "Personnage à découvrir");
            icon.className = "match-character-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = isCollected ? character.icon : "?";
            name.textContent = isCollected ? character.name : "À découvrir";
            item.append(icon, name);
            return item;
        }));
    }

    function addXp(amount) {
        const oldLevel = currentLevel();
        xp += amount;
        const levelsGained = currentLevel() - oldLevel;
        if (levelsGained > 0) capsules += levelsGained;
        renderProgress();
        saveProgress();
        return levelsGained;
    }

    function randomTile() {
        return Math.floor(Math.random() * TILES.length);
    }

    function findMatches(cells) {
        const matches = new Set();
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            let runStart = 0;
            for (let column = 1; column <= BOARD_SIZE; column += 1) {
                const previous = cells[row * BOARD_SIZE + column - 1];
                const current = column < BOARD_SIZE ? cells[row * BOARD_SIZE + column] : null;
                if (current !== previous) {
                    if (previous !== null && column - runStart >= 3) {
                        for (let index = runStart; index < column; index += 1) matches.add(row * BOARD_SIZE + index);
                    }
                    runStart = column;
                }
            }
        }
        for (let column = 0; column < BOARD_SIZE; column += 1) {
            let runStart = 0;
            for (let row = 1; row <= BOARD_SIZE; row += 1) {
                const previous = cells[(row - 1) * BOARD_SIZE + column];
                const current = row < BOARD_SIZE ? cells[row * BOARD_SIZE + column] : null;
                if (current !== previous) {
                    if (previous !== null && row - runStart >= 3) {
                        for (let index = runStart; index < row; index += 1) matches.add(index * BOARD_SIZE + column);
                    }
                    runStart = row;
                }
            }
        }
        return matches;
    }

    function hasValidMove(cells) {
        for (let index = 0; index < cells.length; index += 1) {
            const neighbors = [];
            if (index % BOARD_SIZE < BOARD_SIZE - 1) neighbors.push(index + 1);
            if (index < (BOARD_SIZE - 1) * BOARD_SIZE) neighbors.push(index + BOARD_SIZE);
            for (const neighbor of neighbors) {
                [cells[index], cells[neighbor]] = [cells[neighbor], cells[index]];
                const isValid = findMatches(cells).size > 0;
                [cells[index], cells[neighbor]] = [cells[neighbor], cells[index]];
                if (isValid) return true;
            }
        }
        return false;
    }

    function createBoard() {
        for (let attempt = 0; attempt < 100; attempt += 1) {
            const cells = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
            for (let index = 0; index < cells.length; index += 1) {
                let tile;
                do {
                    tile = randomTile();
                } while (
                    (index % BOARD_SIZE >= 2 && cells[index - 1] === tile && cells[index - 2] === tile) ||
                    (index >= BOARD_SIZE * 2 && cells[index - BOARD_SIZE] === tile && cells[index - BOARD_SIZE * 2] === tile)
                );
                cells[index] = tile;
            }
            if (hasValidMove(cells)) return cells;
        }
        return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => Math.floor(index / BOARD_SIZE) % TILES.length);
    }

    function renderBoard(matches = new Set()) {
        boardElement.replaceChildren(...board.map((tile, index) => {
            const button = document.createElement("button");
            const tileInfo = TILES[tile];
            button.type = "button";
            button.className = `match-tile${selectedIndex === index ? " selected" : ""}${matches.has(index) ? " clearing" : ""}`;
            button.dataset.index = String(index);
            button.textContent = tileInfo.icon;
            button.setAttribute("role", "gridcell");
            button.setAttribute("aria-label", `${tileInfo.name}, ligne ${Math.floor(index / BOARD_SIZE) + 1}, colonne ${index % BOARD_SIZE + 1}`);
            button.setAttribute("aria-selected", String(selectedIndex === index));
            button.disabled = !playing || resolving;
            return button;
        }));
        ui.shuffle.disabled = !playing || resolving;
        ui.start.disabled = playing;
        ui.start.textContent = playing ? "Partie en cours…" : "Lancer une partie · 1 min";
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }

    function endGame() {
        playing = false;
        resolving = false;
        turnId += 1;
        clearInterval(timerInterval);
        timerInterval = null;
        selectedIndex = null;
        ui.timer.textContent = "00:00";
        ui.timer.classList.remove("urgent");
        renderBoard();
        showMessage(`Temps écoulé ! Tu as gagné ${sessionXp} XP pendant cette partie.`);
    }

    function updateTimer() {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        ui.timer.textContent = formatTime(remaining);
        ui.timer.classList.toggle("urgent", remaining <= 15);
        if (remaining === 0) endGame();
    }

    function startGame() {
        if (playing) return;
        turnId += 1;
        board = createBoard();
        selectedIndex = null;
        sessionXp = 0;
        ui.sessionXp.textContent = "0";
        ui.reveal.textContent = "Ta prochaine surprise t’attend !";
        playing = true;
        resolving = false;
        deadline = Date.now() + ROUND_SECONDS * 1000;
        updateTimer();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 250);
        renderBoard();
        showMessage("C’est parti ! Fais des alignements pour gagner de l’XP.");
    }

    function shuffleBoard() {
        if (!playing || resolving) return;
        board = createBoard();
        selectedIndex = null;
        renderBoard();
        showMessage("La grille a été mélangée. À toi de jouer !");
    }

    async function resolveMatches(gameTurn) {
        resolving = true;
        renderBoard();
        let chain = 0;
        while (playing && gameTurn === turnId) {
            const matches = findMatches(board);
            if (matches.size === 0) break;
            chain += 1;
            const reward = matches.size * 5 * chain;
            sessionXp += reward;
            ui.sessionXp.textContent = String(sessionXp);
            const levelsGained = addXp(reward);
            const levelMessage = levelsGained > 0
                ? ` Niveau ${currentLevel()} atteint : ${levelsGained} capsule${levelsGained > 1 ? "s" : ""} gagnée${levelsGained > 1 ? "s" : ""} !`
                : "";
            showMessage(`+${reward} XP${chain > 1 ? ` · combo ×${chain}` : ""}.${levelMessage}`);
            renderBoard(matches);
            await new Promise(resolve => setTimeout(resolve, 170));
            if (!playing || gameTurn !== turnId) return;

            for (const index of matches) board[index] = null;
            for (let column = 0; column < BOARD_SIZE; column += 1) {
                const remaining = [];
                for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
                    const tile = board[row * BOARD_SIZE + column];
                    if (tile !== null) remaining.push(tile);
                }
                for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
                    board[row * BOARD_SIZE + column] = remaining[BOARD_SIZE - 1 - row] ?? randomTile();
                }
            }
            renderBoard();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!playing || gameTurn !== turnId) return;
        resolving = false;
        if (!hasValidMove(board)) {
            board = createBoard();
            showMessage("Plus de combinaison possible : la grille a été mélangée.");
        }
        renderBoard();
    }

    function isAdjacent(first, second) {
        const rowDistance = Math.abs(Math.floor(first / BOARD_SIZE) - Math.floor(second / BOARD_SIZE));
        const columnDistance = Math.abs((first % BOARD_SIZE) - (second % BOARD_SIZE));
        return rowDistance + columnDistance === 1;
    }

    boardElement.addEventListener("click", event => {
        const button = event.target.closest(".match-tile");
        if (!button || !playing || resolving) return;
        const index = Number(button.dataset.index);
        if (!Number.isInteger(index) || index < 0 || index >= board.length) return;

        if (selectedIndex === null) {
            selectedIndex = index;
            renderBoard();
            return;
        }
        if (selectedIndex === index) {
            selectedIndex = null;
            renderBoard();
            return;
        }
        if (!isAdjacent(selectedIndex, index)) {
            selectedIndex = index;
            renderBoard();
            return;
        }

        const firstIndex = selectedIndex;
        [board[firstIndex], board[index]] = [board[index], board[firstIndex]];
        selectedIndex = null;
        const matches = findMatches(board);
        if (matches.size === 0) {
            [board[firstIndex], board[index]] = [board[index], board[firstIndex]];
            renderBoard();
            showMessage("Pas d’alignement : essaie un autre échange.");
            return;
        }
        const gameTurn = turnId;
        void resolveMatches(gameTurn);
    });

    ui.start.addEventListener("click", startGame);
    ui.shuffle.addEventListener("click", shuffleBoard);
    ui.gacha.addEventListener("click", () => {
        if (capsules < 1) return;
        capsules -= 1;
        const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const alreadyCollected = collection.includes(character.id);
        if (!alreadyCollected) {
            collection.push(character.id);
            ui.reveal.textContent = `${character.icon} ${character.name} rejoint ta collection !`;
            showMessage(`${character.name} a rejoint ta collection !`);
        } else {
            ui.reveal.textContent = `${character.icon} ${character.name} · doublon : +25 XP`;
            const levelsGained = addXp(25);
            showMessage(levelsGained > 0
                ? `Doublon converti en XP : niveau ${currentLevel()} atteint, capsule gagnée !`
                : `Doublon converti en 25 XP. Merci, ${character.name} !`);
        }
        renderCollection();
        renderProgress();
        saveProgress();
    });

    loadProgress();
    renderProgress();
    renderCollection();
    board = createBoard();
    renderBoard();
})();
