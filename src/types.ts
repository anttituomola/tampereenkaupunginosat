export interface District {
  id: string;
  name: string;
  path: string;
}

export interface GameState {
  districts: District[];
  currentDistrict: District | null;
  options: string[];
  score: number;
  totalQuestions: number;
  recentDistricts: string[];
}

