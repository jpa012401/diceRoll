# Multiplayer Dice Roller Game

## Quick Start

### Prerequisites
- **Node.js 20+** (required for worker threads and modern Angular)
- **npm**

### 1. Start the Backend Server
```bash
cd server
npm install        # Only needed once
npm run dev        # Starts the backend on http://localhost:3000
```

### 2. Start the Angular Frontend
- If you have the Angular CLI installed globally:
```bash
  cd ..              # From /server back to project root
  npm install        # Only needed once (in project root)
  ng serve           # Starts the frontend on http://localhost:4200
```
- If you do **not** have Angular CLI globally, use:
```bash
  npm start          # Uses the local Angular CLI to start the frontend
  # The app will be available at http://localhost:4200
  ```

- Open multiple browser tabs/windows at http://localhost:4200 to simulate multiple players.
- The backend and frontend must both be running for the game to work.

---

## Overview
This project is a real-time, multiplayer dice roller game built with an Angular frontend and a Node.js (Express + Socket.io) backend. Players join a lobby, and in each round, take turns rolling a dice. The game supports multiple rounds, automatic turn management, and fair scoring, with a gamified UI and robust handling of player connections.

---

## Features
- **Real-time Multiplayer:** Multiple players can join and play together in real time.
- **Turn-based Rolling:** Only the current player can roll; others must wait for their turn.
- **Automatic Turn Timer:** Each player has 10 seconds to roll; if they don't, the server rolls for them.
- **Multiple Rounds:** The host sets the number of rounds; scores are accumulated across rounds.
- **Fair Scoring:** If a player disconnects before rolling, they get a score of 0 for that round; if they already rolled, their score is kept.
- **Unique Player Names:** Duplicate names are automatically suffixed with a number.
- **Host Controls:** Only the first player (host) can start a new game.
- **Responsive, Gamified UI:** Modern, accessible, and visually engaging interface.
- **Robust Connection Handling:** Handles mid-game joins, disconnects, and reconnections gracefully.

---

## Architecture

### Backend (Node.js + Express + Socket.io)
- **Express** serves as the HTTP server (for health checks, not for serving the frontend).
- **Socket.io** manages real-time, bidirectional communication between server and clients.
- **Worker Threads** are used for dice rolling to demonstrate parallelism, though the computation is lightweight.
- **Game State:**
  - `players`: Array of connected players (id, name, roll).
  - `pendingPlayers`: Players who join mid-round, queued for the next round.
  - `scores`: Cumulative scores for each player.
  - `currentTurnIndex`, `currentRound`, `totalRounds`: Track game progress.
- **Turn Management:**
  - Only the player at `currentTurnIndex` can roll.
  - If a player disconnects before rolling, their roll is set to 0.
  - After all players roll, the server either starts the next round or ends the game.
- **Events:**
  - `join`: Player joins the game (with unique name logic).
  - `startRound`: Host starts a new game or round (with round count).
  - `roll`: Player requests to roll the dice (validated by turn).
  - `turn`: Server notifies clients whose turn it is.
  - `roundStart`, `roundEnd`: Server notifies clients of round/game state.
  - `players`: Updates the player list for all clients.

### Frontend (Angular)
- **Component-based UI:** All logic is in a single, focused component (`dice-roll`).
- **Modern Angular Syntax:** Uses `@if` and `@for` blocks for control flow, and best practices for state and template management.
- **Socket.io-client:** Handles all real-time communication with the backend.
- **State Management:**
  - Tracks players, rolls, scores, current turn, round, and UI state (e.g., timers, error messages).
  - Only the host can start a new game; others see a waiting message.
- **User Experience:**
  - Clear indication of whose turn it is, with a countdown timer.
  - Gamified dice visuals and responsive layout.
  - Final scores and winner(s) shown at the end of all rounds.
  - Handles duplicate names, mid-game joins, and disconnects gracefully.

---

## Implementation Details

### Server Logic
- **Player Join:**
  - If a player joins mid-round, they're added to `pendingPlayers` and join the next round.
  - Names are made unique by appending a number if needed (e.g., Alice, Alice 1).
- **Turn Sequence:**
  - The server emits a `turn` event to all clients, indicating whose turn it is.
  - Only the current player can roll; others' roll buttons are disabled.
  - If the timer expires, the server auto-rolls for the player.
- **Round and Game Flow:**
  - The host sets the number of rounds before starting.
  - After each round, scores are updated and the next round starts automatically (with a short pause).
  - After the last round, final scores and winners are broadcast.
- **Disconnections:**
  - If a player disconnects before rolling, their roll is set to 0.
  - If they disconnect after rolling, their score is kept.
  - The turn order and round flow are adjusted as needed.
- **Worker Thread:**
  - Dice rolling is performed in a worker thread for demonstration, though not strictly necessary for performance.

### Frontend Logic
- **Joining and Naming:**
  - Players enter a name; if it's taken, a number is appended.
  - If joining mid-round, a message is shown and the player waits for the next round.
- **Game Controls:**
  - Only the host (first player) can start a new game.
  - The number of rounds can be set before starting.
  - The UI disables the start button while editing rounds or during transitions.
- **Turn and Timer:**
  - The UI shows whose turn it is and a countdown timer.
  - Only the current player can roll; others see a waiting message.
- **Scoring and Results:**
  - After each round, scores are updated.
  - After the final round, a summary of all scores and the winner(s) is shown.
- **Design:**
  - Responsive, accessible, and visually engaging.
  - Special styling for round input and round transitions.

---

## How to Run

### Prerequisites
- Node.js (v20+ required)
- npm

### Setup
1. **Install dependencies:**
   - In `/server`: `npm install`
   - In project root: `npm install` (for Angular frontend)
2. **Start the backend:**
   - `cd server && npm run dev`
3. **Start the frontend:**
   - If you have Angular CLI: `ng serve`
   - If not: `npm start`
4. **Open the app:**
   - Visit `http://localhost:4200` in multiple browser windows/tabs to simulate multiple players.

---

## Presenting the Project
- **Architecture:** Explain the separation of concerns between backend (game logic, real-time events) and frontend (UI, state, user interaction).
- **Game Flow:** Demonstrate joining, starting a game, turn-based rolling, timer, and scoring.
- **Robustness:** Show how the app handles disconnects, duplicate names, and mid-game joins.
- **Extensibility:** The codebase is ready for enhancements (e.g., chat, avatars, more game types) and follows best practices for maintainability.

---

## Further Improvements (Ideas)
- Add chat or emoji reactions.
- Add player avatars or profile pictures.
- Add sound effects or dice roll animations.
- Support for mobile devices and touch controls.
- Persistent leaderboards or player stats.
- Admin/host transfer if the first player leaves.

---

## License
MIT
