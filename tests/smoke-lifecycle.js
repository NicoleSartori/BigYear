const fs = require('fs');
const app = fs.readFileSync('./app.js', 'utf8');
const cloud = fs.readFileSync('./cloud.js', 'utf8');
const friends = fs.readFileSync('./friends.js', 'utf8');
for (const token of ['getBigYearStatus', 'isObservationWithinBigYear', 'bigYearHistoryList', 'startNewBigYearButton', 'countsInBigYear']) {
  if (!app.includes(token)) throw new Error(`Missing lifecycle token: ${token}`);
}
if (!cloud.includes('transferBigYearOwnership')) throw new Error('Missing admin transfer boundary');
if (!friends.includes('exited')) throw new Error('Missing exited friend state');
console.log('Lifecycle smoke tests: OK');
