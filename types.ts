export enum GamePhase {
  Home = 'HOME',
  Join = 'JOIN',
  Lobby = 'LOBBY',
  Setup = 'SETUP',
  Playing = 'PLAYING',
  GameOver = 'GAME_OVER',
}

export interface Guess {
  value: string;
  correct: number;
  misplaced: number;
  guesserId: number;
  guesserName: string; // Added to simplify rendering
}

export interface ChatMessage {
  text: string;
  timestamp: number;
}

export interface Player {
  id: number;
  name: string;
  secretNumber: string[];
  isFound: boolean;
  history: Guess[];
  title?: string;
  lastMessage?: ChatMessage;
}

export interface GameSettings {
  playerCount: number;
  digitCount: number;
  turnTimeLimit: number; // in seconds. 0 means no limit.
}