/* BigYear shared utilities */
(function (window) {
    "use strict";

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeKey(value) {
        return value == null ? "" : String(value).trim().toLowerCase();
    }

    function distanceMeters(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371000;
        const toRadians = value => value * Math.PI / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;
        return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    window.BigYearUtils = Object.freeze({
        escapeHtml,
        normalizeKey,
        distanceMeters
    });
})(window);
