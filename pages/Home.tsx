import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Flag, ChevronRight } from 'lucide-react';
import { MOCK_DRIVERS, MOCK_EVENTS } from '../constants';
import { Championship } from '../types';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const upcomingEvents = MOCK_EVENTS.filter(e => e.status === 'UPCOMING').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const recentEvents = MOCK_EVENTS.filter(e => e.status === 'COMPLETED').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const [randomClassData, setRandomClassData] = useState<{ className: string, drivers: any[] } | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/leaderboard/random-class')
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => {
        if (data && data.drivers) {
          setRandomClassData(data);
        } else {
          console.warn("Invalid leaderboard data:", data);
          setRandomClassData(null);
        }
      })
      .catch(err => console.error("Failed to fetch random leaderboard", err));
  }, []);

  // Simple logic to get top driver per championship based on mock points
  const getTopDriver = (champ: Championship) => {
    return MOCK_DRIVERS
      .filter(d => d.championships.includes(champ))
      .sort((a, b) => b.points - a.points)[0];
  };

  const prioritizedChamps = [Championship.DRCV, Championship.WACV, Championship.NWDAV, Championship.SWASV, Championship.DACM];

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
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Meisterschaftsführende
              </h2>
            </div>

            {randomClassData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-red-500 font-bold uppercase tracking-wider text-sm">Klasse:</span>
                  <span className="text-white font-bold text-lg">{randomClassData.className}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {randomClassData.drivers.map((driver, index) => (
                    <div key={driver.id} className={`bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border ${index === 0 ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-slate-700/50'} hover:border-red-500/50 transition cursor-pointer`} onClick={() => onNavigate('drivers')}>
                      <div className="text-2xl font-black w-8 text-center" style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#b45309' }}>
                        {index + 1}
                      </div>
                      <div className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-600 overflow-hidden shrink-0">
                        <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-bold text-white truncate pr-2">{driver.name}</h3>
                          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-white font-mono whitespace-nowrap">{driver.points} Pkt</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{driver.team}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8 animate-pulse">Lade Meisterschaftsdaten...</div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Flag className="text-red-500" /> Letzte Ergebnisse
              </h2>
              <button onClick={() => onNavigate('events')} className="text-sm text-slate-400 hover:text-white flex items-center">Alle <ChevronRight size={14} /></button>
            </div>
            <div className="space-y-3">
              {recentEvents.map(event => {
                const winner = MOCK_DRIVERS.find(d => d.id === event.winnerId);
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded border-l-4 border-slate-600 hover:bg-slate-900/50 transition">
                    <div>
                      <div className="text-xs text-red-400 font-bold mb-0.5">{event.championship}</div>
                      <div className="font-semibold text-white">{event.name}</div>
                      <div className="text-xs text-slate-500">{event.location} • {new Date(event.date).toLocaleDateString('de-DE')}</div>
                    </div>
                    {winner && (
                      <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase">Sieger</div>
                        <div className="font-medium text-white">{winner.name}</div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                      {event.championship}
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

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-2">Du fährst selbst?</h3>
            <p className="text-sm text-slate-400 mb-4">Registriere dich jetzt, um dein Fahrerprofil zu bearbeiten und deine eigenen Sponsoren zu präsentieren.</p>
            <button onClick={() => onNavigate('profile')} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium transition">
              Zum Fahrer-Login
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};