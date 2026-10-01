// ==========================================
// JARVIS GESTURE CONTROL
// V3
// - Détection des mains
// - Choix de caméra
// - Curseur à l'index
// - Zone gestuelle élargie
// - Lissage du curseur
// - Pincement pouce + index = clic
// ==========================================


import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/+esm";


// ==========================================
// ELEMENTS HTML
// ==========================================

const video =
    document.getElementById("camera");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const status =
    document.getElementById("status");

const gesture =
    document.getElementById("gesture");

const cameraSelect =
    document.getElementById("cameraSelect");

const virtualCursor =
    document.getElementById("virtualCursor");


// ==========================================
// VARIABLES
// ==========================================

let handLandmarker = null;

let lastVideoTime = -1;

let currentStream = null;

let detectingHands = false;


// ==========================================
// REGLAGES DU CURSEUR
// ==========================================

// Zone de la caméra utilisée
// pour contrôler tout l'écran

const GESTURE_LEFT = 0.18;
const GESTURE_RIGHT = 0.82;

const GESTURE_TOP = 0.12;
const GESTURE_BOTTOM = 0.88;


// Lissage du curseur
// Plus c'est élevé, plus le curseur
// suit rapidement le doigt.

const CURSOR_SMOOTHING = 0.28;


// Position actuelle du curseur

let cursorCurrentX =
    window.innerWidth / 2;

let cursorCurrentY =
    window.innerHeight / 2;


// ==========================================
// VARIABLES DU CLIC
// ==========================================

let pinchActive = false;

let lastClickTime = 0;


// Temps minimum entre deux clics

const CLICK_COOLDOWN = 500;


// Distance maximale entre pouce
// et index pour considérer un pincement

const PINCH_DISTANCE = 0.07;


// ==========================================
// INITIALISATION MEDIAPIPE
// ==========================================

async function initializeHandTracking() {

    try {

        status.textContent =
            "Chargement du système...";

        gesture.textContent =
            "Initialisation de JARVIS...";


        console.log(
            "JARVIS : chargement de MediaPipe..."
        );


        const vision =
            await FilesetResolver.forVisionTasks(

                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm"

            );


        console.log(
            "JARVIS : moteur vision chargé."
        );


        handLandmarker =
            await HandLandmarker.createFromOptions(

                vision,

                {

                    baseOptions: {

                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

                        delegate: "GPU"

                    },


                    runningMode:
                        "VIDEO",


                    numHands:
                        2

                }

            );


        console.log(
            "JARVIS : détecteur de mains chargé."
        );


        status.textContent =
            "Système prêt";

        gesture.textContent =
            "Recherche des caméras...";


        await loadCameras();


    }

    catch (error) {

        console.error(
            "ERREUR MEDIAPIPE :",
            error
        );


        status.textContent =
            "Erreur d'initialisation";


        gesture.textContent =
            "MediaPipe n'a pas pu démarrer.";

    }

}


// ==========================================
// RECHERCHE DES CAMERAS
// ==========================================

async function loadCameras() {

    try {

        console.log(
            "JARVIS : recherche des caméras..."
        );


        status.textContent =
            "Recherche des caméras...";


        gesture.textContent =
            "Autorisation caméra nécessaire";


        const temporaryStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: true,

                    audio: false

                });


        temporaryStream
            .getTracks()
            .forEach(

                track => track.stop()

            );


        const devices =
            await navigator.mediaDevices
                .enumerateDevices();


        const cameras =
            devices.filter(

                device =>
                    device.kind ===
                    "videoinput"

            );


        console.log(
            "CAMERAS DISPONIBLES :"
        );


        cameras.forEach(

            (camera, index) => {

                console.log(

                    index,
                    camera.label,
                    camera.deviceId

                );

            }

        );


        cameraSelect.innerHTML = "";


        if (cameras.length === 0) {

            const option =
                document.createElement(
                    "option"
                );


            option.textContent =
                "Aucune caméra trouvée";


            option.value = "";


            cameraSelect.appendChild(
                option
            );


            status.textContent =
                "Aucune caméra";


            gesture.textContent =
                "Aucune caméra disponible";


            return;

        }


        cameras.forEach(

            (camera, index) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    camera.deviceId;


                option.textContent =
                    camera.label ||
                    `Caméra ${index + 1}`;


                cameraSelect.appendChild(
                    option
                );

            }

        );


        status.textContent =
            "Caméra disponible";


        gesture.textContent =
            "Choisis la caméra à utiliser";


        cameraSelect.value =
            cameras[0].deviceId;


        await startSelectedCamera(
            cameras[0].deviceId
        );


    }

    catch (error) {

        console.error(
            "ERREUR CAMERAS :",
            error
        );


        status.textContent =
            "Erreur caméra";


        gesture.textContent =
            `${error.name} : ${error.message}`;

    }

}


// ==========================================
// CAMERA SELECTIONNEE
// ==========================================

async function startSelectedCamera(
    deviceId
) {

    try {

        console.log(
            "JARVIS : changement de caméra..."
        );


        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(

                    track => track.stop()

                );


            currentStream = null;

        }


        video.srcObject =
            null;


        status.textContent =
            "Activation de la caméra...";


        gesture.textContent =
            "Démarrage...";


        const stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        deviceId: {

                            exact: deviceId

                        },

                        width: {

                            ideal: 1280

                        },

                        height: {

                            ideal: 720

                        }

                    },

                    audio: false

                });


        currentStream =
            stream;


        video.srcObject =
            stream;


        video.onloadeddata = () => {

            canvas.width =
                video.videoWidth;

            canvas.height =
                video.videoHeight;


            status.textContent =
                "Caméra active";


            gesture.textContent =
                "Montre ta main à la caméra";


            console.log(
                "JARVIS : caméra active."
            );


            if (!detectingHands) {

                detectHands();

            }

        };


    }

    catch (error) {

        console.error(
            "ERREUR CAMERA :",
            error
        );


        status.textContent =
            "Erreur caméra";


        gesture.textContent =
            `${error.name} : ${error.message}`;

    }

}


// ==========================================
// CHANGEMENT DE CAMERA
// ==========================================

cameraSelect.addEventListener(

    "change",

    async () => {

        const selectedCamera =
            cameraSelect.value;


        if (!selectedCamera) {

            return;

        }


        await startSelectedCamera(
            selectedCamera
        );

    }

);


// ==========================================
// DETECTION DES MAINS
// ==========================================

async function detectHands() {

    if (detectingHands) {

        return;

    }


    detectingHands = true;


    if (!handLandmarker) {

        detectingHands = false;

        return;

    }


    if (video.readyState >= 2) {

        if (
            video.currentTime !==
            lastVideoTime
        ) {

            lastVideoTime =
                video.currentTime;


            const results =
                handLandmarker.detectForVideo(

                    video,

                    performance.now()

                );


            drawHands(results);

        }

    }


    detectingHands = false;


    requestAnimationFrame(
        detectHands
    );

}


// ==========================================
// AFFICHAGE + CONTROLE GESTUEL
// ==========================================

function drawHands(results) {

    ctx.clearRect(

        0,
        0,
        canvas.width,
        canvas.height

    );


    // ======================================
    // AUCUNE MAIN
    // ======================================

    if (
        !results.landmarks ||
        results.landmarks.length === 0
    ) {

        gesture.textContent =
            "Aucune main détectée";


        virtualCursor.style.display =
            "none";


        pinchActive = false;


        return;

    }


    // ======================================
    // MAIN PRINCIPALE
    // ======================================

    const hand =
        results.landmarks[0];


    // ======================================
    // INDEX
    // ======================================

    const indexTip =
        hand[8];


    // ======================================
    // COORDONNEES BRUTES
    // ======================================

    let normalizedX =
        indexTip.x;

    let normalizedY =
        indexTip.y;


    // ======================================
    // ZONE GESTUELLE
    // ======================================

    normalizedX =
        (normalizedX - GESTURE_LEFT) /
        (GESTURE_RIGHT - GESTURE_LEFT);


    normalizedY =
        (normalizedY - GESTURE_TOP) /
        (GESTURE_BOTTOM - GESTURE_TOP);


    // ======================================
    // LIMITATION 0 → 1
    // ======================================

    normalizedX =
        Math.max(
            0,
            Math.min(
                1,
                normalizedX
            )
        );


    normalizedY =
        Math.max(
            0,
            Math.min(
                1,
                normalizedY
            )
        );


    // ======================================
    // MIROIR HORIZONTAL
    // ======================================

    normalizedX =
        1 - normalizedX;


    // ======================================
    // CONVERSION EN PIXELS
    // ======================================

    const targetX =
        normalizedX *
        window.innerWidth;


    const targetY =
        normalizedY *
        window.innerHeight;


    // ======================================
    // LISSAGE
    // ======================================

    cursorCurrentX +=

        (
            targetX -
            cursorCurrentX
        ) *
        CURSOR_SMOOTHING;


    cursorCurrentY +=

        (
            targetY -
            cursorCurrentY
        ) *
        CURSOR_SMOOTHING;


    // ======================================
    // POSITION DU CURSEUR
    // ======================================

    virtualCursor.style.left =
        `${cursorCurrentX}px`;


    virtualCursor.style.top =
        `${cursorCurrentY}px`;


    virtualCursor.style.display =
        "block";


    // ======================================
    // DETECTION DU PINCEMENT
    // ======================================

    const thumbTip =
        hand[4];


    const dx =
        thumbTip.x -
        indexTip.x;


    const dy =
        thumbTip.y -
        indexTip.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const isPinching =
        distance <
        PINCH_DISTANCE;


    // ======================================
    // PINCEMENT DETECTE
    // ======================================

    if (isPinching) {

        virtualCursor.classList.add(
            "pinching"
        );


        gesture.textContent =
            "👌 Pincement détecté";


        // Nouveau pincement
        // uniquement après relâchement

        if (!pinchActive) {

            const now =
                Date.now();


            if (
                now - lastClickTime >
                CLICK_COOLDOWN
            ) {

                performClick();

                lastClickTime =
                    now;

            }


            pinchActive = true;

        }

    }

    else {

        virtualCursor.classList.remove(
            "pinching"
        );


        gesture.textContent =
            "☝️ Déplacement";


        pinchActive = false;

    }


    // ======================================
    // DESSIN DE LA MAIN
    // ======================================

    for (
        const landmarks
        of results.landmarks
    ) {

        drawConnections(
            landmarks
        );


        for (
            const point
            of landmarks
        ) {

            const x =
                point.x *
                canvas.width;


            const y =
                point.y *
                canvas.height;


            ctx.beginPath();


            ctx.arc(

                x,
                y,
                6,
                0,
                Math.PI * 2

            );


            ctx.fillStyle =
                "#ffffff";


            ctx.fill();

        }

    }

}


// ==========================================
// CLIC
// ==========================================

function performClick() {

    console.log(
        "JARVIS : CLIC GESTUEL"
    );


    // Position du curseur
    // dans la page

    const element =
        document.elementFromPoint(

            cursorCurrentX,
            cursorCurrentY

        );


    if (!element) {

        return;

    }


    console.log(
        "Élément cliqué :",
        element
    );


    // Déclenchement d'un vrai
    // clic DOM

    element.click();


    // Petit effet visuel

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


// ==========================================
// CONNEXIONS DES DOIGTS
// ==========================================

function drawConnections(
    landmarks
) {

    const connections = [

        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],

        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],

        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12],

        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16],

        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20],

        [5, 9],
        [9, 13],
        [13, 17]

    ];


    ctx.strokeStyle =
        "#ffffff";


    ctx.lineWidth =
        3;


    for (
        const [start, end]
        of connections
    ) {

        const x1 =
            landmarks[start].x *
            canvas.width;


        const y1 =
            landmarks[start].y *
            canvas.height;


        const x2 =
            landmarks[end].x *
            canvas.width;


        const y2 =
            landmarks[end].y *
            canvas.height;


        ctx.beginPath();


        ctx.moveTo(
            x1,
            y1
        );


        ctx.lineTo(
            x2,
            y2
        );


        ctx.stroke();

    }

}


// ==========================================
// ADAPTATION A LA TAILLE DE L'ECRAN
// ==========================================

window.addEventListener(
    "resize",
    () => {

        cursorCurrentX =
            window.innerWidth / 2;

        cursorCurrentY =
            window.innerHeight / 2;

    }
);


// ==========================================
// LANCEMENT
// ==========================================

console.log(
    "JARVIS GESTURE CONTROL : V3 chargée."
);


initializeHandTracking();