export enum Championship {
  DRCV = 'DRCV',
  WACV = 'WACV',
  NWDAV = 'NWDAV',
  SWASV = 'SWASV',
  DACM = 'DACM'
}

export interface Driver {
  id: string;
  originalId?: string; // Real DB ID if 'id' is composite
  name: string;
  verified?: boolean;
  avatarUrl?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  bio?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface DriverStats {
  points: number;
  seasonRank?: number; // Current rank in championship
  wins: number; // Final race wins
  secondPlaces: number; // Final race 2nd places
  thirdPlaces: number; // Final race 3rd places
  fourthPlaces: number; // Final race 4th places
  fifthPlaces: number; // Final race 5th places
  heatWins: number; // Qualifying/Heat wins (from 1/2/3/4 columns)
  podiums: number; // Top 3
}

export interface LeaderboardEntry {
  driver: Driver;
  team?: Team;
  stats: DriverStats;
  car?: string; // Car is often event/season specific but good to have in leaderboard
  number?: number;
  driverClass?: string;
  championships?: Championship[];
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