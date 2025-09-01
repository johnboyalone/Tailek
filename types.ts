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
  guesserId: string;
  guesserName: string; 
}

export interface ChatMessage {
  text: string;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  secretNumber: string[];
  isFound: boolean;
  history: Guess[];
  isBot?: boolean;
  isReady?: boolean;
  title?: string;
  lastMessage?: ChatMessage;
}

export interface GameSettings {
  playerCount: number;
  digitCount: number;
  turnTimeLimit: number;
}

export interface GameState {
    id: string;
    phase: GamePhase;
    settings: GameSettings;
    players: { [key: string]: Player };
    hostId: string;
    turnOrder: string[];
    currentPlayerId?: string;
    targetPlayerId?: string;
    winnerId?: string | null; 
    createdAt: number;
    lastBotGuess?: { guesserId: string, guess: string[] } | null;
}
