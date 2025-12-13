import { Championship, Driver, Event, Photo, LeaderboardEntry } from './types';

// Real Drivers from 2025 Data (Merged DRCV and Mock WACV for demo)
export const MOCK_ENTRIES: LeaderboardEntry[] = [
  // --- DRCV Langstrecke ---
  {
    driver: {
      id: 'd_210',
      name: 'René Bouma',
      avatarUrl: 'https://picsum.photos/200/200?random=210',
      bio: 'Meisterschaftsführender Langstrecke 2025.'
    },
    team: { id: 't_digga', name: 'Digga Racing Team' },
    car: 'Spezialtourenwagen',
    number: 210,
    driverClass: 'Langstrecke',
    championships: [Championship.DRCV],
    stats: {
      points: 218,
      seasonRank: 1,
      wins: 3,
      heatWins: 0,
      podiums: 5,
      secondPlaces: 0,
      thirdPlaces: 2,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  },
  {
    driver: {
      id: 'd_1',
      name: 'Tobias Hönicke',
      avatarUrl: 'https://picsum.photos/200/200?random=1'
    },
    team: { id: 't_hoenicke', name: 'Team Hönicke' },
    car: 'Spezialtourenwagen',
    number: 1,
    driverClass: 'Langstrecke',
    championships: [Championship.DRCV],
    stats: {
      points: 200,
      seasonRank: 2,
      wins: 2,
      heatWins: 0,
      podiums: 4,
      secondPlaces: 1,
      thirdPlaces: 1,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  },

  // --- DRCV Klasse 01 ---
  {
    driver: {
      id: 'd_163',
      name: 'Mike Hellweg',
      avatarUrl: 'https://picsum.photos/200/200?random=163'
    },
    team: { id: 't_hellweg', name: 'Team Hellweg' },
    car: 'Serientourenwagen bis 1400 ccm',
    number: 163,
    driverClass: 'Klasse 01',
    championships: [Championship.DRCV],
    stats: {
      points: 69,
      seasonRank: 1,
      wins: 4,
      heatWins: 18,
      podiums: 5,
      secondPlaces: 1,
      thirdPlaces: 0,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  },

  // --- DRCV Klasse 05 ---
  {
    driver: {
      id: 'd_504',
      name: 'Marc Schauseil',
      avatarUrl: 'https://picsum.photos/200/200?random=504'
    },
    team: { id: 't_velbert', name: 'Racing Team Velbert' },
    car: 'Supertourenwagen bis 1600 ccm (4WD)',
    number: 504,
    driverClass: 'Klasse 05',
    championships: [Championship.DRCV],
    stats: {
      points: 86,
      seasonRank: 1,
      wins: 4,
      heatWins: 21,
      podiums: 5,
      secondPlaces: 1,
      thirdPlaces: 0,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  },

  // --- WACV Sample Data (Since PDF data was mainly DRCV) ---
  {
    driver: {
      id: 'w_101',
      name: 'Jürgen Meyer',
      avatarUrl: 'https://picsum.photos/200/200?random=901'
    },
    team: { id: 't_jm', name: 'JM Motorsport' },
    car: 'Golf 2 GTI',
    number: 101,
    driverClass: 'Klasse 1',
    championships: [Championship.WACV],
    stats: {
      points: 145,
      seasonRank: 1,
      wins: 3,
      heatWins: 12,
      podiums: 6,
      secondPlaces: 2,
      thirdPlaces: 1,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  },
  {
    driver: {
      id: 'w_205',
      name: 'Sarah Klein',
      avatarUrl: 'https://picsum.photos/200/200?random=902'
    },
    team: { id: 't_klein', name: 'Klein Cross' },
    car: 'Polo G40',
    number: 205,
    driverClass: 'Klasse 2',
    championships: [Championship.WACV],
    stats: {
      points: 132,
      seasonRank: 2,
      wins: 1,
      heatWins: 8,
      podiums: 4,
      secondPlaces: 2,
      thirdPlaces: 1,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  },
  {
    driver: {
      id: 'w_800',
      name: 'Peter Peters',
      avatarUrl: 'https://picsum.photos/200/200?random=903'
    },
    team: { id: 't_peters', name: 'Peters Racing' },
    car: 'Spezialkreuzer',
    number: 800,
    driverClass: 'Spezialtourenwagen',
    championships: [Championship.WACV],
    stats: {
      points: 180,
      seasonRank: 1,
      wins: 5,
      heatWins: 15,
      podiums: 7,
      secondPlaces: 2,
      thirdPlaces: 0,
      fourthPlaces: 0,
      fifthPlaces: 0
    }
  }
];

export const MOCK_DRIVERS = MOCK_ENTRIES.map(e => e.driver); // Backward compatibility helper if needed, but we should use MOCK_ENTRIES

// Real Events 2025
export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    name: 'Dauborn',
    championship: Championship.DRCV,
    date: '2025-05-18',
    location: 'Dauborn',
    status: 'COMPLETED',
    resultsAvailable: true,
    winnerId: 'd_1'
  },
  {
    id: 'e2',
    name: 'Gleidorf',
    championship: Championship.DRCV,
    date: '2025-06-22',
    location: 'Gleidorf',
    status: 'COMPLETED',
    resultsAvailable: true,
    winnerId: 'd_210'
  },
  {
    id: 'e3',
    name: 'WACV Lauf 1',
    championship: Championship.WACV,
    date: '2025-05-25',
    location: 'Sachsenberg',
    status: 'COMPLETED',
    resultsAvailable: true,
    winnerId: 'w_101'
  },
  {
    id: 'e4',
    name: 'Herbern',
    championship: Championship.DRCV,
    date: '2025-08-17',
    location: 'Herbern',
    status: 'COMPLETED',
    resultsAvailable: true,
    winnerId: 'd_210'
  },
  {
    id: 'e5',
    name: 'Osnabrück',
    championship: Championship.DRCV,
    date: '2025-09-07',
    location: 'Osnabrück',
    status: 'COMPLETED',
    resultsAvailable: true,
    winnerId: 'd_163'
  },
  {
    id: 'e6',
    name: 'Saisonfinale Itterbeck',
    championship: Championship.DRCV,
    date: '2025-09-28',
    location: 'Itterbeck',
    status: 'UPCOMING',
    resultsAvailable: false
  }
];

// Mock Photos
export const MOCK_PHOTOS: Photo[] = [
  {
    id: 'p1',
    url: 'https://picsum.photos/800/600?random=10',
    photographer: 'AutoX Lens',
    eventId: 'e1',
    driverId: 'd_1',
    tags: ['Jump', 'Dust', 'Buggy'],
    uploadDate: '2025-05-19',
    highResAvailable: true
  },
  {
    id: 'p2',
    url: 'https://picsum.photos/800/600?random=11',
    photographer: 'AutoX Lens',
    eventId: 'e2',
    tags: ['Start', 'Crash'],
    uploadDate: '2025-06-23',
    highResAvailable: true
  },
  {
    id: 'p3',
    url: 'https://picsum.photos/800/600?random=12',
    photographer: 'SpeedShots',
    eventId: 'e3',
    driverId: 'd_210',
    tags: ['Mud', 'Corner'],
    uploadDate: '2025-08-18',
    highResAvailable: true
  }
];