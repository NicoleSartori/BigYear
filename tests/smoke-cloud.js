const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const cloud = fs.readFileSync(require('path').join(__dirname, '..', 'cloud.js'), 'utf8');
let savedRow = null;

const participantRows = [
    { account_id: '11111111-1111-4111-8111-111111111111', email: 'first@example.com', id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    { account_id: '22222222-2222-4222-8222-222222222222', email: 'second@example.com', id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
];

function makeQuery(name) {
    const query = {
        select() { return query; },
        eq() {
            if (name === 'big_year_participants') {
                return Promise.resolve({ data: participantRows, error: null });
            }
            return query;
        },
        async upsert(row) {
            savedRow = row;
            return { data: row, error: null };
        }
    };
    return query;
}

const context = {
    console,
    window: {
        BigYearSupabase: { client: { from: makeQuery } },
        BigYearAuth: {
            getUser: () => ({ id: participantRows[1].account_id }),
            isAuthenticated: () => true
        },
        BigYearStorage: { readJSON: () => [], writeJSON: () => {} }
    }
};
vm.createContext(context);
vm.runInContext(cloud, context);

(async () => {
    const observation = {
        id: '33333333-3333-4333-8333-333333333333',
        projectId: '99999999-9999-4999-8999-999999999999',
        observers: ['first@example.com', 'second@example.com'],
        observerAccountIds: []
    };
    await context.window.BigYearCloud.pushObservation(observation);

    assert.ok(Array.isArray(savedRow.observer_ids), 'observer_ids must be an array, not a Set');
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(savedRow.observer_ids)).sort(),
        participantRows.map(row => row.account_id).sort()
    );
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(observation.observerAccountIds)).sort(),
        participantRows.map(row => row.account_id).sort()
    );

    console.log('Cloud observer persistence regression tests: OK');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
