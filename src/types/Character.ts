export interface Character {
  id: string;
  name: string;
  player: string;
  origin: string;
  class: string;
  image: string;
  attributes: {
    name: string;
    code: string;
    value: number;
  }[];
  userId?: string;
  createdAt?: string;
  lastUpdated?: string;
} 