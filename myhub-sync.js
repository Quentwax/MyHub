(() => {
    "use strict";

    const FIELD_PATH = "users";
    const registrations = new Map();
    const readyFields = new Set();
    const failedFields = new Set();
    const pendingUpdates = new Map();
    let activeUid = null;
    let activeDatabase = null;

    function updateStatus(message) {
        const status = document.getElementById("disneyAuthStatus");
        if (status) status.textContent = message;
        const memoStatus = document.getElementById("memoStatus");
        if (memoStatus) {
            memoStatus.textContent = message.includes("échoué") || message.includes("refuse")
                ? "Sauvegardé localement · échec de synchronisation cloud"
                : activeUid
                    ? "Sauvegarde locale + cloud · compte connecté"
                    : "Sauvegarde locale · connecte-toi pour synchroniser";
        }
    }

    function getFieldRef(field) {
        return activeDatabase.ref(`${FIELD_PATH}/${activeUid}/myhub/${field}`);
    }

    function syncRegisteredField(field) {
        const registration = registrations.get(field);
        if (!activeUid || !activeDatabase || !registration || registration.ref) return;

        const uid = activeUid;
        const ref = getFieldRef(field);
        registration.ref = ref;
        const localValue = registration.read();

        ref.transaction(
            remoteValue => registration.merge(localValue, remoteValue),
            (error, committed, snapshot) => {
                if (error) {
                    registration.ref = null;
                    failedFields.add(field);
                    console.error(`Impossible de synchroniser ${field} avec Firebase :`, error);
                    updateStatus(error.code === "PERMISSION_DENIED"
                        ? "Firebase refuse l’accès. Vérifie les règles de la base MyHub."
                        : "Connecté, mais la synchronisation de MyHub a échoué.");
                    return;
                }
                if (!committed || activeUid !== uid) {
                    registration.ref = null;
                    return;
                }

                readyFields.add(field);
                failedFields.delete(field);
                registration.apply(snapshot.val());
                ref.on("value", remoteSnapshot => {
                    if (activeUid !== uid || !readyFields.has(field)) return;
                    if (remoteSnapshot.exists()) registration.apply(remoteSnapshot.val());
                }, listenerError => {
                    failedFields.add(field);
                    console.error(`Impossible de suivre les changements de ${field} :`, listenerError);
                    updateStatus("Connecté, mais la synchronisation de MyHub a échoué.");
                });
                if (failedFields.size === 0 && readyFields.size === registrations.size) {
                    updateStatus("Compte connecté · données synchronisées");
                }
            },
            false
        );
    }

    function flushUpdate(field) {
        const value = pendingUpdates.get(field);
        pendingUpdates.delete(field);
        const registration = registrations.get(field);
        if (value === undefined || !activeUid || !activeDatabase || !registration || !readyFields.has(field)) return;

        registration.ref.transaction(
            remoteValue => registration.mergeUpdate(value, remoteValue),
            (error, committed, snapshot) => {
                if (error) {
                    failedFields.add(field);
                    console.error(`Impossible d’enregistrer ${field} dans Firebase :`, error);
                    updateStatus(error.code === "PERMISSION_DENIED"
                        ? "Firebase refuse l’accès. Vérifie les règles de la base MyHub."
                        : "Connecté, mais l’enregistrement cloud a échoué.");
                    return;
                }
                if (committed) {
                    failedFields.delete(field);
                    registration.apply(snapshot.val());
                    if (failedFields.size === 0 && readyFields.size === registrations.size) {
                        updateStatus("Compte connecté · données synchronisées");
                    }
                }
            },
            false
        );
    }

    function update(field, value) {
        if (!registrations.has(field)) {
            console.error(`La synchronisation de « ${field} » n’est pas configurée.`);
            return;
        }
        pendingUpdates.set(field, value);
        if (!activeUid || !readyFields.has(field)) return;

        const existingTimer = pendingUpdates.get(`${field}:timer`);
        if (existingTimer) clearTimeout(existingTimer);
        pendingUpdates.set(`${field}:timer`, setTimeout(() => {
            pendingUpdates.delete(`${field}:timer`);
            flushUpdate(field);
        }, 300));
    }

    function register(field, handlers) {
        registrations.set(field, { ...handlers, ref: null });
        syncRegisteredField(field);
    }

    function initialize() {
        if (!window.firebase || !firebase.apps || firebase.apps.length === 0) {
            updateStatus("Synchronisation cloud indisponible.");
            return;
        }

        firebase.auth().onAuthStateChanged(user => {
            if (activeDatabase) {
                registrations.forEach(registration => {
                    if (registration.ref) registration.ref.off("value");
                    registration.ref = null;
                });
            }
            readyFields.clear();
            failedFields.clear();
            activeUid = user ? user.uid : null;
            activeDatabase = user ? firebase.database() : null;

            if (!user) {
                updateStatus("Connecte-toi avec Google pour synchroniser tes données entre appareils.");
                return;
            }

            updateStatus(`Connecté : ${user.displayName || user.email || "Compte Google"} · synchronisation…`);
            registrations.forEach((registration, field) => {
                registration.ref = null;
                syncRegisteredField(field);
            });
        });
    }

    window.MyHubCloudSync = { register, update };
    initialize();
})();
