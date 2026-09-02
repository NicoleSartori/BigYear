/* BigYear Repository
 * Single data-access facade. UI/features should use this module instead of
 * knowing whether data is stored in localStorage or a future backend.
 */
(function () {
    "use strict";

    const STORAGE = window.BigYearStorage;

    function get(key, fallback = null) { return STORAGE.get(key, fallback); }
    function set(key, value) { return STORAGE.set(key, value); }
    function remove(key) { return STORAGE.remove(key); }

    window.BigYearRepository = Object.freeze({
        get, set, remove,
        readJSON: STORAGE.readJSON,
        writeJSON: STORAGE.writeJSON
    });
})();
