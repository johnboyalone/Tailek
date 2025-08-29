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
  guesserId: string; // Changed from number
  guesserName: string; 
}

export interface ChatMessage {
  text: string;
  timestamp: number;
}

export interface Player {
  id: string; // Changed from number
  name: string;
  secretNumber: string[];
  isFound: boolean;
  history: Guess[];
  isBot?: boolean;
  isReady?: boolean; // For setup phase
  title?: string;
  lastMessage?: ChatMessage;
}

export interface GameSettings {
  playerCount: number;
  digitCount: number;
  turnTimeLimit: number; // in seconds. 0 means no limit.
}

// Represents the entire game state document in Firestore
export interface GameState {
    id: string; // Room Code
    phase: GamePhase;
    settings: GameSettings;
    players: { [key: string]: Player }; // Use a map for easier updates
    hostId: string;
    turnOrder: string[]; // Array of player IDs
    currentPlayerId?: string;
    targetPlayerId?: string;
    winnerId?: string;
    createdAt: number;
    lastBotGuess?: { guesserId: string, guess: string[] } | null;
}