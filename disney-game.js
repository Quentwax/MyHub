(() => {
    "use strict";

    const STORAGE_KEY = "myhub_disney_quest_2d_v1";
    const WORLD = { width: 1600, height: 900 };
    const PLAYER_SPEED = 230;
    const ITEM_ICONS = ["🔑", "🗺️", "🎵", "✨", "🌙", "🏆"];
    const ITEMS = [
        { id: "key", name: "Clé du château", icon: ITEM_ICONS[0], x: 450, y: 470, color: "#f0b94e" },
        { id: "map", name: "Carte de la forêt", icon: ITEM_ICONS[1], x: 1180, y: 250, color: "#80b7d0" },
        { id: "song", name: "Mélodie de la tour", icon: ITEM_ICONS[2], x: 790, y: 710, color: "#d6817a" },
        { id: "star", name: "Étoile de la montagne", icon: ITEM_ICONS[3], x: 1390, y: 660, color: "#e9ce63" },
        { id: "moon", name: "Lune de l’océan", icon: ITEM_ICONS[4], x: 300, y: 190, color: "#b7c8e5" },
        { id: "trophy", name: "Trophée du parc", icon: ITEM_ICONS[5], x: 1080, y: 570, color: "#e4a852" }
    ];

    const NPCS = [
        { x: 700, y: 330, name: "Mickey", line: "Le trésor est caché derrière la porte du jardin. Évite les gardiens!" },
        { x: 1220, y: 560, name: "Elsa", line: "La grande étoile se trouve au sommet de la montagne. Prends soin de ne pas tomber!" },
        { x: 370, y: 680, name: "Pocahontas", line: "La lune du lac ouvre la route vers le bateau. Le vent est ton ami." }
    ];

    const DOORS = [
        { x: 1030, y: 310, w: 60, h: 105, required: "key", destination: { x: 1120, y: 315 }, message: "La serrure est trop dure. Cherche la clé du château." },
        { x: 720, y: 590, w: 82, h: 55, required: "map", destination: { x: 810, y: 570 }, message: "La carte manque. Trouve-la dans la forêt." },
        { x: 480, y: 280, w: 90, h: 65, required: "song", destination: { x: 550, y: 290 }, message: "Le rythme de la tour est nécessaire pour déverrouiller cette porte." }
    ];

    const defaultState = {
        version: 1,
        player: { x: 130, y: 690 },
        collected: [],
        visited: ["parc"],
        score: 0,
        completed: false,
        lastSaved: null
    };

    const canvas = document.getElementById("disneyGameCanvas");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const elements = {
        section: document.getElementById("disney2DSection"),
        stageTitle: document.getElementById("gameStageTitle"),
        progress: document.getElementById("gameProgressFill"),
        progressLabel: document.getElementById("gameProgressLabel"),
        score: document.getElementById("gameScore"),
        items: document.getElementById("gameItemsList"),
        objective: document.getElementById("gameObjectiveText"),
        objectiveDetail: document.getElementById("gameObjectiveDetail"),
        message: document.getElementById("gameMessage"),
        saveStatus: document.getElementById("gameSaveStatus"),
        saveButton: document.getElementById("gameSaveButton"),
        resetButton: document.getElementById("gameResetButton"),
        overlay: document.getElementById("gameCompleteOverlay"),
        result: document.getElementById("gameResult"),
        playAgain: document.getElementById("gamePlayAgain")
    };

    let state = loadState();
    let keys = new Set();
    let lastTime = performance.now();
    let animationFrame = null;
    let messageTimer = null;
    let lastTouch = null;
    let camera = { x: 0, y: 0 };
    let gameStarted = false;
    let resizeObserver = null;

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return structuredClone(defaultState);
            const parsed = JSON.parse(saved);
            const validCollected = Array.isArray(parsed.collected) ? parsed.collected.filter(id => ITEMS.some(item => item.id === id)) : [];
            return {
                ...structuredClone(defaultState),
                ...parsed,
                player: {
                    x: Number.isFinite(parsed.player?.x) ? Math.max(30, Math.min(WORLD.width - 30, parsed.player.x)) : defaultState.player.x,
                    y: Number.isFinite(parsed.player?.y) ? Math.max(30, Math.min(WORLD.height - 30, parsed.player.y)) : defaultState.player.y
                },
                collected: validCollected,
                visited: Array.isArray(parsed.visited) ? [...new Set(parsed.visited)] : ["parc"],
                score: Math.max(0, Number(parsed.score) || 0),
                completed: Boolean(parsed.completed),
                lastSaved: parsed.lastSaved || null
            };
        } catch (error) {
            console.warn("Impossible de charger le jeu Disney :", error);
            return structuredClone(defaultState);
        }
    }

    function saveState(immediate = false) {
        state.lastSaved = new Date().toISOString();
        const persist = () => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                elements.saveStatus.textContent = "Sauvegardé";
            } catch (error) {
                console.warn("Impossible d’enregistrer le jeu Disney :", error);
                elements.saveStatus.textContent = "Enregistrement impossible";
            }
        };
        if (immediate) {
            persist();
        } else {
            window.clearTimeout(saveState.timer);
            saveState.timer = window.setTimeout(persist, 500);
        }
    }

    function getProgress() {
        return Math.round((state.collected.length / ITEMS.length) * 100);
    }

    function getObjective() {
        const remaining = ITEMS.filter(item => !state.collected.includes(item.id));
        if (state.completed) return { title: "Aventure terminée", detail: "Le parc est entièrement révélé." };
        if (remaining.length === 0) return { title: "Le trésor est prêt", detail: "Rejoins le cœur du parc pour terminer l’aventure." };
        const target = remaining[0];
        return { title: `Trouve ${target.name.toLowerCase()}`, detail: `${remaining.length} objets restent dans le parc.` };
    }

    function renderUI() {
        const progress = getProgress();
        const objective = getObjective();
        elements.progress.style.width = `${progress}%`;
        elements.progressLabel.textContent = `${progress}%`;
        elements.score.textContent = `${state.score} pts`;
        elements.objective.textContent = objective.title;
        elements.objectiveDetail.textContent = objective.detail;
        elements.stageTitle.textContent = state.completed ? "Aventure terminée" : "Le Parc des Rêves";
        elements.items.innerHTML = "";

        if (state.collected.length === 0) {
            elements.items.innerHTML = '<div class="game-empty-items">Aucun objet trouvé. Commence par explorer le parc.</div>';
        } else {
            state.collected.forEach(id => {
                const item = ITEMS.find(candidate => candidate.id === id);
                const row = document.createElement("div");
                row.className = "game-item";
                row.innerHTML = `<span>${item.icon}</span><strong>${item.name}</strong>`;
                elements.items.appendChild(row);
            });
        }

        if (state.completed) {
            elements.overlay.hidden = false;
            elements.result.textContent = `Tu as fondé tout le trésor en ${state.score} points.`;
        }
    }

    function showMessage(text, duration = 3300) {
        elements.message.innerHTML = text;
        elements.message.classList.remove("hidden");
        window.clearTimeout(messageTimer);
        messageTimer = window.setTimeout(() => elements.message.classList.add("hidden"), duration);
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function collectItem(item) {
        if (state.collected.includes(item.id)) return;
        state.collected.push(item.id);
        state.score += 100;
        state.visited.push("parc");
        showMessage(`<strong>${item.name} trouvé !</strong> +100 points`);
        renderUI();
        saveState();
        if (state.collected.length === ITEMS.length) {
            state.completed = true;
            state.score += 500;
            showMessage("<strong>Le trésor est révélé !</strong> Le parc est entièrement en ta mémoire.", 6000);
            renderUI();
            saveState(true);
        }
    }

    function interactWithNpc(npc) {
        showMessage(`<strong>${npc.name}</strong> : ${npc.line}`);
    }

    function interactWithDoor(door) {
        if (state.collected.includes(door.required)) {
            state.player.x = door.destination.x;
            state.player.y = door.destination.y;
            showMessage("<strong>Portail ouvert !</strong> Tu as franchi le passage secret.");
            saveState();
            return;
        }
        showMessage(`<strong>Portail verrouillé</strong> : ${door.message}`);
    }

    function handleInteraction() {
        const player = state.player;
        const item = ITEMS.find(candidate => distance(player, candidate) < 48 && !state.collected.includes(candidate.id));
        if (item) {
            collectItem(item);
            return;
        }

        const npc = NPCS.find(candidate => distance(player, candidate) < 58);
        if (npc) {
            interactWithNpc(npc);
            return;
        }

        const door = DOORS.find(candidate => distance(player, candidate) < 80);
        if (door) {
            interactWithDoor(door);
        }
    }

    function updatePlayer(dt) {
        let dx = 0;
        let dy = 0;
        if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
        if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
        if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
        if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
        if (dx || dy) {
            const length = Math.hypot(dx, dy);
            state.player.x = Math.max(28, Math.min(WORLD.width - 28, state.player.x + dx / length * PLAYER_SPEED * dt));
            state.player.y = Math.max(28, Math.min(WORLD.height - 28, state.player.y + dy / length * PLAYER_SPEED * dt));
            gameStarted = true;
        }
    }

    function drawRoundedRect(x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.stroke();
        }
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
        gradient.addColorStop(0, "#b9d9c8");
        gradient.addColorStop(1, "#8eb99a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WORLD.width, WORLD.height);

        ctx.fillStyle = "rgba(255,255,255,0.17)";
        for (let x = 0; x < WORLD.width; x += 100) {
            for (let y = 0; y < WORLD.height; y += 100) {
                if ((x + y) % 200 === 0) ctx.fillRect(x + 20, y + 18, 8, 8);
            }
        }

        drawTree(130, 140); drawTree(230, 380); drawTree(340, 100); drawTree(570, 155);
        drawTree(1350, 130); drawTree(1510, 360); drawTree(1360, 805); drawTree(1500, 75);
        drawMountain(1200, 570); drawMountain(1400, 730);
        drawLake(70, 670, 390, 160);
        drawCastle(980, 310);
        drawPath();
    }

    function drawTree(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#8f6546";
        ctx.fillRect(-7, 8, 14, 38);
        ctx.fillStyle = "#397550";
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.arc(-24, 17, 27, 0, Math.PI * 2);
        ctx.arc(24, 18, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4f8b61";
        ctx.beginPath(); ctx.arc(-11, -10, 17, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawMountain(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#6e8d83";
        ctx.beginPath(); ctx.moveTo(-125, 90); ctx.lineTo(-30, -90); ctx.lineTo(70, 40); ctx.lineTo(130, 90); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#d6e2dc";
        ctx.beginPath(); ctx.moveTo(-30, -90); ctx.lineTo(2, -30); ctx.lineTo(18, -42); ctx.lineTo(70, 40); ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    function drawLake(x, y, w, h) {
        ctx.save();
        ctx.fillStyle = "#6da9ae";
        ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 65, y + 58); ctx.bezierCurveTo(x + 130, y + 28, x + 210, y + 86, x + 300, y + 50); ctx.stroke();
        ctx.restore();
    }

    function drawCastle(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#d9c2a4";
        ctx.fillRect(-90, 32, 180, 120);
        ctx.fillRect(-70, 5, 140, 55);
        ctx.fillStyle = "#f0e2c5";
        ctx.fillRect(-79, 42, 158, 54);
        ctx.fillStyle = "#9e7553";
        ctx.fillRect(-111, 68, 25, 84); ctx.fillRect(86, 68, 25, 84);
        ctx.fillRect(-42, 86, 84, 66);
        ctx.fillStyle = "#fff3d8";
        ctx.fillRect(-24, 97, 48, 55);
        ctx.fillStyle = "#e9b44c";
        ctx.fillRect(-10, 112, 20, 40);
        ctx.restore();
    }

    function drawPath() {
        ctx.strokeStyle = "#e3c78b";
        ctx.lineWidth = 27;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(160, 690); ctx.bezierCurveTo(350, 590, 500, 455, 800, 430);
        ctx.bezierCurveTo(1040, 405, 1170, 500, 1350, 670);
        ctx.stroke();
        ctx.strokeStyle = "#f0dca9";
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    function drawDoor(door) {
        const unlocked = state.collected.includes(door.required);
        drawRoundedRect(door.x, door.y, door.w, door.h, 5, unlocked ? "#77a17d" : "#a5664d", "#5c4236");
        ctx.fillStyle = unlocked ? "#e8c862" : "#f5db9d";
        ctx.beginPath(); ctx.arc(door.x + door.w - 18, door.y + door.h / 2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.62)";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(unlocked ? "OUVERT" : "VERROU", door.x + door.w / 2, door.y - 9);
    }

    function drawItem(item) {
        if (state.collected.includes(item.id)) return;
        const pulse = 1 + Math.sin(performance.now() / 300 + item.x) * 0.12;
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(pulse, pulse);
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = item.color;
        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.icon, 0, 1);
        ctx.restore();
    }

    function drawNpc(npc) {
        ctx.save();
        ctx.translate(npc.x, npc.y);
        ctx.fillStyle = "#f5c89b";
        ctx.beginPath(); ctx.arc(0, -10, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = npc.name === "Mickey" ? "#181616" : "#5ba7a0";
        ctx.beginPath(); ctx.arc(-8, -12, 3, 0, Math.PI * 2); ctx.arc(8, -12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f2d7b4";
        ctx.fillRect(-17, 8, 34, 24);
        ctx.fillStyle = "#e5a34b";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(npc.name.toUpperCase(), 0, 43);
        ctx.restore();
    }

    function drawPlayer() {
        const { x, y } = state.player;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#f3c49b";
        ctx.beginPath(); ctx.arc(0, -12, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2d3e47";
        ctx.fillRect(-13, 3, 26, 25);
        ctx.fillStyle = "#e0a43d";
        ctx.fillRect(-19, 4, 38, 9);
        ctx.fillStyle = "#f2f5f5";
        ctx.fillRect(-11, 13, 22, 11);
        ctx.fillStyle = "#263d48";
        ctx.fillRect(-8, 17, 5, 7); ctx.fillRect(3, 17, 5, 7);
        ctx.restore();
    }

    function drawWorld() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        const scale = Math.min(canvas.width / 900, canvas.height / 700);
        const offsetX = (canvas.width - WORLD.width * scale) / 2;
        const offsetY = (canvas.height - WORLD.height * scale) / 2;
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        drawBackground();
        DOORS.forEach(drawDoor);
        ITEMS.forEach(drawItem);
        NPCS.forEach(drawNpc);
        drawPlayer();
        ctx.restore();
    }

    function updateCamera() {
        const scale = Math.min(canvas.width / 900, canvas.height / 700);
        const viewW = canvas.width / scale;
        const viewH = canvas.height / scale;
        camera.x = Math.max(0, Math.min(WORLD.width - viewW, state.player.x - viewW / 2));
        camera.y = Math.max(0, Math.min(WORLD.height - viewH, state.player.y - viewH / 2));
    }

    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        updatePlayer(dt);
        updateCamera();
        drawWorld();
        animationFrame = requestAnimationFrame(gameLoop);
    }

    function bindControls() {
        window.addEventListener("keydown", event => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(event.code)) event.preventDefault();
            keys.add(event.code);
            if (event.code === "Space" || event.code === "Enter") handleInteraction();
        });
        window.addEventListener("keyup", event => keys.delete(event.code));
        window.addEventListener("blur", () => keys.clear());

        document.querySelectorAll("[data-direction]").forEach(button => {
            const direction = button.dataset.direction;
            const keyMap = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
            const press = event => { event.preventDefault(); keys.add(keyMap[direction]); };
            const release = event => { event.preventDefault(); keys.delete(keyMap[direction]); };
            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointercancel", release);
            button.addEventListener("pointerleave", release);
        });

        document.getElementById("gameInteract").addEventListener("click", handleInteraction);
        elements.saveButton.addEventListener("click", () => saveState(true));
        elements.resetButton.addEventListener("click", resetGame);
        elements.playAgain.addEventListener("click", resetGame);
        elements.overlay.addEventListener("click", event => {
            if (event.target === elements.overlay) elements.overlay.hidden = true;
        });

        canvas.addEventListener("pointerdown", event => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            const rect = canvas.getBoundingClientRect();
            const scale = Math.min(canvas.width / 900, canvas.height / 700);
            const x = (event.clientX - rect.left - (canvas.width - WORLD.width * scale) / 2) / scale;
            const y = (event.clientY - rect.top - (canvas.height - WORLD.height * scale) / 2) / scale;
            const target = { x, y };
            const item = ITEMS.find(candidate => distance(target, candidate) < 55 && !state.collected.includes(candidate.id));
            if (item) {
                state.player.x = Math.max(40, Math.min(WORLD.width - 40, item.x));
                state.player.y = Math.max(40, Math.min(WORLD.height - 40, item.y));
                collectItem(item);
            } else {
                lastTouch = target;
                state.player.x = Math.max(40, Math.min(WORLD.width - 40, x));
                state.player.y = Math.max(40, Math.min(WORLD.height - 40, y));
            }
        });
    }

    function resetGame() {
        state = structuredClone(defaultState);
        elements.overlay.hidden = true;
        elements.message.classList.add("hidden");
        renderUI();
        saveState(true);
        showMessage("<strong>Nouvelle aventure.</strong> Trouve les six objets du parc.");
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    }

    function init() {
        if (!elements.section) return;
        resizeCanvas();
        renderUI();
        bindControls();
        window.addEventListener("resize", resizeCanvas);
        if ("ResizeObserver" in window) {
            resizeObserver = new ResizeObserver(resizeCanvas);
            resizeObserver.observe(canvas);
        }
        animationFrame = requestAnimationFrame(gameLoop);
        elements.saveStatus.textContent = state.lastSaved ? "Progression chargé" : "Sauvegarde prête";
        showMessage("<strong>Le parc est prêt.</strong> Utilise WASD ou les flèches. Appuie sur E ou sur l’espace pour interagir.");
    }

    init();
})();
