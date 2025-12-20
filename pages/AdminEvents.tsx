import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Calendar, MapPin, AlertCircle } from 'lucide-react';

interface ChampionshipEventInfo {
    id: string;
    championshipId: string;
    hasResults: boolean;
}

interface PhysicalEvent {
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    location: string;
    description?: string;
    status: 'upcoming' | 'running' | 'finished';
    championships: ChampionshipEventInfo[];
}

interface Championship {
    id: string;
    name: string;
    year: number;
}

const AdminEvents: React.FC = () => {
    const [events, setEvents] = useState<PhysicalEvent[]>([]);
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        status: 'upcoming' as 'upcoming' | 'running' | 'finished',
        selectedChampionships: [] as string[]
    });

    const API_BASE = '/api';

    // Load events and championships
    useEffect(() => {
        loadEvents();
        loadChampionships();
    }, []);

    const loadEvents = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/physical-events`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            } else {
                setError('Fehler beim Laden der Events');
            }
        } catch (err) {
            setError('Netzwerkfehler');
        } finally {
            setLoading(false);
        }
    };

    const loadChampionships = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/championships`);
            if (res.ok) {
                setChampionships(await res.json());
            }
        } catch (err) {
            console.error('Failed to load championships');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            startDate: '',
            endDate: '',
            location: '',
            description: '',
            status: 'upcoming',
            selectedChampionships: []
        });
        setEditingId(null);
        setShowForm(false);
    };

    const startEditing = (event: PhysicalEvent) => {
        setFormData({
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate || '',
            location: event.location,
            description: event.description || '',
            status: event.status,
            selectedChampionships: event.championships.map(c => c.championshipId)
        });
        setEditingId(event.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const payload = {
            title: formData.title,
            startDate: formData.startDate,
            endDate: formData.endDate || formData.startDate,
            location: formData.location,
            description: formData.description,
            status: formData.status,
            championships: formData.selectedChampionships.map(id => ({ championshipId: id, hasResults: false }))
        };

        try {
            const url = editingId
                ? `${API_BASE}/admin/physical-events/${editingId}`
                : `${API_BASE}/admin/physical-events`;

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (res.ok) {
                setSuccess(editingId ? 'Event aktualisiert!' : 'Event erstellt!');
                resetForm();
                loadEvents();
            } else {
                const data = await res.json();
                setError(data.error || 'Fehler beim Speichern');
            }
        } catch (err) {
            setError('Netzwerkfehler beim Speichern');
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Event wirklich löschen?')) return;

        try {
            const res = await fetch(`${API_BASE}/admin/physical-events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setSuccess('Event gelöscht!');
                loadEvents();
            } else {
                const data = await res.json();
                setError(data.error || 'Fehler beim Löschen');
            }
        } catch (err) {
            setError('Netzwerkfehler beim Löschen');
        }
    };

    const addChampionshipToEvent = async (eventId: string, championshipId: string) => {
        try {
            const res = await fetch(`${API_BASE}/admin/championship-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ physicalEventId: eventId, championshipId, hasResults: false }),
                credentials: 'include'
            });

            if (res.ok) {
                setSuccess('Meisterschaft hinzugefügt!');
                loadEvents();
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch (err) {
            setError('Netzwerkfehler');
        }
    };

    const removeChampionshipFromEvent = async (championshipEventId: string) => {
        if (!confirm('Meisterschaft entfernen?')) return;

        try {
            const res = await fetch(`${API_BASE}/admin/championship-events/${championshipEventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setSuccess('Meisterschaft entfernt!');
                loadEvents();
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch (err) {
            setError('Netzwerkfehler');
        }
    };

    const toggleChampionship = (champId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedChampionships: prev.selectedChampionships.includes(champId)
                ? prev.selectedChampionships.filter(id => id !== champId)
                : [...prev.selectedChampionships, champId]
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'finished': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'running': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'finished': return 'Beendet';
            case 'running': return 'Laufend';
            default: return 'Geplant';
        }
    };

    if (loading) return <div className="text-white text-center py-12">Laden...</div>;

    return (
        <div className="container mx-auto p-4 text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Event Verwaltung</h1>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <Plus size={20} /> Neues Event
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={20} /> {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200"><X size={18} /></button>
                </div>
            )}
            {success && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-300 p-4 rounded-lg mb-4 flex items-center gap-2">
                    ✓ {success}
                    <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-200"><X size={18} /></button>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
                    <div className="bg-slate-800 rounded-xl w-full max-w-lg p-6 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Event bearbeiten' : 'Neues Event erstellen'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Titel *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-1">Startdatum *</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Enddatum</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Ort</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 outline-none"
                                    placeholder="z.B. Eppe, Dauborn..."
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 outline-none"
                                >
                                    <option value="upcoming">Geplant</option>
                                    <option value="running">Laufend</option>
                                    <option value="finished">Beendet</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Beschreibung</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 outline-none"
                                    rows={2}
                                />
                            </div>

                            {/* Championship Selection (only for new events) */}
                            {!editingId && (
                                <div>
                                    <label className="block text-gray-400 mb-2">Meisterschaften</label>
                                    <div className="flex flex-wrap gap-2">
                                        {championships.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => toggleChampionship(c.id)}
                                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${formData.selectedChampionships.includes(c.id)
                                                    ? 'bg-red-600 border-red-500 text-white'
                                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {c.id}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Joint Event: Mehrere Meisterschaften auswählen</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> {editingId ? 'Speichern' : 'Erstellen'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="space-y-4">
                {events.length === 0 ? (
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                        Keine Events vorhanden. Erstelle dein erstes Event!
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                {/* Date */}
                                <div className="bg-slate-900 rounded-lg p-3 text-center min-w-[70px]">
                                    <div className="text-2xl font-bold text-white">{new Date(event.startDate).getDate()}</div>
                                    <div className="text-xs text-slate-400 uppercase">
                                        {new Date(event.startDate).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(event.status)}`}>
                                            {getStatusLabel(event.status)}
                                        </span>
                                        {event.championships.length > 1 && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                Joint Event
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.location || 'Kein Ort'}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {event.startDate}</span>
                                    </div>
                                </div>

                                {/* Championships */}
                                <div className="flex flex-wrap gap-1">
                                    {event.championships.map(c => (
                                        <div key={c.id} className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded text-xs">
                                            <span className="font-medium">{c.championshipId}</span>
                                            {c.hasResults && <span className="text-green-400">✓</span>}
                                            <button
                                                onClick={() => removeChampionshipFromEvent(c.id)}
                                                className="text-red-400 hover:text-red-300 ml-1"
                                                title="Entfernen"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Add Championship */}
                                    <select
                                        onChange={e => { if (e.target.value) addChampionshipToEvent(event.id, e.target.value); e.target.value = ''; }}
                                        className="bg-slate-700 border-none text-xs rounded px-2 py-1 text-slate-400"
                                    >
                                        <option value="">+</option>
                                        {championships
                                            .filter(c => !event.championships.some(ec => ec.championshipId === c.id))
                                            .map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                    </select>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditing(event)}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                                        title="Bearbeiten"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition"
                                        title="Löschen"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminEvents;
