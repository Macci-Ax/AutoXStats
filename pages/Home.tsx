import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Flag, ChevronRight, Youtube, ExternalLink, Play, Car, Medal } from 'lucide-react';

interface ChampionshipInfo {
  championshipEventId: string;
  championship: string;
  hasResults: boolean;
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'COMPLETED' | 'UPCOMING' | 'LIVE';
  championship?: string;
  championships?: ChampionshipInfo[];
}

interface HomeProps {
  onNavigate: (page: string) => void;
}

const LeaderboardContent: React.FC<{ data: any, onNavigate: (page: string) => void }> = ({ data, onNavigate }) => {
  if (!data) return <div className="text-slate-400 text-center py-8 animate-pulse">Lade Meisterschaftsdaten...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-red-500 font-bold uppercase tracking-wider text-sm">Klasse:</span>
        <span className="text-white font-bold text-lg">
          {data.championship ? `${data.championship} - ` : ''}{data.className}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {data.drivers.map((entry: any, index: number) => (
          <div key={entry.id || index} className={`bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border ${index === 0 ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-slate-700/50'} hover:border-red-500/50 transition cursor-pointer group`} onClick={() => onNavigate('drivers')}>
            {/* Rank */}
            <div className="text-2xl font-black w-8 text-center shrink-0" style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#b45309' }}>
              {index + 1}
            </div>

            {/* Avatar */}
            <div className="bg-slate-800 h-12 w-12 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-600 overflow-hidden shrink-0">
              <img src={`https://picsum.photos/100/100?random=${entry.id || index}`} alt={entry.name} className="w-full h-full object-cover" />
            </div>

            {/* Info: Name & Team */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate text-lg">{entry.name}</h3>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                {entry.team || 'Privatfahrer'}
              </p>
            </div>

            {/* Car (Hidden on mobile) */}
            <div className="hidden sm:flex flex-col items-end gap-1 text-right min-w-[100px]">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                <Car size={12} className="text-slate-500" />
                {entry.car || 'N/A'}
              </div>
            </div>

            {/* Points */}
            <div className="text-right pl-2 border-l border-slate-700/50 sm:border-none min-w-[60px]">
              <span className="block text-xl font-black text-white leading-none">{entry.points}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Punkte</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [randomClassData, setRandomClassData] = useState<{ className: string, championship?: string, drivers: any[] } | null>(null);
  const [drcvClassData, setDrcvClassData] = useState<{ className: string, championship?: string, drivers: any[] } | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Fetch random leaderboard (Any)
    fetch('/api/leaderboard/random-class')
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.drivers ? setRandomClassData(data) : setRandomClassData(null))
      .catch(err => console.error("Failed to fetch random leaderboard", err));

    // Fetch random DRCV leaderboard
    fetch('/api/leaderboard/random-class?championship=DRCV')
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.drivers ? setDrcvClassData(data) : setDrcvClassData(null))
      .catch(err => console.error("Failed to fetch DRCV leaderboard", err));

    // Fetch YouTube Videos
    fetch('/api/youtube-feed')
      .then(res => res.json())
      .then(data => setVideos(data))
      .catch(err => console.error("Failed to fetch YouTube feed:", err));

    // Fetch upcoming events (current year + next years)
    const fetchUpcomingEvents = async () => {
      const currentYear = new Date().getFullYear();
      const yearsToFetch = [currentYear, currentYear + 1];
      const allEvents: Event[] = [];

      for (const year of yearsToFetch) {
        try {
          const res = await fetch(`/api/events?year=${year}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            allEvents.push(...data);
          }
        } catch (err) {
          console.error(`Failed to fetch events for ${year}:`, err);
        }
      }

      const upcoming = allEvents
        .filter(e => e.status === 'UPCOMING' || e.status === 'LIVE')
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
      setUpcomingEvents(upcoming);
    };
    fetchUpcomingEvents();

    // Fetch recent completed events
    fetch(`/api/events?year=${new Date().getFullYear()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const recent = data
            .filter((e: Event) => e.status === 'COMPLETED')
            .sort((a: Event, b: Event) => b.date.localeCompare(a.date))
            .slice(0, 5);
          setRecentEvents(recent);
        }
      })
      .catch(err => console.error("Failed to fetch recent events:", err));
  }, []);

  // Helper to get championship display
  const getChampionshipDisplay = (event: Event) => {
    if (event.championships && event.championships.length > 0) {
      return event.championships.map(c => c.championship).join(' / ');
    }
    return event.championship || '';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
        <img
          src="https://picsum.photos/1200/600?grayscale"
          alt="Autocross Start"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
          <h1 className="text-3xl md:text-5xl font-black italic text-white mb-2 uppercase tracking-wide">
            Full Throttle. <span className="text-red-600">Pure Dirt.</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mb-6">
            Die ultimative Datenbank für Autocross im deutschsprachigen Raum. Statistiken, Analysen und die besten Bilder.
          </p>
          <div className="flex gap-4">
            <button onClick={() => onNavigate('events')} className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition">
              Zum Rennkalender
            </button>
            <button onClick={() => onNavigate('drivers')} className="bg-slate-800/80 backdrop-blur text-white px-6 py-3 rounded font-bold hover:bg-slate-700 transition border border-slate-600">
              Fahrer suchen
            </button>
          </div>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Standings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Leaderboard Section (General) */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Meisterschaftsführende
              </h2>
            </div>
            <LeaderboardContent data={randomClassData} onNavigate={onNavigate} />
          </div>

          {/* Leaderboard Section (DRCV) */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Meisterschaftsführende (DRCV)
              </h2>
            </div>
            <LeaderboardContent data={drcvClassData} onNavigate={onNavigate} />
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Flag className="text-red-500" /> Letzte Ergebnisse
              </h2>
              <button onClick={() => onNavigate('events')} className="text-sm text-slate-400 hover:text-white flex items-center">Alle <ChevronRight size={14} /></button>
            </div>
            <div className="space-y-3">
              {recentEvents.length > 0 ? recentEvents.map(event => (
                <div
                  key={event.id}
                  className="group relative flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition hover:border-slate-600 cursor-pointer"
                  onClick={() => onNavigate('events')}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l group-hover:from-red-600 group-hover:to-red-800 transition-all"></div>

                  {/* Left: Event Info */}
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider group-hover:bg-red-900/30 group-hover:text-red-400 transition">
                        {getChampionshipDisplay(event)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{new Date(event.date).toLocaleDateString('de-DE')}</span>
                    </div>
                    <div className="font-bold text-slate-200 group-hover:text-white transition">{event.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Flag size={10} /> {event.location}
                    </div>
                  </div>

                  {/* Right: View Results Badge */}
                  <div className="flex items-center">
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                      Ergebnisse →
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500 text-center py-4">Keine aktuellen Ergebnisse.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming & Quick Actions */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-red-900/20 to-slate-800 rounded-xl p-6 border border-red-900/30 shadow-lg">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
              <Calendar className="text-red-500" /> Nächste Events
            </h2>
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                    <Flag size={48} />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-bold rounded mb-2">
                      {getChampionshipDisplay(event)}
                    </span>
                    <h3 className="font-bold text-lg text-white mb-1">{event.name}</h3>
                    <p className="text-sm text-slate-400 mb-3">{event.location}</p>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-800 p-2 rounded">
                      <span>{new Date(event.date).toLocaleDateString('de-DE')}</span>
                      <span className="text-green-400 animate-pulse">In Kürze</span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && <p className="text-slate-500">Keine anstehenden Events.</p>}
            </div>
          </div>

          {/* YouTube Feed */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
              <Youtube className="text-red-600" /> Neues auf YouTube
            </h2>
            <div className="space-y-4 mb-4">
              {videos.length > 0 ? videos.map((video) => (
                <a
                  key={video.id}
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 items-start group hover:bg-slate-700/50 p-2 rounded transition"
                >
                  <div className="relative w-24 h-16 shrink-0 rounded overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                      <div className="w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/20 group-hover:bg-red-600 group-hover:border-red-500 transition-all duration-300">
                        <Play size={14} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-200 leading-tight group-hover:text-red-500 transition line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>{new Date(video.date).toLocaleDateString()}</span>
                      <ExternalLink size={10} />
                    </div>
                  </div>
                </a>
              )) : (
                <div className="text-slate-500 text-sm text-center py-4">Lade Videos...</div>
              )}
            </div>
            <a
              href="https://www.youtube.com/@marc.ristau"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2"
            >
              Zum Kanal <ExternalLink size={14} />
            </a>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-2">Du fährst selbst?</h3>
            <p className="text-sm text-slate-400 mb-4">Registriere dich jetzt, um dein Fahrerprofil zu bearbeiten und deine eigenen Sponsoren zu präsentieren.</p>
            <button onClick={() => onNavigate('profile')} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium transition">
              Zum Fahrer-Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};