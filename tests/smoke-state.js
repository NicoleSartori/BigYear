const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('state.js', 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(code, context);

const state = context.window.AppState;
const expected = [
    'selectedLocation',
    'map',
    'searchTimeout',
    'mapMarker',
    'speciesDatabase',
    'selectedSpecies',
    'editingObservationId',
    'selectedObserverKeys',
    'selectedAreaType',
    'observationsMap',
    'observationsMapLayer'
];

for (const key of expected) {
    if (!(key in state)) throw new Error(`Stato mancante: ${key}`);
}

if (state.selectedLocation.latitude !== null || state.selectedLocation.longitude !== null) {
    throw new Error('Stato posizione iniziale non valido');
}

if (!Array.isArray(state.speciesDatabase)) {
    throw new Error('speciesDatabase deve essere un array');
}

console.log('App state smoke tests: OK');
