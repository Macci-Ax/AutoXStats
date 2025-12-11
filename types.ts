export enum Championship {
  DRCV = 'DRCV',
  WACV = 'WACV',
  NWDAV = 'NWDAV',
  SWASV = 'SWASV',
  DACM = 'DACM'
}

export interface Driver {
  id: string;
  name: string;
  team: string;
  car: string;
  number: number;
  driverClass: string; // New field for categorization (e.g., "Klasse 01", "Langstrecke")
  championships: Championship[];
  points: number;
  seasonRank?: number; // Current rank in championship
  wins: number; // Final race wins
  secondPlaces: number; // Final race 2nd places
  thirdPlaces: number; // Final race 3rd places
  heatWins: number; // Qualifying/Heat wins (from 1/2/3/4 columns)
  podiums: number; // Top 3
  avatarUrl?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  bio?: string;
}

export interface Event {
  id: string;
  name: string;
  championship: Championship;
  date: string;
  location: string;
  status: 'UPCOMING' | 'COMPLETED' | 'LIVE';
  resultsAvailable: boolean;
  winnerId?: string;
}

export interface Photo {
  id: string;
  url: string;
  photographer: string;
  eventId: string;
  driverId?: string; // Optional linking to driver
  tags: string[];
  uploadDate: string;
  highResAvailable: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'DRIVER' | 'ADMIN';
  driverId?: string; // If the user is a driver
  isPremium: boolean; // Access to high quality downloads
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}