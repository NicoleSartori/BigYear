const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('src="state.js"')) {
    throw new Error('state.js non è caricato da index.html');
}

const app = fs.readFileSync('app.js', 'utf8');
const legacyStateDeclarations = [
    /^let selectedLocation\s*=/m,
    /^let map\s*=\s*null/m,
    /^let searchTimeout\s*=\s*null/m,
    /^let mapMarker\s*=\s*null/m,
    /^let speciesDatabase\s*=\s*\[\]/m,
    /^let selectedSpecies\s*=/m,
    /^let editingObservationId\s*=\s*null/m,
    /^let selectedAreaType\s*=/m,
    /^let observationsMap\s*=\s*null/m,
    /^let observationsMapLayer\s*=\s*null/m
];
if (legacyStateDeclarations.some(pattern => pattern.test(app))) {
    throw new Error('app.js contiene ancora una dichiarazione legacy dello stato centralizzato');
}

if (!app.includes('AppState.selectedLocation')) {
    throw new Error('AppState non sembra essere utilizzato per lo stato della posizione');
}

console.log('Frontend state smoke tests: OK');
