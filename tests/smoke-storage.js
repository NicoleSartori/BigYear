const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const store = new Map();
const context = {
  console: { error() {} },
  window: {
    localStorage: {
      getItem: key => store.has(key) ? store.get(key) : null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: key => store.delete(key)
    }
  }
};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname, '..', 'storage.js'), 'utf8'), context);
const storage = context.window.BigYearStorage;

assert.strictEqual(storage.get('missing'), null);
assert.strictEqual(storage.set('name', 'Nicole'), true);
assert.strictEqual(storage.get('name'), 'Nicole');
assert.strictEqual(storage.writeJSON('project', { id: 'by_test', participants: [] }), true);
assert.strictEqual(JSON.stringify(storage.readJSON('project')), JSON.stringify({ id: 'by_test', participants: [] }));
assert.strictEqual(storage.readJSON('broken', { fallback: true }).fallback, true);
assert.strictEqual(storage.writeJSON('bigYearProjects', [{ id: 'old-user-project' }]), true);
assert.strictEqual(storage.writeJSON('bigYearProject', { id: 'old-user-current' }), true);
assert.strictEqual(storage.writeJSON('bigYearObservations', [{ id: 'old-observation' }]), true);
assert.strictEqual(storage.clearProjectCache(), true);
assert.strictEqual(storage.get('bigYearProject'), null);
assert.strictEqual(storage.get('bigYearProjects'), null);
assert.strictEqual(storage.get('bigYearObservations'), null);
assert.strictEqual(storage.remove('name'), true);
assert.strictEqual(storage.get('name'), null);

console.log('Storage smoke tests: OK');
