import { Component } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Player {
  id: string;
  name: string;
  roll?: number;
}

@Component({
  selector: 'app-dice-roll',
  templateUrl: './dice-roll.html',
  styleUrl: './dice-roll.css',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DiceRoll {
  socket: Socket;
  players: Player[] = [];
  myId: string = '';
  myName: string = '';
  myRoll?: number;
  roundActive = false;
  winners: Player[] = [];
  rolls: Player[] = [];
  joined = false;
  currentTurnId: string = '';
  currentTurnIndex: number = 0;
  turnTimer: any;
  turnCountdown: number = 0;
  joinError: string = '';
  totalRounds: number = 1;
  currentRound: number = 0;
  scores: { [id: string]: number } = {};
  isStartingRound: boolean = false;
  roundsInputFocused: boolean = false;
  startingRoundText: string = '';

  constructor() {
    // Author Console Log
    console.log('Created By: John Paul S. Alabe');
    console.log('Course: MIT');
    console.log('Contact: alabejohnpaul@gmail.com');
    console.log('Date: July 25, 2025');
    console.log('Subject: MITC701 - Advance OS and Network');
    const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const socketUrl = isProd ? undefined : 'http://localhost:3000';
    this.socket = io(socketUrl);
    this.registerSocketEvents();
  }

  registerSocketEvents() {
    this.socket.on('connect', () => {
      this.myId = this.socket.id || '';
      console.log('connected', this.myId);
    });
    this.socket.on('players', (players: Player[]) => {
      this.players = players;
    });
    this.socket.on('roundStart', (data?: { currentRound?: number, totalRounds?: number }) => {
      this.roundActive = true;
      this.myRoll = undefined;
      this.winners = [];
      this.rolls = [];
      this.isStartingRound = false;
      // this.startingRoundText = data && data.currentRound ? `Starting round ${data.currentRound}...` : '';
      if (data) {
        this.currentRound = data.currentRound || 1;
        this.totalRounds = data.totalRounds || 1;
      }
      setTimeout(() => { this.startingRoundText = ''; }, 500);
    });
    this.socket.on('rolls', (rolls: Player[]) => {
      this.rolls = rolls;
    });
    this.socket.on('turn', (data: { playerId: string, index: number }) => {
      this.currentTurnId = data.playerId;
      this.currentTurnIndex = data.index;
      this.turnCountdown = 10;
      if (this.turnTimer) clearInterval(this.turnTimer);
      this.turnTimer = setInterval(() => {
        this.turnCountdown--;
        if (this.turnCountdown <= 0) {
          clearInterval(this.turnTimer);
        }
      }, 1000);
    });
    this.socket.on('roundEnd', (data: { winners: Player[], rolls: Player[], scores?: { [id: string]: number }, currentRound?: number, totalRounds?: number }) => {
      if (this.currentRound === this.totalRounds) {
        this.roundActive = false;
        this.winners = data.winners;
        this.rolls = data.rolls;
        this.currentTurnId = '';
        this.turnCountdown = 0;
      }else{
        this.startingRoundText = `End of round ${this.currentRound}...\nStarting round ${this.currentRound + 1}...`;
      }
      
      if (this.turnTimer) clearInterval(this.turnTimer);
      if (data.scores) this.scores = data.scores;
      if (data.currentRound) this.currentRound = data.currentRound;
      if (data.totalRounds) this.totalRounds = data.totalRounds;
    });
    this.socket.on('joinError', (msg: string) => {
      this.joinError = msg;
    });
  }

  joinGame() {
    if (this.myName.trim()) {
      this.socket.emit('join', this.myName);
      this.joined = true;
      this.joinError = '';
    }
  }

  startRound() {
    this.isStartingRound = true;
    // this.startingRoundText = `Starting round 1...`;
    this.socket.emit('startRound', { totalRounds: this.totalRounds });
  }

  rollDice() {
    this.socket.emit('roll');
  }

  hasRolled(playerId: string): boolean {
    return this.rolls.some(r => r.id === playerId && r.roll !== undefined);
  }

  getRoll(playerId: string): number | undefined {
    return this.rolls.find(r => r.id === playerId)?.roll;
  }

  isWinner(playerId: string): boolean {
    return this.winners.some(w => w.id === playerId);
  }

  getWinnerNames(): string {
    return this.winners.map(w => w.name).join(', ');
  }

  getCurrentTurnName(): string {
    const player = this.players.find(p => p.id === this.currentTurnId);
    return player ? player.name : '';
  }

  canRoll(): boolean {
    console.log(this.currentTurnId, " rolling")
    return this.roundActive && this.currentTurnId === this.myId && !this.hasRolled(this.myId);
  }

  isFirstPlayer(): boolean {
    return this.players.length > 0 && this.players[0].id === this.myId;
  }

  getFinalWinners(): Player[] {
    if (!this.scores || Object.keys(this.scores).length === 0) return [];
    const maxScore = Math.max(...Object.values(this.scores));
    return this.players.filter(p => this.scores[p.id] === maxScore);
  }

  getFinalWinnerNames(): string {
    return this.getFinalWinners().map(w => w.name).join(', ');
  }
}
