export interface Player {
  id: string;
  name: string;
  score: number;
  bid?: number; // Optional bid for standard mode
  tieBreakerOrder: number; // Used to sort players with the same score
  isEditing?: boolean; // UI state to determine if we are editing the name
}

export interface ScoreHistoryPoint {
  name: string;
  score: number;
  fill: string;
}

// Spades Types
export interface SpadesPlayer {
  id: string;
  name: string;
}

export interface SpadesTeam {
  id: number;
  players: [SpadesPlayer, SpadesPlayer];
  score: number;
  bags: number;
}

export interface SpadesRound {
  id: string;
  roundNumber: number;
  team1: {
    bids: [number, number]; // 0 denotes Nil
    tricks: number;
    scoreDelta: number;
    nilFailed: [boolean, boolean];
    bagsDelta: number;
  };
  team2: {
    bids: [number, number]; // 0 denotes Nil
    tricks: number;
    scoreDelta: number;
    nilFailed: [boolean, boolean];
    bagsDelta: number;
  };
}