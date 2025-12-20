import React, { useState, useEffect } from 'react';
import { MapPin, Calendar as CalIcon, CheckCircle, Clock, UserPlus, UserMinus, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChampionshipInfo {
  championshipEventId: string;
  championship: string;
  hasResults: boolean;
}

interface Event {
  id: string;
  championship: string;
  championships: ChampionshipInfo[];
  name: string;
  date: string;
  location: string;
  status: 'COMPLETED' | 'UPCOMING' | 'LIVE';
}

interface EventsProps {
  onNavigate?: (page: string) => void;
  onSelectEvent?: (eventId: string, championship?: string) => void;
}

export const Events: React.FC<EventsProps> = ({ onNavigate, onSelectEvent }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [participations, setParticipations] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch available years
  useEffect(() => {
    fetch('/api/years')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableYears(data);
          // Set to current year if available, otherwise latest
          const currentYear = String(new Date().getFullYear());
          if (data.includes(currentYear)) {
            setSelectedYear(currentYear);
          } else {
            setSelectedYear(data[0]);
          }
        }
      })
      .catch(err => console.error("Failed to fetch years:", err));
  }, []);

  // Fetch events - for upcoming, fetch all years; for past, fetch selected year
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // For upcoming tab, we want current and future years
        // For past tab, we want only the selected year
        const yearsToFetch = activeTab === 'upcoming'
          ? [String(new Date().getFullYear()), String(new Date().getFullYear() + 1), String(new Date().getFullYear() + 2)]
          : [selectedYear];

        const allEvents: Event[] = [];
        for (const year of yearsToFetch) {
          const res = await fetch(`/api/events?year=${year}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            allEvents.push(...data);
          }
        }
        // Remove duplicates by id
        const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());
        setEvents(uniqueEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };
    fetchEvents();
  }, [selectedYear, activeTab]);

  // Fetch participation status for upcoming events if logged in
  useEffect(() => {
    if (!user) return;
    events.forEach(event => {
      if (event.status !== 'COMPLETED') {
        fetch(`/api/events/${event.id}/participation/status`, {
          credentials: 'include'
        })
          .then(res => res.json())
          .then(data => {
            setParticipations(prev => ({ ...prev, [event.id]: data.participating }));
          })
          .catch(() => { });
      }
    });
  }, [user, events]);

  const toggleParticipation = async (eventId: string) => {
    const isParticipating = participations[eventId];
    const method = isParticipating ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/events/${eventId}/participation`, {
        method,
        credentials: 'include'
      });
      if (res.ok) {
        setParticipations(prev => ({ ...prev, [eventId]: !isParticipating }));
      }
    } catch (err) {
      console.error('Failed to toggle participation:', err);
    }
  };

  const safeEvents = Array.isArray(events) ? events : [];

  // Filter and sort events based on active tab
  const upcomingEvents = safeEvents
    .filter(e => e.status === 'UPCOMING' || e.status === 'LIVE')
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastEvents = safeEvents
    .filter(e => e.status === 'COMPLETED')
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const renderEventCard = (event: Event) => {
    const isCompleted = event.status === 'COMPLETED';
    const isJointEvent = event.championships && event.championships.length > 1;
    const isParticipating = participations[event.id];

    return (
      <div key={event.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-lg hover:shadow-xl transition">
        {/* Date Box */}
        <div className={`md:w-32 p-4 flex flex-col items-center justify-center text-center ${isCompleted ? 'bg-slate-700' : 'bg-red-700'}`}>
          <span className="text-3xl font-black text-white">{new Date(event.date).getDate()}</span>
          <span className="text-sm font-bold uppercase tracking-wider text-white/80">{new Date(event.date).toLocaleDateString('de-DE', { month: 'short' })}</span>
          <span className="text-xs text-white/60 mt-1">{new Date(event.date).getFullYear()}</span>
        </div>

        {/* Info */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {event.championships && event.championships.length > 0 ? (
              event.championships.map(c => (
                <span key={c.championshipEventId} className="bg-slate-900 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700">
                  {c.championship}
                </span>
              ))
            ) : (
              <span className="bg-slate-900 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700">
                {event.championship}
              </span>
            )}

            {isJointEvent && (
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                Joint Event
              </span>
            )}

            {isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                <CheckCircle size={12} /> Beendet
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                <Clock size={12} /> Geplant
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin size={14} /> {event.location}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 md:p-6 bg-slate-900/50 flex flex-col justify-center gap-2 md:w-48 border-t md:border-t-0 md:border-l border-slate-700">
          {isCompleted ? (
            <button
              onClick={() => onSelectEvent && onSelectEvent(event.id)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded transition"
            >
              Ergebnisse
            </button>
          ) : (
            <>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded transition shadow-lg shadow-red-900/20">
                Infos & Nennung
              </button>
              {user && (
                <button
                  onClick={() => toggleParticipation(event.id)}
                  className={`w-full text-sm font-medium py-2 rounded transition flex items-center justify-center gap-2 ${isParticipating
                    ? 'bg-green-700 hover:bg-green-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                >
                  {isParticipating ? (
                    <><UserMinus size={14} /> Teilnahme ✓</>
                  ) : (
                    <><UserPlus size={14} /> Teilnehmen</>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Rennkalender</h1>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition ${activeTab === 'upcoming'
              ? 'bg-red-600 text-white'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <Clock size={14} className="inline mr-2" />
            Geplant ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition ${activeTab === 'past'
              ? 'bg-red-600 text-white'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <CheckCircle size={14} className="inline mr-2" />
            Vergangen ({pastEvents.length})
          </button>
        </div>

        {/* Year Filter - only show for past events */}
        {activeTab === 'past' && availableYears.length > 0 && (
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 pr-10 font-medium text-sm cursor-pointer hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="grid gap-6">
        {displayedEvents.length > 0 ? (
          displayedEvents.map(event => renderEventCard(event))
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center text-slate-400">
            {activeTab === 'upcoming'
              ? 'Keine geplanten Events gefunden.'
              : `Keine vergangenen Events für ${selectedYear} gefunden.`}
          </div>
        )}
      </div>
    </div>
  );
};