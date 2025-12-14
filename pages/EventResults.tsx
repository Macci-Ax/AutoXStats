
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Car } from 'lucide-react';

interface Result {
    id: string;
    class_id: string;
    class_name: string;
    start_number: string;
    car: string;
    rank: number;
    points: number;
    championship_points: number;
    driver_name: string;
    driver_team?: string; // New field
}

interface EventResultsProps {
    eventId: string;
    onBack: () => void;
}

export const EventResults: React.FC<EventResultsProps> = ({ eventId, onBack }) => {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        fetch('http://localhost:3000/api/events')
            .then(res => res.json())
            .then(events => {
                const evt = events.find((e: any) => e.id === eventId);
                if (evt) setEventName(evt.name);
            });

        fetch(`http://localhost:3000/api/events/${eventId}/results`)
            .then(res => res.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load results:", err);
                setLoading(false);
            });
    }, [eventId]);

    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.class_name]) {
            acc[result.class_name] = [];
        }
        acc[result.class_name].push(result);
        return acc;
    }, {} as Record<string, Result[]>);

    const sortedClassNames = Object.keys(groupedResults).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="text-yellow-400" size={20} />;
        if (rank === 2) return <Medal className="text-gray-300" size={20} />;
        if (rank === 3) return <Medal className="text-amber-600" size={20} />;
        return <span className="font-bold text-slate-500 w-5 text-center">{rank}.</span>;
    };

    // Helper for consistency: mock avatar
    // Ideally the API should return this, but for now we generate it deterministically
    const getAvatar = (name: string) => {
        const id = name.length; // simple hash
        return `https://picsum.photos/200/200?random=${id}`;
    };

    if (loading) return <div className="text-center text-white py-12">Lade Ergebnisse...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Zurück zum Kalender
            </button>

            <h1 className="text-3xl font-bold text-white">Ergebnisse: {eventName}</h1>

            {results.length === 0 ? (
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                    Noch keine Ergebnisse verfügbar.
                </div>
            ) : (
                <div className="grid gap-8">
                    {sortedClassNames.map(className => (
                        <div key={className} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                            <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-700">
                                <h2 className="text-xl font-bold text-white">{className}</h2>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {groupedResults[className].map((result, index) => (
                                    <div key={result.id} className={`p-4 flex items-center gap-4 hover:bg-slate-700/30 transition ${index < 3 ? 'bg-slate-900/20' : ''}`}>

                                        {/* Rank */}
                                        <div className="w-8 flex justify-center shrink-0">
                                            {getRankIcon(result.rank)}
                                        </div>

                                        {/* Avatar */}
                                        <div className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center border border-slate-600 overflow-hidden shrink-0 hidden sm:flex">
                                            <img src={getAvatar(result.driver_name)} alt={result.driver_name} className="w-full h-full object-cover" />
                                        </div>

                                        {/* Name & Team */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between mb-0.5">
                                                <span className="font-bold text-white text-lg truncate pr-2">{result.driver_name}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 truncate">
                                                {result.driver_team || 'Privatfahrer'}
                                            </div>
                                        </div>

                                        {/* Car & Number (Desktop) */}
                                        <div className="hidden md:flex flex-col items-end gap-1 text-right min-w-[120px]">
                                            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600/50">
                                                <Car size={12} className="text-slate-500" />
                                                {result.car || 'Fahrzeug N/A'}
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-mono">#{result.start_number}</span>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right min-w-[60px] pl-2 border-l border-slate-700/50">
                                            <div className="text-xl font-black text-red-500 leading-none">{result.championship_points}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Punkte</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
