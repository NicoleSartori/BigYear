// ==========================================
// BIGYEAR - APP STATE
// Single in-memory source of truth for mutable UI/application state.
// Persistence remains handled by storage.js.
// ==========================================

window.AppState = {
    selectedLocation: {
        name: null,
        latitude: null,
        longitude: null
    },
    map: null,
    searchTimeout: null,
    mapMarker: null,
    speciesDatabase: [],
    selectedSpecies: {
        id: null,
        nomeItaliano: "",
        nomeScientifico: ""
    },
    editingObservationId: null,
    selectedObserverKeys: [],
    observerSelectionInitialized: false,
    selectedAreaType: "country",
    observationsMap: null,
    observationsMapLayer: null
};
