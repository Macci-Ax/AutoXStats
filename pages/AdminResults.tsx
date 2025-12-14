import React, { useState, useEffect } from 'react';

const AdminResults: React.FC = () => {
    // Mode: 'event' or 'driver'
    const [viewMode, setViewMode] = useState<'event' | 'driver'>('event');

    // Stats for selectors
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    // For Driver Mode
    const [allDrivers, setAllDrivers] = useState<any[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [driverSearch, setDriverSearch] = useState('');

    // Filters for Driver Mode
    const [driverFilterYear, setDriverFilterYear] = useState<string>('');
    const [driverFilterClass, setDriverFilterClass] = useState<string>('');

    // Results
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    const API_BASE = 'http://localhost:3000/api';

    // 1. Fetch Initial Data (Years, Classes, All Drivers)
    useEffect(() => {
        fetch(`${API_BASE}/years`).then(res => res.json()).then(data => {
            setYears(data);
            if (data.length > 0) setSelectedYear(String(data[0]));
        });
        fetch(`${API_BASE}/classes`).then(res => res.json()).then(data => setClasses(data));

        // Fetch all drivers
        fetch(`${API_BASE}/admin/all-drivers`)
            .then(res => res.json())
            .then(data => {
                setAllDrivers(data);
            });
    }, []);

    // 2. Fetch Events when Year changes (Event Mode)
    useEffect(() => {
        if (!selectedYear) return;
        fetch(`${API_BASE}/events?year=${selectedYear}`)
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                if (data.length > 0) setSelectedEventId(data[0].id);
                else setSelectedEventId('');
            });
    }, [selectedYear]);

    // 3. Fetch Results
    useEffect(() => {
        setResults([]);

        if (viewMode === 'event') {
            if (!selectedEventId || !selectedClassId) return;
            setLoading(true);
            fetch(`${API_BASE}/race-results?event_id=${selectedEventId}&class_id=${selectedClassId}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setLoading(false);
                });
        } else {
            // Driver Mode
            if (!selectedDriverId) return;
            setLoading(true);
            fetch(`${API_BASE}/admin/driver-results?driver_id=${selectedDriverId}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setLoading(false);
                });
        }
    }, [viewMode, selectedEventId, selectedClassId, selectedDriverId]);

    // Handlers
    const startEditing = (result: any) => {
        setEditingId(result.id);
        setEditValues({
            rank: result.rank,
            points: result.points,
            championship_points: result.championship_points,
            car: result.car || '',
            start_number: result.start_number || ''
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditValues({});
    };

    const saveEditing = (id: string) => {
        fetch(`${API_BASE}/results/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editValues)
        })
            .then(res => {
                if (res.ok) {
                    // Update local state
                    setResults(prev => prev.map(r => r.id === id ? { ...r, ...editValues } : r));
                    setEditingId(null);
                } else {
                    res.text().then(text => alert('Fehler beim Speichern: ' + text));
                }
            })
            .catch(err => alert('Netzwerkfehler: ' + err));
    };

    const handleInputChange = (field: string, value: string) => {
        // Only convert specific fields to number
        const val = (field === 'rank' || field === 'points' || field === 'championship_points')
            ? Number(value)
            : value;

        setEditValues((prev: any) => ({ ...prev, [field]: val }));
    };

    // Filter drivers for dropdown
    const filteredDrivers = allDrivers.filter(d =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase())
    );

    // Derive available options from results (for Driver Mode)
    const driverYears = Array.from(new Set(results.map(r => new Date(r.event_date).getFullYear()))).sort((a, b) => b - a);

    const driverClassesMap = new Map();
    results.forEach(r => {
        if (r.class_id && r.class_name) {
            driverClassesMap.set(r.class_id, r.class_name);
        }
    });
    const driverClasses = Array.from(driverClassesMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));

    // Filter results in Driver Mode
    const displayedResults = results.filter(r => {
        if (viewMode === 'event') return true;

        // Driver Mode Filters
        if (driverFilterYear) {
            const year = new Date(r.event_date).getFullYear().toString();
            if (year !== driverFilterYear) return false;
        }
        if (driverFilterClass && r.class_id !== driverFilterClass) {
            return false;
        }
        return true;
    });

    return (
        <div className="container mx-auto p-4 text-white">
            <h1 className="text-3xl font-bold mb-6 text-neon-blue">Ergebnis Editor</h1>

            {/* View Mode Toggle */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setViewMode('event')}
                    className={`px-4 py-2 rounded ${viewMode === 'event' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Nach Event
                </button>
                <button
                    onClick={() => setViewMode('driver')}
                    className={`px-4 py-2 rounded ${viewMode === 'driver' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Nach Fahrer
                </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-900 p-4 rounded-lg">
                {viewMode === 'event' ? (
                    <>
                        <div>
                            <label className="block text-gray-400 mb-1">Saison</label>
                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Event</label>
                            <select
                                value={selectedEventId}
                                onChange={e => setSelectedEventId(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                                disabled={!events.length}
                            >
                                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Klasse</label>
                            <select
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                            >
                                <option value="">-- Klasse wählen --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </>
                ) : (
                    <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-gray-400 mb-1">Fahrer suchen</label>
                            <input
                                type="text"
                                placeholder="Name eingeben..."
                                value={driverSearch}
                                onChange={e => setDriverSearch(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white mb-2"
                            />
                            <select
                                value={selectedDriverId}
                                onChange={e => setSelectedDriverId(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                            >
                                <option value="">-- Fahrer wählen --</option>
                                {filteredDrivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Driver Filters */}
                        <div>
                            <label className="block text-gray-400 mb-1">Filter: Saison</label>
                            <select
                                value={driverFilterYear}
                                onChange={e => setDriverFilterYear(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                                disabled={!selectedDriverId}
                            >
                                <option value="">Alle Jahre</option>
                                {driverYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Filter: Klasse</label>
                            <select
                                value={driverFilterClass}
                                onChange={e => setDriverFilterClass(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                                disabled={!selectedDriverId}
                            >
                                <option value="">Alle Klassen</option>
                                {driverClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            {loading ? <p>Laden...</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3 text-left">Rank</th>
                                {viewMode === 'event' ? (
                                    <th className="p-3 text-left">Fahrer</th>
                                ) : (
                                    <>
                                        <th className="p-3 text-left">Event</th>
                                        <th className="p-3 text-left">Klasse</th>
                                    </>
                                )}
                                <th className="p-3 text-left">StartNr</th>
                                <th className="p-3 text-left">Fahrzeug</th>
                                <th className="p-3 text-left">Pkt (Event)</th>
                                <th className="p-3 text-left">Pkt (Champ)</th>
                                <th className="p-3 text-left">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedResults.map(r => (
                                <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-750">
                                    {/* Ranking */}
                                    <td className="p-3">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                value={editValues.rank}
                                                onChange={e => handleInputChange('rank', e.target.value)}
                                                className="w-12 bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                            />
                                        ) : r.rank}
                                    </td>

                                    {/* Driver OR Event/Class */}
                                    {viewMode === 'event' ? (
                                        <td className="p-3 font-semibold">{r.driver_name}</td>
                                    ) : (
                                        <>
                                            <td className="p-3 text-sm">
                                                <div className='font-bold'>{r.event_name}</div>
                                                <div className='text-xs text-gray-400'>{new Date(r.event_date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-3 text-sm text-gray-300">{r.class_name}</td>
                                        </>
                                    )}

                                    {/* Start Nr */}
                                    <td className="p-3 text-gray-400">
                                        {editingId === r.id ? (
                                            <input
                                                type="text"
                                                value={editValues.start_number}
                                                onChange={e => handleInputChange('start_number', e.target.value)}
                                                className="w-16 bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                            />
                                        ) : r.start_number}
                                    </td>

                                    {/* Car */}
                                    <td className="p-3 text-gray-400 text-sm">
                                        {editingId === r.id ? (
                                            <input
                                                type="text"
                                                value={editValues.car || ''}
                                                onChange={e => handleInputChange('car', e.target.value)}
                                                className="w-32 bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                                placeholder="Fahrzeug..."
                                            />
                                        ) : r.car}
                                    </td>

                                    {/* Points */}
                                    <td className="p-3">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                value={editValues.points}
                                                onChange={e => handleInputChange('points', e.target.value)}
                                                className="w-12 bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                            />
                                        ) : r.points}
                                    </td>

                                    {/* Champ Points */}
                                    <td className="p-3 font-mono text-neon-green">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                value={editValues.championship_points}
                                                onChange={e => handleInputChange('championship_points', e.target.value)}
                                                className="w-12 bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                            />
                                        ) : r.championship_points}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-3">
                                        {editingId === r.id ? (
                                            <div className="flex space-x-2">
                                                <button onClick={() => saveEditing(r.id)} className="text-green-400 hover:text-green-300">Save</button>
                                                <button onClick={cancelEditing} className="text-red-400 hover:text-red-300">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEditing(r)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {displayedResults.length === 0 && (
                                <tr>
                                    <td colSpan={viewMode === 'event' ? 7 : 8} className="p-8 text-center text-gray-500">
                                        {viewMode === 'event' && !selectedClassId ? "Bitte Klasse wählen." :
                                            viewMode === 'driver' && !selectedDriverId ? "Bitte Fahrer wählen." :
                                                "Keine Ergebnisse gefunden."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminResults;
