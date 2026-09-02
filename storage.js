/* BigYear storage adapter
 * Keeps persistence details in one place so the UI/domain code does not
 * depend directly on localStorage. This is intentionally localStorage-backed
 * for the prototype and can later be swapped for Supabase without changing
 * every feature module.
 */
(function (window) {
    "use strict";

    const PREFIX = "bigYear";

    function get(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            console.error("BigYear storage read failed:", key, error);
            return null;
        }
    }

    function set(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error("BigYear storage write failed:", key, error);
            return false;
        }
    }

    function remove(key) {
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error("BigYear storage remove failed:", key, error);
            return false;
        }
    }

    function readJSON(key, fallback = null) {
        const raw = get(key);
        if (raw == null || raw === "") return fallback;
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error("BigYear invalid JSON:", key, error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            return set(key, JSON.stringify(value));
        } catch (error) {
            console.error("BigYear JSON serialization failed:", key, error);
            return false;
        }
    }

    function clearProjectCache() {
        try {
            window.localStorage.removeItem("bigYearProject");
            window.localStorage.removeItem("bigYearProjects");
            window.localStorage.removeItem("bigYearObservations");

            const keysToRemove = [];
            for (let i = 0; i < window.localStorage.length; i += 1) {
                const key = window.localStorage.key(i);
                if (key && key.indexOf("bigYearProject_") === 0) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(function (key) {
                window.localStorage.removeItem(key);
            });

            return true;
        } catch (error) {
            console.error("BigYear project cache clear failed:", error);
            return false;
        }
    }

    window.BigYearStorage = Object.freeze({
        PREFIX,
        get,
        set,
        remove,
        readJSON,
        writeJSON,
        clearProjectCache
    });
})(window);
