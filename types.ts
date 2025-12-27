export interface Player {
  id: string;
  name: string;
  score: number;
  tieBreakerOrder: number; // Used to sort players with the same score
  isEditing?: boolean; // UI state to determine if we are editing the name
}

export interface ScoreHistoryPoint {
  name: string;
  score: number;
  fill: string;
}