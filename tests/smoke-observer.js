const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const app = fs.readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
const identityStart = app.indexOf('function getParticipantIdentity');
const renderStart = app.indexOf('function renderObserverOptions', identityStart);
if (identityStart === -1 || renderStart === -1) throw new Error('Observer identity helpers missing');

const context = {
    console,
    window: {
        BigYearCloud: {
            isUuid: value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
        }
    }
};
vm.createContext(context);
vm.runInContext(app.slice(identityStart, renderStart), context);

const project = {
    participants: [
        { email: 'first@example.com', accountId: '11111111-1111-4111-8111-111111111111', status: 'accepted' },
        { email: 'second@example.com', accountId: '22222222-2222-4222-8222-222222222222', status: 'accepted' }
    ]
};

assert.deepStrictEqual(
    Array.from(context.resolveObserverAccountIds(project, ['first@example.com', 'second@example.com'])).sort(),
    [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222'
    ].sort()
);

const formatStart = app.indexOf('function formatObservationDate');
const formatEndMarker = '\n// ==========================================\n// RICERCA CHECKLIST';
const formatEnd = app.indexOf(formatEndMarker, formatStart);
if (formatStart === -1 || formatEnd < 2) throw new Error('Date formatter missing');
vm.runInContext(app.slice(formatStart, formatEnd), context);
assert.strictEqual(context.formatObservationDate('2026-09-02'), '2 settembre 2026');
const dateTimeStart = app.indexOf('function formatObservationDateTime');
const dateTimeEnd = app.indexOf("\n}\n\n// ==========================================\n// RICERCA CHECKLIST", dateTimeStart) + 2;
vm.runInContext(app.slice(dateTimeStart, dateTimeEnd), context);
assert.strictEqual(context.formatObservationDateTime({ date: '2026-09-02', time: '08:15' }), '02/09/2026 · 08:15');

console.log('Observer/date regression smoke tests: OK');
