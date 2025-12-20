import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';

export const DriverLinkRequest: React.FC = () => {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch simple driver list
    useEffect(() => {
        fetch('/api/admin/all-drivers')
            .then(res => res.json())
            .then(data => setDrivers(data))
            .catch(err => console.error("Failed to load drivers", err));
    }, []);

    const filteredDrivers = drivers.filter(d =>
        d.name && d.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleRequest = async () => {
        if (!selectedDriverId) return;
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/requests/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ driverId: selectedDriverId })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                setSelectedDriverId('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Request failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mt-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <LinkIcon className="text-blue-500" />
                Fahrerprofil verknüpfen
            </h2>

            <p className="text-slate-400 text-sm mb-4">
                Bist du ein Fahrer? Verknüpfe dein Benutzerkonto mit deinem Fahrerprofil, um Statistiken zu bearbeiten und Medien hochzuladen.
                Diese Anfrage muss von einem Administrator bestätigt werden.
            </p>

            {message && (
                <div className={`p-3 rounded mb-4 flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Fahrer suchen</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Name eingeben..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Profil auswählen</label>
                    <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        size={5} // Show as a list box if wanted, or just standard select
                    >
                        <option value="">-- Bitte wählen --</option>
                        {filteredDrivers.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name} {d.start_number ? `(#${d.start_number})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleRequest}
                    disabled={!selectedDriverId || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    {loading ? 'Sende Anfrage...' : 'Verknüpfung beantragen'}
                </button>
            </div>
        </div>
    );
};
