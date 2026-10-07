(() => {
    "use strict";

    const progressStore = window.MyHubDisneyProgress;
    const CHARACTERS = progressStore.characters;
    const PARADE_CHARACTERS = CHARACTERS.slice(0, 8);
    const W = 960;
    const H = 540;
    const ROUND_TIME = 45;
    const TICKETS_TO_CLEAR = 8;
    const PLAYER_RADIUS = 13;
    const PLAYER_SPEED = 220;
    const TICKET_COLORS = ["#ffd45a", "#ff8c69", "#76d4bd", "#90baff"];
    const canvas = document.getElementById("disneyGameCanvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const ui = {
        score: document.getElementById("arcadeScore"),
        best: document.getElementById("arcadeBest"),
        matchXp: document.getElementById("arcadeMatchXp"),
        matchCapsules: document.getElementById("arcadeMatchCapsules"),
        round: document.getElementById("arcadeRound"),
        time: document.getElementById("arcadeTime"),
        lives: document.getElementById("arcadeLives"),
        tickets: document.getElementById("arcadeTickets"),
        ticketFill: document.getElementById("arcadeTicketTrackFill"),
        combo: document.getElementById("arcadeCombo"),
        message: document.getElementById("arcadeMessage"),
        overlay: document.getElementById("arcadeOverlay"),
        overlayEyebrow: document.getElementById("arcadeOverlayEyebrow"),
        overlayTitle: document.getElementById("arcadeOverlayTitle"),
        overlayText: document.getElementById("arcadeOverlayText"),
        primary: document.getElementById("arcadePrimary"),
        pause: document.getElementById("arcadePause"),
        sound: document.getElementById("arcadeSound"),
        dash: document.getElementById("arcadeDash"),
        soundIcon: document.getElementById("arcadeSoundIcon"),
        soundLabel: document.getElementById("arcadeSoundLabel"),
        collectionCount: document.getElementById("arcadeCollectionCount"),
        collection: document.getElementById("arcadeCollection")
    };

    const obstacles = [
        { x: 284, y: 145, w: 50, h: 86, color: "#a97951", type: "bench" },
        { x: 615, y: 320, w: 55, h: 86, color: "#a97951", type: "bench" },
        { x: 446, y: 68, w: 68, h: 48, color: "#4b8c6b", type: "bush" },
        { x: 167, y: 360, w: 78, h: 53, color: "#4b8c6b", type: "bush" },
        { x: 758, y: 153, w: 78, h: 53, color: "#4b8c6b", type: "bush" }
    ];

    let sharedProgress = progressStore.read();
    let bestScore = sharedProgress.arcadeBestScore;
    let collection = sharedProgress.collection;
    let soundEnabled = true;
    let audioContext = null;
    let mode = "ready";
    let score = 0;
    let round = 1;
    let roundTime = ROUND_TIME;
    let lives = 3;
    let roundTickets = 0;
    let combo = 0;
    let comboWindow = 0;
    let dashCooldown = 0;
    let dashTime = 0;
    let invulnerable = 0;
    let transitionTime = 0;
    let lastFrame = performance.now();
    let messageTime = 0;
    let keys = new Set();
    let player = { x: 82, y: 270, faceX: 1, faceY: 0 };
    let tickets = [];
    let guards = [];
    let particles = [];

    function saveCollection() {
        try {
            sharedProgress = progressStore.update({ collection });
            collection = sharedProgress.collection;
        }
        catch { showMessage("La collection ne peut pas être enregistrée sur cet appareil."); }
        updateCollection();
    }

    function updateCollection() {
        ui.collectionCount.textContent = `${collection.length} / ${CHARACTERS.length}`;
        ui.collection.replaceChildren(...CHARACTERS.map(character => {
            const item = document.createElement("div");
            const unlocked = collection.includes(character.id);
            item.className = `arcade-character${unlocked ? " collected" : ""}`;
            item.setAttribute("aria-label", unlocked ? `${character.name}, collectionné` : "Personnage à découvrir");
            const portrait = progressStore.createPortrait(
                unlocked ? character : { ...character, icon: "?" },
                "disney-character-image"
            );
            const name = document.createElement("strong");
            name.textContent = unlocked ? character.name : "À découvrir";
            item.append(portrait, name);
            return item;
        }));
    }

    function saveBestScore() {
        if (score <= bestScore) return;
        try {
            sharedProgress = progressStore.update({ arcadeBestScore: score });
            bestScore = sharedProgress.arcadeBestScore;
        }
        catch { showMessage("Impossible d’enregistrer le record sur cet appareil."); }
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }

    function activateAudio() {
        if (!audioContext) {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (Audio) audioContext = new Audio();
        }
        if (audioContext?.state === "suspended") audioContext.resume();
    }

    function playTone(frequency, duration = 0.11, type = "sine", volume = 0.035) {
        if (!soundEnabled || !audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }

    function showMessage(text, duration = 1.6) {
        ui.message.textContent = text;
        ui.message.classList.add("visible");
        messageTime = duration;
    }

    function updateHud() {
        ui.score.textContent = String(score).padStart(5, "0");
        ui.best.textContent = String(Math.max(bestScore, score)).padStart(5, "0");
        ui.matchXp.textContent = String(sharedProgress.matchXp);
        ui.matchCapsules.textContent = String(sharedProgress.matchCapsules);
        ui.round.textContent = String(round);
        ui.time.textContent = `${Math.ceil(Math.max(0, roundTime))}s`;
        ui.time.classList.toggle("urgent", mode === "playing" && roundTime <= 10);
        ui.lives.textContent = "♥".repeat(Math.max(0, lives)) + "♡".repeat(Math.max(0, 3 - lives));
        ui.tickets.textContent = `${roundTickets} / ${TICKETS_TO_CLEAR}`;
        ui.ticketFill.style.width = `${Math.round((roundTickets / TICKETS_TO_CLEAR) * 100)}%`;
        ui.combo.textContent = combo > 1 ? `×${Math.min(combo, 5)}` : "—";
        ui.dash.classList.toggle("ready", dashCooldown <= 0);
        ui.dash.setAttribute("aria-label", dashCooldown <= 0 ? "Dash disponible" : `Dash dans ${dashCooldown.toFixed(1)} secondes`);
    }

    function showOverlay(eyebrow, title, text, buttonText) {
        ui.overlayEyebrow.textContent = eyebrow;
        ui.overlayTitle.textContent = title;
        ui.overlayText.textContent = text;
        ui.primary.textContent = buttonText;
        ui.overlay.hidden = false;
    }

    function startGame() {
        activateAudio();
        mode = "playing";
        score = 0;
        round = 1;
        roundTime = ROUND_TIME;
        lives = 3;
        roundTickets = 0;
        combo = 0;
        comboWindow = 0;
        dashCooldown = 0;
        dashTime = 0;
        invulnerable = 2.5;
        player = { x: 82, y: 270, faceX: 1, faceY: 0 };
        tickets = [];
        guards = [];
        particles = [];
        ui.pause.textContent = "Pause";
        ui.pause.setAttribute("aria-label", "Mettre en pause");
        ui.overlay.hidden = true;
        spawnRound();
        showMessage("8 tickets, 3 vies. Ne te fais pas attraper !", 2.4);
        updateHud();
    }

    function spawnRound() {
        tickets = [];
        guards = [];
        for (let index = 0; index < TICKETS_TO_CLEAR; index += 1) spawnTicket();
        const guardCount = Math.min(2 + Math.floor(round / 3), 8);
        for (let index = 0; index < guardCount; index += 1) {
            const edge = index % 2 === 0 ? 0 : W;
            guards.push({ x: edge ? W - 60 : 60, y: 115 + index * 130, speed: 78 + round * 12 + index * 4, phase: index * 2.3, stun: 0 });
        }
        player.x = 82;
        player.y = H / 2;
    }

    function randomOpenPoint() {
        for (let attempt = 0; attempt < 90; attempt += 1) {
            const point = { x: 55 + Math.random() * (W - 110), y: 72 + Math.random() * (H - 120) };
            if (Math.hypot(point.x - player.x, point.y - player.y) < 105) continue;
            if (obstacles.some(obstacle => point.x > obstacle.x - 26 && point.x < obstacle.x + obstacle.w + 26 && point.y > obstacle.y - 26 && point.y < obstacle.y + obstacle.h + 26)) continue;
            if (tickets.some(ticket => Math.hypot(point.x - ticket.x, point.y - ticket.y) < 38)) continue;
            return point;
        }
        return { x: 480, y: 270 };
    }

    function spawnTicket() {
        const point = randomOpenPoint();
        tickets.push({ ...point, phase: Math.random() * Math.PI * 2, color: TICKET_COLORS[Math.floor(Math.random() * TICKET_COLORS.length)] });
    }

    function collidesCircleRect(x, y, radius, rect) {
        const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
        const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
        return Math.hypot(x - closestX, y - closestY) < radius;
    }

    function movePlayer(dx, dy) {
        const radius = PLAYER_RADIUS;
        const nextX = Math.max(radius + 6, Math.min(W - radius - 6, player.x + dx));
        if (!obstacles.some(obstacle => collidesCircleRect(nextX, player.y, radius, obstacle))) player.x = nextX;
        const nextY = Math.max(radius + 6, Math.min(H - radius - 6, player.y + dy));
        if (!obstacles.some(obstacle => collidesCircleRect(player.x, nextY, radius, obstacle))) player.y = nextY;
    }

    function burst(x, y, color, count = 10) {
        for (let index = 0; index < count; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 45 + Math.random() * 140;
            particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.45 + Math.random() * 0.35, maxLife: 0.8, color, size: 2 + Math.random() * 3 });
        }
    }

    function collectTicket(index) {
        const ticket = tickets[index];
        tickets.splice(index, 1);
        combo = comboWindow > 0 ? combo + 1 : 1;
        comboWindow = 2.5;
        const points = 100 * Math.min(combo, 5);
        score += points;
        roundTickets += 1;
        burst(ticket.x, ticket.y, ticket.color, 12);
        playTone(520 + Math.min(combo, 5) * 90, 0.13, "sine", 0.04);
        showMessage(combo > 1 ? `+${points}  ·  COMBO ×${Math.min(combo, 5)}` : `+${points}  ·  ticket !`, 1.15);
        if (roundTickets >= TICKETS_TO_CLEAR) finishRound();
        else spawnTicket();
        updateHud();
    }

    function finishRound() {
        score += Math.ceil(roundTime) * 20 + lives * 50;
        const reward = PARADE_CHARACTERS.find(character => !collection.includes(character.id));
        if (reward) {
            collection.push(reward.id);
            saveCollection();
            void progressStore.showDiscovery(reward);
        } else {
            score += 500;
        }
        saveBestScore();
        const completedRound = round;
        mode = "intermission";
        transitionTime = 2.1;
        round += 1;
        roundTime = ROUND_TIME;
        roundTickets = 0;
        combo = 0;
        spawnRound();
        showMessage(reward ? `Manche ${completedRound} : ${reward.name} rejoint ta collection !` : `Manche ${completedRound} réussie ! +500 points.`, 2.1);
        updateHud();
    }

    function advanceRound() {
        mode = "intermission";
        transitionTime = 1.8;
        round += 1;
        roundTime = ROUND_TIME;
        roundTickets = 0;
        combo = 0;
        spawnRound();
        showMessage(`Manche ${round} : les gardiens accélèrent !`, 1.8);
        updateHud();
    }

    function loseLife(guard) {
        if (invulnerable > 0) return;
        lives -= 1;
        invulnerable = 1.55;
        const angle = Math.atan2(player.y - guard.y, player.x - guard.x);
        movePlayer(Math.cos(angle) * 42, Math.sin(angle) * 42);
        guard.stun = 0.8;
        combo = 0;
        comboWindow = 0;
        burst(player.x, player.y, "#ff7969", 14);
        playTone(150, 0.28, "sawtooth", 0.045);
        if (lives <= 0) {
            mode = "lost";
            saveBestScore();
            showOverlay("PARTIE TERMINÉE", "Les gardiens t’ont eu !", `Tu as marqué ${score} points. Record : ${bestScore}.`, "Rejouer");
        } else {
            showMessage(`Oups ! Plus que ${lives} vie${lives > 1 ? "s" : ""}.`, 1.5);
        }
        updateHud();
    }

    function useDash() {
        if (mode !== "playing" || dashCooldown > 0) return;
        activateAudio();
        dashTime = 0.22;
        dashCooldown = 2.4;
        invulnerable = Math.max(invulnerable, 0.28);
        burst(player.x, player.y, "#a9f0dc", 7);
        playTone(330, 0.1, "triangle", 0.025);
        updateHud();
    }

    function update(dt) {
        if (messageTime > 0) {
            messageTime -= dt;
            if (messageTime <= 0) ui.message.classList.remove("visible");
        }
        if (mode === "intermission") {
            transitionTime -= dt;
            if (transitionTime <= 0) mode = "playing";
            return;
        }
        if (mode !== "playing") return;

        roundTime -= dt;
        dashCooldown = Math.max(0, dashCooldown - dt);
        dashTime = Math.max(0, dashTime - dt);
        invulnerable = Math.max(0, invulnerable - dt);
        comboWindow = Math.max(0, comboWindow - dt);
        if (comboWindow === 0) combo = 0;
        if (roundTime <= 0) {
            advanceRound();
            return;
        }

        let dx = Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA"));
        let dy = Number(keys.has("ArrowDown") || keys.has("KeyS")) - Number(keys.has("ArrowUp") || keys.has("KeyW"));
        const length = Math.hypot(dx, dy);
        if (length) {
            dx /= length;
            dy /= length;
            player.faceX = dx;
            player.faceY = dy;
            const speed = PLAYER_SPEED * (dashTime > 0 ? 2.7 : 1);
            movePlayer(dx * speed * dt, dy * speed * dt);
        }

        for (let index = tickets.length - 1; index >= 0; index -= 1) {
            if (Math.hypot(player.x - tickets[index].x, player.y - tickets[index].y) < 28) {
                collectTicket(index);
                break;
            }
        }

        for (const guard of guards) {
            guard.stun = Math.max(0, guard.stun - dt);
            if (guard.stun > 0) continue;
            guard.phase += dt * 2.4;
            const targetX = player.x + Math.sin(guard.phase) * 17;
            const targetY = player.y + Math.cos(guard.phase * 0.78) * 17;
            const vx = targetX - guard.x;
            const vy = targetY - guard.y;
            const distance = Math.hypot(vx, vy) || 1;
            const speed = guard.speed * (distance < 120 ? 0.75 : 1);
            const nextX = guard.x + vx / distance * speed * dt;
            const nextY = guard.y + vy / distance * speed * dt;
            if (!obstacles.some(obstacle => collidesCircleRect(nextX, guard.y, 14, obstacle))) guard.x = nextX;
            if (!obstacles.some(obstacle => collidesCircleRect(guard.x, nextY, 14, obstacle))) guard.y = nextY;
            guard.x = Math.max(18, Math.min(W - 18, guard.x));
            guard.y = Math.max(45, Math.min(H - 18, guard.y));
            if (Math.hypot(player.x - guard.x, player.y - guard.y) < 26) loseLife(guard);
        }

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];
            particle.life -= dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vx *= 0.97;
            particle.vy *= 0.97;
            if (particle.life <= 0) particles.splice(index, 1);
        }
        updateHud();
    }

    function roundRect(x, y, w, h, r, color) {
        context.fillStyle = color;
        context.beginPath();
        context.roundRect(x, y, w, h, r);
        context.fill();
    }

    function drawPark(time) {
        const sky = context.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#d8f0e3");
        sky.addColorStop(1, "#a9d2b9");
        context.fillStyle = sky;
        context.fillRect(0, 0, W, H);

        context.fillStyle = "#f3dfa9";
        context.beginPath();
        context.moveTo(0, 248); context.bezierCurveTo(190, 190, 300, 343, 480, 270); context.bezierCurveTo(640, 205, 750, 290, 960, 215);
        context.lineTo(960, 300); context.bezierCurveTo(760, 376, 620, 287, 480, 354); context.bezierCurveTo(285, 435, 185, 292, 0, 340); context.closePath();
        context.fill();
        context.strokeStyle = "#fff0c5";
        context.lineWidth = 5;
        context.stroke();

        context.fillStyle = "#b5d9e2";
        context.beginPath(); context.ellipse(480, 274, 72, 49, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#83bdc6";
        context.beginPath(); context.ellipse(480, 274, 47, 28, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#fff1c7";
        context.beginPath(); context.ellipse(480, 250 + Math.sin(time * 2) * 2, 10, 22, 0, Math.PI, Math.PI * 2); context.fill();
        context.fillRect(476, 249, 8, 25);

        drawCloud(88, 92, 0.8, time);
        drawCloud(755, 66, 1.05, time + 1.4);
        drawCastle(480, 75);
        drawParisSign(75, 40);
        drawParisSign(885, 40);
        drawParisTower(835, 395);
        drawLamp(65, 100); drawLamp(895, 100); drawLamp(65, 440); drawLamp(895, 440);
        drawFlowerBed(105, 180); drawFlowerBed(850, 355); drawFlowerBed(395, 455); drawFlowerBed(540, 110);

        obstacles.forEach(obstacle => {
            if (obstacle.type === "bench") drawBench(obstacle);
            else drawBush(obstacle);
        });

        context.fillStyle = "rgba(37,69,67,0.68)";
        context.font = "800 11px system-ui, sans-serif";
        context.textAlign = "center";
        context.fillText("MAIN STREET", 125, 292);
        context.fillText("CENTRAL PLAZA", 480, 370);
        context.fillText("FANTASY GARDEN", 825, 292);
    }

    function drawCloud(x, y, scale, time) {
        context.save();
        context.translate(x + Math.sin(time * .35) * 6, y);
        context.scale(scale, scale);
        context.fillStyle = "rgba(255,255,255,.72)";
        context.beginPath();
        context.arc(-22, 4, 16, 0, Math.PI * 2);
        context.arc(0, -5, 22, 0, Math.PI * 2);
        context.arc(24, 5, 17, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function drawParisSign(x, y) {
        context.save();
        context.translate(x, y);
        roundRect(-42, 0, 84, 25, 5, "#f4d87e");
        context.fillStyle = "#2b4e52";
        context.font = "800 8px system-ui, sans-serif";
        context.textAlign = "center";
        context.fillText("DISNEYLAND", 0, 16);
        context.restore();
    }

    function drawParisTower(x, y) {
        context.save();
        context.translate(x, y);
        context.strokeStyle = "#f4f0df";
        context.lineWidth = 4;
        context.beginPath(); context.moveTo(-3, 8); context.lineTo(-3, -21); context.stroke();
        context.beginPath(); context.moveTo(3, 8); context.lineTo(3, -21); context.stroke();
        context.fillStyle = "#f4f0df";
        context.beginPath(); context.moveTo(-13, -20); context.lineTo(0, -30); context.lineTo(13, -20); context.closePath(); context.fill();
        context.fillStyle = "#f0b95e";
        context.fillRect(-7, -31, 14, 5);
        context.restore();
    }

    function drawCastle(x, y) {
        context.save();
        context.translate(x, y);
        roundRect(-51, 14, 102, 46, 5, "#f7e6c6");
        roundRect(-38, -1, 76, 35, 4, "#fff1d9");
        context.fillStyle = "#637fb0";
        context.beginPath();
        context.moveTo(-57, 18); context.lineTo(-50, -1); context.lineTo(-43, 18);
        context.moveTo(-39, 1); context.lineTo(-30, -24); context.lineTo(-21, 1);
        context.moveTo(-13, 6); context.lineTo(0, -36); context.lineTo(13, 6);
        context.moveTo(22, 1); context.lineTo(31, -24); context.lineTo(40, 1);
        context.moveTo(43, 18); context.lineTo(50, -1); context.lineTo(57, 18);
        context.closePath(); context.fill();
        context.fillStyle = "#e09f54";
        context.fillRect(-6, 34, 12, 26);
        context.fillStyle = "#cf625c";
        context.fillRect(0, -39, 18, 10);
        context.restore();
    }

    function drawLamp(x, y) {
        context.strokeStyle = "#6b6455";
        context.lineWidth = 3;
        context.beginPath(); context.moveTo(x, y + 14); context.lineTo(x, y + 35); context.stroke();
        context.fillStyle = "#ffdc83";
        context.beginPath(); context.arc(x, y + 10, 7, 0, Math.PI * 2); context.fill();
        context.fillStyle = "rgba(255,226,143,0.12)";
        context.beginPath(); context.arc(x, y + 10, 21, 0, Math.PI * 2); context.fill();
    }

    function drawFlowerBed(x, y) {
        roundRect(x, y, 40, 19, 9, "#558561");
        const colors = ["#f18d81", "#ffd45a", "#f8f2dd"];
        for (let index = 0; index < 4; index += 1) {
            context.fillStyle = colors[index % colors.length];
            context.beginPath(); context.arc(x + 8 + index * 8, y + (index % 2 ? 8 : 11), 3, 0, Math.PI * 2); context.fill();
        }
    }

    function drawBench(obstacle) {
        roundRect(obstacle.x - 5, obstacle.y + 7, obstacle.w + 10, obstacle.h - 12, 7, "rgba(39,61,56,0.14)");
        roundRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, 7, "#a97951");
        context.fillStyle = "#d8b080";
        const horizontal = obstacle.h > obstacle.w;
        if (horizontal) {
            for (let y = obstacle.y + 10; y < obstacle.y + obstacle.h - 5; y += 13) context.fillRect(obstacle.x + 5, y, obstacle.w - 10, 4);
        } else {
            for (let x = obstacle.x + 10; x < obstacle.x + obstacle.w - 5; x += 13) context.fillRect(x, obstacle.y + 5, 4, obstacle.h - 10);
        }
    }

    function drawBush(obstacle) {
        context.fillStyle = "rgba(39,61,56,0.12)";
        context.beginPath(); context.ellipse(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2 + 7, obstacle.w / 2, obstacle.h / 2, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#4b8c6b";
        context.beginPath(); context.ellipse(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2, obstacle.w / 2, obstacle.h / 2, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#71a67a";
        context.beginPath(); context.arc(obstacle.x + obstacle.w * 0.35, obstacle.y + obstacle.h * 0.35, 7, 0, Math.PI * 2); context.fill();
    }

    function drawTicket(ticket, time) {
        const bob = Math.sin(time * 4 + ticket.phase) * 4;
        context.save();
        context.translate(ticket.x, ticket.y + bob);
        context.shadowColor = ticket.color;
        context.shadowBlur = 18;
        roundRect(-11, -15, 22, 30, 5, ticket.color);
        context.shadowBlur = 0;
        context.strokeStyle = "rgba(255,255,255,0.82)";
        context.lineWidth = 1.5;
        context.setLineDash([2, 3]);
        context.beginPath(); context.moveTo(0, -10); context.lineTo(0, 10); context.stroke();
        context.setLineDash([]);
        context.fillStyle = "#fffaf0";
        context.beginPath(); context.arc(-4, 0, 2, 0, Math.PI * 2); context.arc(5, 0, 2, 0, Math.PI * 2); context.fill();
        context.restore();
    }

    function drawPlayer(time) {
        context.save();
        context.translate(player.x, player.y);
        if (invulnerable > 0 && Math.floor(time * 15) % 2 === 0) context.globalAlpha = 0.42;
        if (dashTime > 0) {
            context.fillStyle = "rgba(122,231,204,0.28)";
            context.beginPath(); context.arc(-player.faceX * 17, -player.faceY * 17, 21, 0, Math.PI * 2); context.fill();
        }
        context.fillStyle = "rgba(38,58,48,0.17)";
        context.beginPath(); context.ellipse(0, 11, 14, 6, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#294353";
        context.beginPath(); context.ellipse(0, 2, 13, 15, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#e6a943";
        context.beginPath(); context.ellipse(0, -4, 14, 8, 0, Math.PI, Math.PI * 2); context.fill();
        context.fillStyle = "#efc39d";
        context.beginPath(); context.arc(0, -13, 10, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#3a4e58";
        context.beginPath(); context.arc(0, -17, 10, Math.PI, Math.PI * 2); context.fill();
        context.fillStyle = "#fff";
        context.beginPath(); context.arc(4, -14, 2, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#29323a";
        context.beginPath(); context.arc(5, -14, 1, 0, Math.PI * 2); context.fill();
        context.restore();
    }

    function drawGuard(guard, time) {
        context.save();
        context.translate(guard.x, guard.y);
        context.fillStyle = "rgba(38,58,48,0.15)";
        context.beginPath(); context.ellipse(0, 11, 15, 6, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = guard.stun > 0 ? "#93bac0" : "#d46d5e";
        context.beginPath(); context.ellipse(0, 2, 14, 16, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#f0c59d";
        context.beginPath(); context.arc(0, -12, 10, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#35434a";
        context.beginPath(); context.moveTo(-11, -13); context.lineTo(-8, -24); context.lineTo(8, -24); context.lineTo(11, -13); context.closePath(); context.fill();
        context.fillStyle = "#e2a844";
        context.fillRect(-11, -15, 22, 4);
        context.fillStyle = "#3a4146";
        context.beginPath(); context.arc(-4, -12, 1.5, 0, Math.PI * 2); context.arc(4, -12, 1.5, 0, Math.PI * 2); context.fill();
        if (Math.hypot(player.x - guard.x, player.y - guard.y) < 100) {
            context.fillStyle = "#fff4df";
            context.font = "bold 16px sans-serif";
            context.textAlign = "center";
            context.fillText("!", 0, -31 + Math.sin(time * 7) * 2);
        }
        context.restore();
    }

    function draw(time) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = Math.min(canvas.width / W, canvas.height / H);
        const offsetX = (canvas.width - W * scale) / 2;
        const offsetY = (canvas.height - H * scale) / 2;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        drawPark(time);
        tickets.forEach(ticket => drawTicket(ticket, time));
        guards.forEach(guard => drawGuard(guard, time));
        particles.forEach(particle => {
            context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
            context.fillStyle = particle.color;
            context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); context.fill();
        });
        context.globalAlpha = 1;
        drawPlayer(time);

        if (mode === "ready") {
            context.fillStyle = "rgba(22,48,50,0.10)";
            context.fillRect(0, 0, W, H);
        } else if (mode === "paused") {
            context.fillStyle = "rgba(19,41,48,0.52)";
            context.fillRect(0, 0, W, H);
            context.fillStyle = "#fff8e9";
            context.textAlign = "center";
            context.font = "800 38px system-ui, sans-serif";
            context.fillText("PAUSE", W / 2, H / 2);
        } else if (mode === "intermission") {
            context.fillStyle = "rgba(25,48,45,0.18)";
            context.fillRect(0, 0, W, H);
            context.textAlign = "center";
            context.fillStyle = "#fff8e9";
            context.font = "800 27px system-ui, sans-serif";
            context.fillText(`MANCHE ${round}  ·  PRÉPARE-TOI`, W / 2, 52);
        }
    }

    function frame(now) {
        const dt = Math.min((now - lastFrame) / 1000, 0.04);
        lastFrame = now;
        update(dt);
        draw(now / 1000);
        requestAnimationFrame(frame);
    }

    function setPaused() {
        if (mode === "playing") {
            mode = "paused";
            ui.pause.textContent = "Continuer";
            ui.pause.setAttribute("aria-label", "Continuer la partie");
        } else if (mode === "paused") {
            mode = "playing";
            ui.pause.textContent = "Pause";
            ui.pause.setAttribute("aria-label", "Mettre en pause");
        }
        updateHud();
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        ui.soundIcon.textContent = soundEnabled ? "♪" : "♫̸";
        ui.soundLabel.textContent = soundEnabled ? "Son" : "Muet";
        ui.sound.setAttribute("aria-pressed", String(soundEnabled));
        if (soundEnabled) { activateAudio(); playTone(500); }
    }

    function bindControls() {
        const gameSection = document.getElementById("disney2DSection");
        const isTextField = target => target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable='true']");

        window.addEventListener("keydown", event => {
            if (!gameSection?.classList.contains("active-section") || isTextField(event.target)) return;
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
            keys.add(event.code);
            if (event.repeat) return;
            if (event.code === "ShiftLeft" || event.code === "ShiftRight") useDash();
            if (event.code === "Escape" || event.code === "KeyP") setPaused();
            if ((event.code === "Enter" || event.code === "Space") && mode === "ready") startGame();
        });
        window.addEventListener("keyup", event => {
            if (!gameSection?.classList.contains("active-section") || isTextField(event.target)) return;
            keys.delete(event.code);
        });
        window.addEventListener("blur", () => { keys.clear(); if (mode === "playing") setPaused(); });
        document.querySelectorAll("[data-direction]").forEach(button => {
            const keyMap = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
            const press = event => { event.preventDefault(); keys.add(keyMap[button.dataset.direction]); };
            const release = event => { event.preventDefault(); keys.delete(keyMap[button.dataset.direction]); };
            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointercancel", release);
            button.addEventListener("pointerleave", release);
        });
        ui.primary.addEventListener("click", startGame);
        document.getElementById("arcadeRestart").addEventListener("click", startGame);
        ui.pause.addEventListener("click", setPaused);
        ui.dash.addEventListener("click", useDash);
        ui.sound.addEventListener("click", toggleSound);
        ui.overlay.addEventListener("click", event => { if (event.target === ui.overlay) ui.overlay.hidden = true; });
        document.addEventListener("visibilitychange", () => { if (document.hidden && mode === "playing") setPaused(); });
    }

    function init() {
        resizeCanvas();
        ui.best.textContent = String(bestScore).padStart(5, "0");
        ui.sound.setAttribute("aria-pressed", "true");
        ui.lives.textContent = "♥♥♥";
        updateCollection();
        showOverlay("DISNEYLAND PARIS · PARADE RUSH", "La parade va commencer !", "Ramasse 8 tickets par manche, collectionne les personnages et échappe aux gardiens. Les manches et leur difficulté n’ont pas de limite : la partie s’arrête quand tu n’as plus de vie.", "Jouer");
        bindControls();
        window.addEventListener("resize", resizeCanvas);
        if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(canvas);
        requestAnimationFrame(frame);
    }

    window.addEventListener(progressStore.eventName, event => {
        sharedProgress = event.detail;
        bestScore = sharedProgress.arcadeBestScore;
        collection = sharedProgress.collection;
        ui.best.textContent = String(bestScore).padStart(5, "0");
        ui.matchXp.textContent = String(sharedProgress.matchXp);
        ui.matchCapsules.textContent = String(sharedProgress.matchCapsules);
        updateCollection();
    });

    init();
})();
