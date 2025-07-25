import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { Worker } from 'worker_threads';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 3000;

type Player = {
  id: string;
  name: string;
  roll?: number;
};

let players: Player[] = [];
let pendingPlayers: Player[] = [];
let roundActive = false;
let currentTurnIndex: number = 0;
let turnTimer: NodeJS.Timeout | null = null;
let totalRounds: number = 1;
let currentRound: number = 0;
let scores: { [id: string]: number } = {};

function rollDiceInWorker(): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, 'dice-worker.js'));
    worker.on('message', (roll) => resolve(roll));
    worker.on('error', reject);
    worker.postMessage('roll');
  });
}

function resetScores() {
  scores = {};
  players.forEach(p => { scores[p.id] = 0; });
}

function startTurn() {
  if (!roundActive || players.length === 0) return;
  if (currentTurnIndex >= players.length) {
    // All players rolled, end round
    roundActive = false;
    // Update scores
    players.forEach(p => {
      if (p.roll !== undefined) scores[p.id] = (scores[p.id] || 0) + p.roll!;
    });
    const maxRoll = Math.max(...players.map(p => p.roll || 0));
    const winners = players.filter(p => p.roll === maxRoll);
    io.emit('roundEnd', { winners, rolls: players, scores, currentRound, totalRounds });
    // Add pending players for next round
    if (pendingPlayers.length > 0) {
      players = players.concat(pendingPlayers.map(p => ({ ...p, roll: undefined })));
      pendingPlayers = [];
      io.emit('players', players);
    }
    // Start next round if not finished
    if (currentRound < totalRounds) {
      setTimeout(() => {
        currentRound++;
        players = players.map(p => ({ ...p, roll: undefined }));
        roundActive = true;
        currentTurnIndex = 0;
        io.emit('roundStart', { currentRound, totalRounds });
        startTurn();
      }, 2000); // 2s pause between rounds
    }
    return;
  }
  const currentPlayer = players[currentTurnIndex];
  io.emit('turn', { playerId: currentPlayer.id, index: currentTurnIndex });
  // Start 10s timer
  if (turnTimer) clearTimeout(turnTimer);
  turnTimer = setTimeout(() => {
    autoRoll(currentPlayer.id);
  }, 10000);
}

async function autoRoll(playerId: string) {
  if (!roundActive) return;
  const player = players.find(p => p.id === playerId);
  if (player && player.roll === undefined) {
    const roll = await rollDiceInWorker();
    player.roll = roll;
    io.emit('rolls', players.map(p => ({ id: p.id, name: p.name, roll: p.roll })));
    currentTurnIndex++;
    startTurn();
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('join', (name: string) => {
    if (roundActive) {
      // Don't allow joining mid-round, but queue for next round
      // Ensure unique name in pendingPlayers and players
      let baseName = name;
      let suffix = 0;
      let uniqueName = baseName;
      const allNames = players.concat(pendingPlayers).map(p => p.name);
      while (allNames.includes(uniqueName)) {
        suffix++;
        uniqueName = baseName + ' ' + suffix;
      }
      pendingPlayers.push({ id: socket.id, name: uniqueName });
      socket.emit('joinError', 'Wait for the next round to join.');
      return;
    }
    // Ensure unique name in players and pendingPlayers
    let baseName = name;
    let suffix = 0;
    let uniqueName = baseName;
    const allNames = players.concat(pendingPlayers).map(p => p.name);
    while (allNames.includes(uniqueName)) {
      suffix++;
      uniqueName = baseName + ' ' + suffix;
    }
    players.push({ id: socket.id, name: uniqueName });
    io.emit('players', players);
  });

  socket.on('roll', async () => {
    if (!roundActive) return;
    const currentPlayer = players[currentTurnIndex];
    if (socket.id !== currentPlayer.id) return; // Only current player can roll
    const roll = await rollDiceInWorker();
    const player = players.find(p => p.id === socket.id);
    if (player) player.roll = roll;
    io.emit('rolls', players.map(p => ({ id: p.id, name: p.name, roll: p.roll })));
    if (turnTimer) clearTimeout(turnTimer);
    currentTurnIndex++;
    startTurn();
  });

  socket.on('startRound', async (data?: { totalRounds?: number }) => {
    if (players.length === 0 || players[0].id !== socket.id) {
      // Only the first player can start a new round
      return;
    }
    if (data && data.totalRounds) {
      totalRounds = data.totalRounds;
      currentRound = 1;
      resetScores();
    } else if (currentRound === 0) {
      currentRound = 1;
      resetScores();
    } else {
      currentRound++;
    }
    players = players.map(p => ({ ...p, roll: undefined }));
    roundActive = true;
    currentTurnIndex = 0;
    io.emit('roundStart', { currentRound, totalRounds });
    startTurn();
  });

  socket.on('disconnect', () => {
    const wasCurrent = players[currentTurnIndex]?.id === socket.id;
    const playerIndex = players.findIndex(p => p.id === socket.id);
    if (roundActive && playerIndex !== -1) {
      const player = players[playerIndex];
      if (player.roll === undefined) {
        player.roll = 0; // Score 0 if not rolled
        io.emit('rolls', players.map(p => ({ id: p.id, name: p.name, roll: p.roll })));
      }
    }
    // If the player is before the current turn, decrement currentTurnIndex
    if (playerIndex !== -1 && playerIndex < currentTurnIndex) {
      currentTurnIndex--;
    }
    players = players.filter(p => p.id !== socket.id);
    io.emit('players', players);
    if (players.length === 0) {
      roundActive = false;
      if (turnTimer) clearTimeout(turnTimer);
    } else if (roundActive && wasCurrent) {
      if (turnTimer) clearTimeout(turnTimer);
      if (currentTurnIndex >= players.length) currentTurnIndex = 0;
      startTurn();
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

app.get('/', (_req, res) => {
  res.send('Dice Roller Game Server is running!');
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
