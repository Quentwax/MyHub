(() => {
    "use strict";

    const progressStore = window.MyHubDisneyProgress;
    const CHARACTERS = progressStore.characters;
    const BOARD_SIZE = 8;
    const ROUND_SECONDS = 60;
    const XP_PER_LEVEL = 750;
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
        arcadeBest: document.getElementById("matchArcadeBest"),
        timer: document.getElementById("matchTimer"),
        sessionXp: document.getElementById("matchSessionXp"),
        start: document.getElementById("matchStart"),
        shuffle: document.getElementById("matchShuffle"),
        gacha: document.getElementById("matchGacha"),
        reveal: document.getElementById("matchReveal"),
        collection: document.getElementById("matchCollection"),
        collectionCount: document.getElementById("matchCollectionCount"),
        tabCollectionCount: document.getElementById("matchTabCollectionCount")
    };

    let xp = 0;
    let capsules = 0;
    let collection = [];
    let board = [];
    let selectedIndex = null;
    let powerPlacementIndex = null;
    let dragStartIndex = null;
    let suppressClick = false;
    let collectionFilter = "all";
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
            const progress = progressStore.update({
                matchXp: xp,
                matchCapsules: capsules,
                collection
            });
            xp = progress.matchXp;
            capsules = progress.matchCapsules;
        } catch {
            showMessage("La progression n’a pas pu être enregistrée sur cet appareil.");
        }
    }

    function loadProgress() {
        const saved = progressStore.read();
        xp = saved.matchXp;
        capsules = saved.matchCapsules;
        collection = saved.collection;
    }

    function renderProgress() {
        const progress = xp % XP_PER_LEVEL;
        ui.level.textContent = String(currentLevel());
        ui.xpText.textContent = `${progress} / ${XP_PER_LEVEL} XP`;
        ui.xpFill.style.width = `${progress}%`;
        ui.xpTrack.setAttribute("aria-valuemax", String(XP_PER_LEVEL));
        ui.xpTrack.setAttribute("aria-valuenow", String(progress));
        ui.capsules.textContent = String(capsules);
        ui.arcadeBest.textContent = String(progressStore.read().arcadeBestScore).padStart(5, "0");
        ui.gacha.disabled = capsules === 0;
    }

    function renderCollection() {
        const collectedCount = CHARACTERS.filter(character => collection.includes(character.id)).length;
        ui.collectionCount.textContent = `${collectedCount} / ${CHARACTERS.length} personnages`;
        ui.tabCollectionCount.textContent = `${collectedCount} / ${CHARACTERS.length}`;
        const visibleCharacters = CHARACTERS.filter(character => {
            const isCollected = collection.includes(character.id);
            return collectionFilter === "all" ||
                (collectionFilter === "collected" && isCollected) ||
                (collectionFilter === "locked" && !isCollected);
        });
        ui.collection.replaceChildren(...visibleCharacters.map(character => {
            const isCollected = collection.includes(character.id);
            const item = document.createElement("div");
            const name = document.createElement("strong");
            const rarity = progressStore.rarities.find(item => item.id === character.rarity);
            item.className = `match-character rarity-${character.rarity || "common"}${isCollected ? " collected" : ""}`;
            item.setAttribute("aria-label", isCollected
                ? `${character.name}, ${rarity?.name || "Commun"}, collectionné`
                : `Personnage à découvrir, rareté ${rarity?.name || "Commun"}`);
            const portrait = progressStore.createPortrait(
                isCollected ? character : { ...character, icon: "?" },
                "disney-character-image match-character-icon",
                isCollected
            );
            item.classList.toggle("locked", !isCollected);
            name.textContent = isCollected ? character.name : "À découvrir";
            const details = document.createElement("span");
            const rarityName = document.createElement("small");
            details.className = "match-character-details";
            rarityName.textContent = rarity?.name || "Commun";
            details.append(name, rarityName);
            item.append(portrait, details);
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

    function tileType(tile) {
        return tile === null ? null : tile.type;
    }

    function randomTile() {
        return { type: Math.floor(Math.random() * TILES.length), power: null };
    }

    function findMatchRuns(cells) {
        const runs = [];
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            let runStart = 0;
            for (let column = 1; column <= BOARD_SIZE; column += 1) {
                const previous = tileType(cells[row * BOARD_SIZE + column - 1]);
                const current = column < BOARD_SIZE ? tileType(cells[row * BOARD_SIZE + column]) : null;
                if (current !== previous) {
                    if (previous !== null && column - runStart >= 3) {
                        runs.push({
                            type: previous,
                            direction: "row",
                            indices: Array.from({ length: column - runStart }, (_, offset) => row * BOARD_SIZE + runStart + offset)
                        });
                    }
                    runStart = column;
                }
            }
        }
        for (let column = 0; column < BOARD_SIZE; column += 1) {
            let runStart = 0;
            for (let row = 1; row <= BOARD_SIZE; row += 1) {
                const previous = tileType(cells[(row - 1) * BOARD_SIZE + column]);
                const current = row < BOARD_SIZE ? tileType(cells[row * BOARD_SIZE + column]) : null;
                if (current !== previous) {
                    if (previous !== null && row - runStart >= 3) {
                        runs.push({
                            type: previous,
                            direction: "column",
                            indices: Array.from({ length: row - runStart }, (_, offset) => (runStart + offset) * BOARD_SIZE + column)
                        });
                    }
                    runStart = row;
                }
            }
        }
        return runs;
    }

    function findMatches(cells) {
        return new Set(findMatchRuns(cells).flatMap(run => run.indices));
    }

    function expandPower(index, power, cells) {
        const affected = new Set();
        const row = Math.floor(index / BOARD_SIZE);
        const column = index % BOARD_SIZE;
        if (power === "row") {
            for (let currentColumn = 0; currentColumn < BOARD_SIZE; currentColumn += 1) {
                affected.add(row * BOARD_SIZE + currentColumn);
            }
        } else if (power === "column") {
            for (let currentRow = 0; currentRow < BOARD_SIZE; currentRow += 1) {
                affected.add(currentRow * BOARD_SIZE + column);
            }
        } else if (power === "rainbow") {
            const color = tileType(cells[index]);
            cells.forEach((tile, tileIndex) => {
                if (tileType(tile) === color) affected.add(tileIndex);
            });
        }
        return affected;
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
                    (index % BOARD_SIZE >= 2 && tileType(cells[index - 1]) === tile && tileType(cells[index - 2]) === tile) ||
                    (index >= BOARD_SIZE * 2 && tileType(cells[index - BOARD_SIZE]) === tile && tileType(cells[index - BOARD_SIZE * 2]) === tile)
                );
                cells[index] = { type: tile, power: null };
            }
            if (hasValidMove(cells)) return cells;
        }
        const fallback = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
            type: (Math.floor(index / BOARD_SIZE) * 2 + index % BOARD_SIZE) % TILES.length,
            power: null
        }));
        fallback[1].type = 2;
        fallback[2].type = 2;
        fallback[3].type = 1;
        fallback[4].type = 2;
        fallback[5].type = 4;
        fallback[11].type = 2;
        return fallback;
    }

    function renderBoard(matches = new Set()) {
        boardElement.replaceChildren(...board.map((tile, index) => {
            const button = document.createElement("button");
            const tileInfo = TILES[tile.type];
            const powerIcon = tile.power === "rainbow" ? "🌈" : tile.power ? "🚀" : tileInfo.icon;
            const powerName = tile.power === "rainbow"
                ? "bonus arc-en-ciel, élimine toutes les cases de sa couleur"
                : tile.power === "row"
                    ? "fusée, élimine sa ligne"
                    : tile.power === "column"
                        ? "fusée, élimine sa colonne"
                        : "";
            button.type = "button";
            button.className = `match-tile${selectedIndex === index ? " selected" : ""}${matches.has(index) ? " clearing" : ""}${tile.power ? ` match-power-${tile.power}` : ""}`;
            button.dataset.index = String(index);
            button.textContent = powerIcon;
            button.setAttribute("role", "gridcell");
            button.setAttribute("aria-label", `${tileInfo.name}${powerName ? `, ${powerName}` : ""}, ligne ${Math.floor(index / BOARD_SIZE) + 1}, colonne ${index % BOARD_SIZE + 1}`);
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

    function activateTab(tabId, panelId) {
        document.querySelectorAll(".match-tab").forEach(tab => {
            const active = tab.id === tabId;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll(".match-tab-panel").forEach(panel => {
            panel.hidden = panel.id !== panelId;
        });
    }

    function drawCharacter() {
        const roll = Math.random() * 100;
        let cumulativeChance = 0;
        const rarity = progressStore.rarities.find(item => {
            cumulativeChance += item.chance;
            return roll < cumulativeChance;
        }) || progressStore.rarities[progressStore.rarities.length - 1];
        const eligibleCharacters = CHARACTERS.filter(character => character.rarity === rarity.id);
        return eligibleCharacters[Math.floor(Math.random() * eligibleCharacters.length)];
    }

    async function resolveMatches(gameTurn, forcedPowers = new Set()) {
        resolving = true;
        renderBoard();
        let chain = 0;
        while (playing && gameTurn === turnId) {
            const runs = findMatchRuns(board);
            const matches = new Set(runs.flatMap(run => run.indices));
            for (const index of forcedPowers) matches.add(index);
            forcedPowers = new Set();
            if (matches.size === 0) break;
            chain += 1;
            const existingPower = [...matches].find(index => board[index]?.power);
            const powerRun = runs.find(run => run.indices.length >= 5) || runs.find(run => run.indices.length >= 4);
            let newPowerIndex = null;
            let newPower = null;
            if (!existingPower && powerRun) {
                newPowerIndex = powerRun.indices.includes(powerPlacementIndex)
                    ? powerPlacementIndex
                    : powerRun.indices[Math.floor(powerRun.indices.length / 2)];
                newPower = powerRun.indices.length >= 5
                    ? "rainbow"
                    : powerRun.direction;
            }

            const removals = new Set(matches);
            if (newPowerIndex !== null) removals.delete(newPowerIndex);
            const activatedPowers = new Set();
            let expanded = true;
            while (expanded) {
                expanded = false;
                for (const index of [...removals]) {
                    const power = board[index]?.power;
                    if (!power || activatedPowers.has(index)) continue;
                    activatedPowers.add(index);
                    for (const affectedIndex of expandPower(index, power, board)) {
                        if (!removals.has(affectedIndex)) {
                            removals.add(affectedIndex);
                            expanded = true;
                        }
                    }
                }
            }
            if (newPowerIndex !== null) board[newPowerIndex].power = newPower;
            powerPlacementIndex = null;
            const reward = removals.size * 5 * chain;
            sessionXp += reward;
            ui.sessionXp.textContent = String(sessionXp);
            const levelsGained = addXp(reward);
            const levelMessage = levelsGained > 0
                ? ` Niveau ${currentLevel()} atteint : ${levelsGained} capsule${levelsGained > 1 ? "s" : ""} gagnée${levelsGained > 1 ? "s" : ""} !`
                : "";
            const powerMessage = newPower === "rainbow"
                ? " Étoile arc-en-ciel créée !"
                : newPower
                    ? " Fusée créée !"
                    : activatedPowers.size
                        ? ` ${activatedPowers.size} bonus activé${activatedPowers.size > 1 ? "s" : ""} !`
                        : "";
            showMessage(`+${reward} XP${chain > 1 ? ` · combo ×${chain}` : ""}.${powerMessage}${levelMessage}`);
            renderBoard(removals);
            await new Promise(resolve => setTimeout(resolve, 170));
            if (!playing || gameTurn !== turnId) return;

            for (const index of removals) board[index] = null;
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

    function swapTiles(firstIndex, secondIndex) {
        if (!playing || resolving || !isAdjacent(firstIndex, secondIndex)) return;
        powerPlacementIndex = secondIndex;
        [board[firstIndex], board[secondIndex]] = [board[secondIndex], board[firstIndex]];
        selectedIndex = null;
        const triggeredPowers = new Set([firstIndex, secondIndex].filter(index => board[index]?.power));
        const matches = findMatches(board);
        if (matches.size === 0 && triggeredPowers.size === 0) {
            [board[firstIndex], board[secondIndex]] = [board[secondIndex], board[firstIndex]];
            powerPlacementIndex = null;
            renderBoard();
            showMessage("Pas d’alignement : essaie un autre échange.");
            return;
        }
        const gameTurn = turnId;
        void resolveMatches(gameTurn, triggeredPowers);
    }

    function getTileIndex(target) {
        const button = target.closest(".match-tile");
        if (!button) return null;
        const index = Number(button.dataset.index);
        return Number.isInteger(index) && index >= 0 && index < board.length ? index : null;
    }

    boardElement.addEventListener("pointerdown", event => {
        const index = getTileIndex(event.target);
        if (index === null || !playing || resolving || event.button !== 0) return;
        dragStartIndex = index;
    });

    boardElement.addEventListener("pointerup", event => {
        if (dragStartIndex === null) return;
        const startIndex = dragStartIndex;
        dragStartIndex = null;
        const pointerTarget = document.elementFromPoint(event.clientX, event.clientY) || event.target;
        const endIndex = getTileIndex(pointerTarget);
        if (endIndex === null || endIndex === startIndex) return;
        suppressClick = true;
        window.setTimeout(() => { suppressClick = false; }, 0);
        if (isAdjacent(startIndex, endIndex)) swapTiles(startIndex, endIndex);
    });

    window.addEventListener("pointerup", () => { dragStartIndex = null; });
    boardElement.addEventListener("pointercancel", () => { dragStartIndex = null; });

    boardElement.addEventListener("click", event => {
        if (suppressClick) return;
        const index = getTileIndex(event.target);
        if (index === null || !playing || resolving) return;
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
        swapTiles(selectedIndex, index);
    });

    ui.start.addEventListener("click", startGame);
    ui.shuffle.addEventListener("click", shuffleBoard);
    document.getElementById("matchGameTab").addEventListener("click", () => {
        activateTab("matchGameTab", "matchGamePanel");
    });
    document.getElementById("matchCollectionTab").addEventListener("click", () => {
        activateTab("matchCollectionTab", "matchCollectionPanel");
    });
    document.querySelectorAll(".match-filter").forEach(button => {
        button.addEventListener("click", () => {
            collectionFilter = button.dataset.filter;
            document.querySelectorAll(".match-filter").forEach(filter => {
                const active = filter === button;
                filter.classList.toggle("is-active", active);
                filter.setAttribute("aria-pressed", String(active));
            });
            renderCollection();
        });
    });
    ui.gacha.addEventListener("click", () => {
        if (capsules < 1) return;
        capsules -= 1;
        const progress = progressStore.read();
        progressStore.update({ matchCapsulesSpent: progress.matchCapsulesSpent + 1 });
        const character = drawCharacter();
        const rarity = progressStore.rarities.find(item => item.id === character.rarity);
        const alreadyCollected = collection.includes(character.id);
        ui.reveal.textContent = "La capsule s’ouvre…";
        showMessage("La capsule s’ouvre…");
        if (alreadyCollected) {
            const duplicateXp = rarity?.duplicateXp || 25;
            addXp(duplicateXp);
        }
        renderProgress();
        void progressStore.showDiscovery(character, alreadyCollected, () => {
            if (alreadyCollected) return;
            collection.push(character.id);
            renderCollection();
            saveProgress();
        }).then(() => {
            ui.reveal.textContent = alreadyCollected
                ? `${character.icon} ${character.name} · ${rarity?.name || "Commun"} · doublon : +${rarity?.duplicateXp || 25} XP`
                : `${character.icon} ${character.name} · ${rarity?.name || "Commun"} rejoint ta collection !`;
            showMessage(alreadyCollected
                ? `Doublon échangé contre ${rarity?.duplicateXp || 25} XP.`
                : `${character.name} rejoint ta collection !`);
        });
    });

    window.addEventListener(progressStore.eventName, event => {
        const progress = event.detail;
        xp = progress.matchXp;
        capsules = progress.matchCapsules;
        collection = progress.collection;
        renderProgress();
        renderCollection();
    });

    loadProgress();
    renderProgress();
    renderCollection();
    board = createBoard();
    renderBoard();
})();
