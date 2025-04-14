export interface Character {
  id: string;
  name: string;
  player: string;
  origin: string;
  class: string;
  attributes: {
    name: string;
    code: string;
    value: number;
  }[];
} 