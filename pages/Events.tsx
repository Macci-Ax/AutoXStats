import React, { useState, useEffect } from 'react';
import { MapPin, Calendar as CalIcon, CheckCircle, Clock } from 'lucide-react';

interface Event {
  id: string;
  championship: string;
  name: string;
  date: string;
  location: string;
  status: 'COMPLETED' | 'UPCOMING';
}

interface EventsProps {
  onNavigate?: (page: string) => void;
  onSelectEvent?: (eventId: string) => void;
}

export const Events: React.FC<EventsProps> = ({ onNavigate, onSelectEvent }) => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Failed to fetch events:", err));
  }, []);

  const safeEvents = Array.isArray(events) ? events : [];
  const sortedEvents = [...safeEvents].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Rennkalender 2024</h1>
      <div className="grid gap-6">
        {sortedEvents.map(event => {
          const isCompleted = event.status === 'COMPLETED';
          return (
            <div key={event.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-lg hover:shadow-xl transition">
              {/* Date Box */}
              <div className={`md:w-32 p-4 flex flex-col items-center justify-center text-center ${isCompleted ? 'bg-slate-700' : 'bg-red-700'}`}>
                <span className="text-3xl font-black text-white">{new Date(event.date).getDate()}</span>
                <span className="text-sm font-bold uppercase tracking-wider text-white/80">{new Date(event.date).toLocaleDateString('de-DE', { month: 'short' })}</span>
              </div>

              {/* Info */}
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-slate-900 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700">{event.championship}</span>
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
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded transition shadow-lg shadow-red-900/20">
                    Infos & Nennung
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};