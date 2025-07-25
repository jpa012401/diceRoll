const { parentPort } = require('worker_threads');

parentPort.on('message', () => {
  // Simulate dice roll (could be replaced with heavy computation)
  const roll = Math.floor(Math.random() * 6) + 1;
  parentPort.postMessage(roll);
});
