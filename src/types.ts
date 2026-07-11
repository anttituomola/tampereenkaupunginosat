export interface District {
  id: string;
  name: string;
  path: string;
}

export interface DistrictInfo {
  id: string;
  name: string;
  suuralue: string;
  suuralueDisplay: string;
  suunnittelualue: string;
  areaHa: number;
  population2020: number | null;
  description: string;
}

export interface GameState {
  districts: District[];
  currentDistrict: District | null;
  options: string[];
  score: number;
  totalQuestions: number;
  recentDistricts: string[];
}

export type GameMode = 'quiz' | 'view' | 'locate';

