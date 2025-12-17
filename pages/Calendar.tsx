import React, { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Eye, EyeOff, Trash2 } from 'lucide-react';

interface CalendarEvent {
    participation_id: string;
    is_public: boolean;
    joined_at: string;
    event_id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
}

interface CalendarProps {
    onNavigate: (page: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onNavigate }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalendar();
    }, []);

    const fetchCalendar = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/calendar/me', {
                credentials: 'include'
            });
            if (!res.ok) {
                if (res.status === 401) {
                    onNavigate('login');
                    return;
                }
                throw new Error('Failed to load calendar');
            }
            const data = await res.json();
            setEvents(data);
        } catch (err) {
            console.error('Calendar fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = async (eventId: string, currentPublic: boolean) => {
        try {
            await fetch(`http://localhost:3000/api/events/${eventId}/participation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isPublic: !currentPublic })
            });
            setEvents(events.map(e =>
                e.event_id === eventId ? { ...e, is_public: !currentPublic } : e
            ));
        } catch (err) {
            console.error('Toggle visibility error:', err);
        }
    };

    const removeParticipation = async (eventId: string) => {
        try {
            await fetch(`http://localhost:3000/api/events/${eventId}/participation`, {
                method: 'DELETE',
                credentials: 'include'
            });
            setEvents(events.filter(e => e.event_id !== eventId));
        } catch (err) {
            console.error('Remove participation error:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <CalendarDays className="h-7 w-7 text-red-500" />
                Mein Kalender
            </h1>

            {events.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
                    <CalendarDays className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">Du hast noch keine Teilnahmen markiert.</p>
                    <button
                        onClick={() => onNavigate('events')}
                        className="text-red-500 hover:text-red-400 font-medium"
                    >
                        Events ansehen →
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div
                            key={event.participation_id}
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <h3 className="text-white font-semibold">{event.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-4 w-4" />
                                        {formatDate(event.start_date)}
                                    </span>
                                    {event.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {event.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleVisibility(event.event_id, event.is_public)}
                                    className={`p-2 rounded-lg transition-colors ${event.is_public
                                            ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                        }`}
                                    title={event.is_public ? 'Öffentlich' : 'Privat'}
                                >
                                    {event.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={() => removeParticipation(event.event_id)}
                                    className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                                    title="Teilnahme entfernen"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-sm text-slate-500 mt-6 text-center">
                <Eye className="inline h-4 w-4 mr-1" /> = auf deinem Profil sichtbar
            </p>
        </div>
    );
};

export default Calendar;
