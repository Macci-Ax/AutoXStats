import React, { useState, useEffect, useRef } from 'react';
import { Search, Trophy, BarChart2, ChevronLeft, Flag, Medal, ChevronDown, ChevronUp, Calendar, Image as ImageIcon } from 'lucide-react';
import { MOCK_DRIVERS } from '../constants';
import { Championship, Driver, LeaderboardEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RaceResult {
  event_name: string;
  event_date: string;
  class_name: string;
  rank: number;
  points: number;
  heat_wins: number;
}


export const Drivers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChampionship, setActiveChampionship] = useState<Championship | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [recentResults, setRecentResults] = useState<RaceResult[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Alle');
  const [showAllRaces, setShowAllRaces] = useState(false);
  const detailViewRef = useRef<HTMLDivElement>(null);

  // Year selection state
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Fetch available years on mount
  useEffect(() => {
    fetch('/api/years')
      .then(res => res.json())
      .then(years => {
        if (Array.isArray(years) && years.length > 0) {
          setAvailableYears(years);
          // Default to most recent year
          setSelectedYear(years[0]);
        }
      })
      .catch(err => console.error("Failed to fetch years:", err));
  }, []);

  // Scroll to detail view on mobile when a driver is selected
  useEffect(() => {
    if (selectedEntry && detailViewRef.current && window.innerWidth < 1024) {
      detailViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedEntry]);

  const categories = ['Alle', 'Klasse', 'Endlauf', 'Langstrecke', 'Super Cup'];

  const toggleClass = (cls: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [cls]: !prev[cls]
    }));
  };

  // Fetch drivers with selected year
  useEffect(() => {
    fetch(`/api/drivers?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(err => console.error("Failed to fetch drivers:", err));
  }, [selectedYear]);

  // State for Driver Photos
  const [driverPhotos, setDriverPhotos] = useState<{ id: string, url: string }[]>([]);

  useEffect(() => {
    if (selectedEntry) {
      const driverId = selectedEntry.driver.originalId || selectedEntry.driver.id;
      // Fetch Results
      fetch(`/api/drivers/${driverId}/results`)
        .then(res => res.json())
        .then(data => setRecentResults(data))
        .catch(err => console.error("Failed to fetch results:", err));

      // Fetch Photos
      fetch(`/api/drivers/${driverId}/photos`)
        .then(res => res.json())
        .then(data => {
          const mapped = data.map((p: any) => ({ ...p, url: p.url }));
          setDriverPhotos(mapped);
        })
        .catch(err => console.error("Failed to fetch photos:", err));

    } else {
      setRecentResults([]);
      setDriverPhotos([]);
    }
  }, [selectedEntry]);

  // Filter drivers based on selection
  const safeEntries = Array.isArray(entries) ? entries : [];
  const filteredEntries = safeEntries.filter(entry => {
    if (activeChampionship && (!entry.championships || !entry.championships.includes(activeChampionship))) {
      return false;
    }
    const searchTermLower = searchTerm.toLowerCase();
    const teamName = entry.team ? entry.team.name.toLowerCase() : '';
    const matchesSearch = entry.driver.name.toLowerCase().includes(searchTermLower) ||
      teamName.includes(searchTermLower) ||
      (entry.number && entry.number.toString().includes(searchTerm));
    return matchesSearch;
  });

  // Group drivers by class
  const entriesByClass = filteredEntries.reduce((acc, entry) => {
    const cls = entry.driverClass || 'Unbekannt';
    if (!acc[cls]) {
      acc[cls] = [];
    }
    acc[cls].push(entry);
    return acc;
  }, {} as Record<string, LeaderboardEntry[]>);

  // Sort drivers within each class by points descending
  Object.keys(entriesByClass).forEach(cls => {
    entriesByClass[cls].sort((a, b) => b.stats.points - a.stats.points);
  });

  const sortedClasses = Object.keys(entriesByClass).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Initial Auto-Expand logic for Langstrecke
  useEffect(() => {
    if (sortedClasses.length > 0) {
      setExpandedClasses(prev => {
        const next = { ...prev };
        let changed = false;
        sortedClasses.forEach(cls => {
          if (cls.toLowerCase().includes('langstrecke') && !next[cls]) {
            next[cls] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [sortedClasses.length, activeChampionship]);

  const filteredClassesByCategory = sortedClasses.filter(cls => {
    if (activeCategory === 'Alle') return true;
    return cls.toLowerCase().includes(activeCategory.toLowerCase());
  });

  const renderDetail = (entry: LeaderboardEntry) => {
    const isLangstrecke = entry.driverClass?.includes('Langstrecke');

    // Filter results for the current season only (for the graph)
    const seasonResults = recentResults.filter(r => {
      const resultYear = new Date(r.event_date).getFullYear();
      return resultYear === selectedYear;
    });

    const chartData = Array.from({ length: 10 }, (_, i) => {
      // ... (existing chart data logic)
      const rank = i + 1;
      return {
        name: `${rank}. Platz`,
        Anzahl: seasonResults.filter(r => r.rank === rank).length,
        color: rank === 1 ? '#EAB308' :
          rank === 2 ? '#94A3B8' :
            rank === 3 ? '#B45309' :
              '#334155'
      };
    });

    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 animate-fade-in sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
        <div className="h-32 bg-gradient-to-r from-red-900 to-slate-900 relative">
          <button
            onClick={() => setSelectedEntry(null)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm transition"
          >
            Schließen
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <img
              src={entry.driver.avatarUrl}
              alt={entry.driver.name}
              className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-700 object-cover"
            />
            <div className="text-right">
              <div className="text-4xl font-black text-white">#{entry.number}</div>
              <div className="text-slate-400">{entry.driverClass}</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-1">{entry.driver.name}</h2>
          <p className="text-red-500 font-medium mb-4">{entry.team ? entry.team.name : ''}</p>

          {entry.driver.bio && <p className="text-slate-300 mb-6 italic border-l-2 border-slate-600 pl-3">{entry.driver.bio}</p>}

          <div className={`grid grid-cols-2 ${isLangstrecke ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 mb-8`}>
            {/* ... (existing stats boxes) ... */}
            <div className="bg-slate-900 p-3 rounded text-center flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <Medal size={48} className="text-yellow-500" />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Medal size={14} className="text-yellow-500" /> 1. Platz
              </div>
              <div className="text-2xl font-bold text-yellow-500">
                {recentResults.filter(r => r.rank === 1).length}
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded text-center flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <Medal size={48} className="text-slate-400" />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Medal size={14} className="text-slate-400" /> 2. Platz
              </div>
              <div className="text-2xl font-bold text-slate-400">
                {recentResults.filter(r => r.rank === 2).length}
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded text-center flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <Medal size={48} className="text-amber-700" />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Medal size={14} className="text-amber-700" /> 3. Platz
              </div>
              <div className="text-2xl font-bold text-amber-700">
                {recentResults.filter(r => r.rank === 3).length}
              </div>
            </div>

            {!isLangstrecke && (
              <div className="bg-slate-900 p-3 rounded text-center flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Laufsiege</div>
                <div className="text-2xl font-bold text-orange-500">{entry.stats.heatWins}</div>
              </div>
            )}
          </div>

          {/* DRIVER PHOTOS SECTION */}
          {driverPhotos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase flex items-center gap-2">
                <ImageIcon size={16} /> Galerie ({driverPhotos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {driverPhotos.slice(0, 6).map(photo => (
                  <div key={photo.id} className="aspect-square bg-slate-900 rounded overflow-hidden hover:opacity-90 cursor-pointer">
                    <img src={photo.url} alt="Driver Action" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {driverPhotos.length > 6 && (
                <p className="text-right text-xs text-slate-500 mt-1 cursor-pointer hover:text-white">Mehr anzeigen...</p>
              )}
            </div>
          )}

          {/* ... (rest of the component: class breakdown, chart, results) ... */}

          {(() => {
            // ... Class Breakdown Logic ... 
            const allClassParticipations = entries.filter(e =>
              e.driver.id === entry.driver.id
            ).sort((a, b) => b.stats.points - a.stats.points);

            if (allClassParticipations.length > 1) {
              return (
                <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  {/* ... */}
                  <div className="space-y-2">
                    {allClassParticipations.map(p => (
                      <div key={p.driver.id + p.driverClass} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-200 font-bold">{p.driverClass}</span>
                          {p.stats.seasonRank && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${p.stats.seasonRank <= 3 ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                              #{p.stats.seasonRank}
                            </span>
                          )}
                        </div>
                        <span className="text-white font-black">{p.stats.points} Pkt</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null;
          })()}

          {/* Chart */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 h-64 mb-8">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Leistungsdaten (Aktuelle Saison)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff' }}
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                />
                <Bar dataKey="Anzahl" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Races Section */}
          {/* ... */}

          {/* Recent Races Section */}
          {recentResults.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Calendar size={16} /> Letzte Rennen
                </h3>
                <button
                  onClick={() => setShowAllRaces(!showAllRaces)}
                  className="text-xs font-bold text-slate-500 hover:text-white transition flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
                >
                  {showAllRaces ? (
                    <>
                      Weniger anzeigen <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      Alle anzeigen ({recentResults.length}) <ChevronDown size={14} />
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2">
                {(() => {
                  const allUniqueDates = Array.from(new Set(recentResults.map(r => r.event_date)));
                  const uniqueDates = showAllRaces ? allUniqueDates : allUniqueDates.slice(0, 3);

                  return uniqueDates.map(date => {
                    const eventResults = recentResults.filter(r => r.event_date === date);
                    const eventName = eventResults[0]?.event_name || date;

                    return (
                      <div key={date} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                          <span className="font-bold text-slate-200">{eventName}</span>
                          <span className="text-xs text-slate-500">{new Date(date as string).toLocaleDateString('de-DE')}</span>
                        </div>
                        <div className="space-y-2">
                          {eventResults.map((res, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs">{res.class_name}</span>
                                {res.rank === 1 && <Medal size={14} className="text-yellow-500" />}
                                {res.rank === 2 && <Medal size={14} className="text-slate-400" />}
                                {res.rank === 3 && <Medal size={14} className="text-amber-700" />}
                                <span className={`font-medium ${res.rank <= 3 ? 'text-white' : 'text-slate-300'}`}>
                                  {res.rank}. Platz
                                </span>
                              </div>
                              <div className="text-slate-500">
                                {res.points} Pkt
                                {res.heat_wins > 0 && <span className="ml-2 text-orange-500/80 text-xs">({res.heat_wins} LS)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}


        </div>
      </div>
    );
  };

  // STEP 1: CHAMPIONSHIP SELECTION VIEW
  if (!activeChampionship) {
    return (
      <div className="space-y-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white text-center">Wähle eine Meisterschaft</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">

          {/* DRCV Card */}
          <div
            onClick={() => setActiveChampionship(Championship.DRCV)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500 rounded-2xl p-10 cursor-pointer transition-all transform hover:-translate-y-1 shadow-xl flex flex-col items-center justify-center gap-6 group"
          >
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-600 group-hover:border-red-500 transition-colors">
              <Trophy size={48} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest">DRCV</h2>
            <p className="text-slate-400 text-center">Deutscher Rallye Cross Verband<br />Alle Klassen & Langstrecke</p>
          </div>

          {/* WACV Card */}
          <div
            onClick={() => setActiveChampionship(Championship.WACV)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-2xl p-10 cursor-pointer transition-all transform hover:-translate-y-1 shadow-xl flex flex-col items-center justify-center gap-6 group"
          >
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-600 group-hover:border-blue-500 transition-colors">
              <Flag size={48} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest">WACV</h2>
            <p className="text-slate-400 text-center">Westdeutscher Auto Cross Verband<br />Klassen 1-13 & Spezial</p>
          </div>

        </div>
      </div>
    );
  }

  // STEP 2: DRIVER LIST VIEW
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveChampionship(null);
              setSelectedEntry(null);
            }}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full border border-slate-600 transition"
          >
            <ChevronLeft size={20} className="text-slate-200" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{activeChampionship} Fahrerdatenbank</h1>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Saison</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Fahrer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 gap-2 mb-6 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all border
              ${activeCategory === cat
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/40' // Active state
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600'} // Inactive state
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List View */}
        <div className={`space-y-8 lg:col-span-${selectedEntry ? '1' : '3'} transition-all duration-300`}>

          {filteredClassesByCategory.length === 0 && (
            <div className="p-12 text-center text-slate-500 bg-slate-800 rounded-lg border border-slate-700 border-dashed">
              <p className="text-lg">Keine Fahrer für {activeChampionship} gefunden.</p>
            </div>
          )}

          {filteredClassesByCategory.map(cls => (
            <div key={cls} className="space-y-3">
              <div
                onClick={() => toggleClass(cls)}
                className="flex items-center gap-3 pb-2 border-b border-slate-800 pt-2 cursor-pointer hover:bg-slate-800/50 rounded px-2 -mx-2 transition group select-none"
              >
                <span className={`h-6 w-1 rounded-full ${activeChampionship === Championship.DRCV ? 'bg-red-600' : 'bg-blue-600'}`}></span>
                <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wide flex-1">
                  {cls}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded-full">
                    {entriesByClass[cls].length}
                  </span>
                  {expandedClasses[cls] ? (
                    <ChevronUp size={20} className="text-slate-500 group-hover:text-slate-300" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-500 group-hover:text-slate-300" />
                  )}
                </div>
              </div>

              {expandedClasses[cls] && (
                <div className="grid gap-3 animate-fade-in-fast">
                  {entriesByClass[cls].map((entry, index) => {
                    let itemClasses = "p-4 rounded-lg border cursor-pointer transition flex items-center gap-4 group ";
                    if (selectedEntry?.driver.id === entry.driver.id) {
                      itemClasses += "bg-slate-700 border-white";
                    } else if (index === 0) {
                      itemClasses += "bg-yellow-900/20 border-yellow-500/50 hover:bg-yellow-900/30";
                    } else if (index === 1) {
                      itemClasses += "bg-slate-400/20 border-slate-300/50 hover:bg-slate-400/30";
                    } else if (index === 2) {
                      itemClasses += "bg-orange-900/20 border-orange-500/50 hover:bg-orange-900/30";
                    } else {
                      itemClasses += "bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80";
                    }

                    return (
                      <div
                        key={entry.driver.id}
                        onClick={() => setSelectedEntry(entry)}
                        className={itemClasses}
                      >
                        <div className="relative">
                          <img src={entry.driver.avatarUrl} alt={entry.driver.name} className="w-12 h-12 rounded-full object-cover border border-slate-600" />
                          {index === 0 && <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5"><Medal size={16} className="text-yellow-500 fill-yellow-500/20" /></div>}
                          {index === 1 && <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5"><Medal size={16} className="text-slate-400 fill-slate-400/20" /></div>}
                          {index === 2 && <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5"><Medal size={16} className="text-amber-700 fill-amber-700/20" /></div>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate flex items-center gap-2">
                            {entry.driver.name}
                          </h3>
                          <p className="text-sm text-slate-400 truncate">{entry.team ? entry.team.name : ''}</p>
                          <p className="text-xs text-slate-500 truncate mt-1 pt-1 opacity-60">#{entry.number}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-lg font-bold text-slate-200">{entry.stats.points} <span className="text-xs text-slate-500 font-normal">Pkt</span></div>
                          {(entry.stats.droppedPoints && entry.stats.droppedPoints > 0) ? (
                            <div className="text-xs text-slate-500">
                              <span title="Gesamtpunkte Vor Streicher">{entry.stats.rawPoints}</span>
                              <span className="text-rose-500/70" title="Streichergebnis"> -{entry.stats.droppedPoints}</span>
                            </div>
                          ) : null}
                          {entry.stats.seasonRank && <div className={`text-xs font-bold ${entry.stats.seasonRank <= 3 ? 'text-yellow-500' : 'text-slate-500'}`}>#{entry.stats.seasonRank}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail View */}
        {selectedEntry && (
          <div className="lg:col-span-2" ref={detailViewRef}>
            {renderDetail(selectedEntry)}
          </div>
        )}
      </div>
    </div>
  );
};
