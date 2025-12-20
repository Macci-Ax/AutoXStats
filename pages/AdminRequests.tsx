import React, { useState, useEffect } from 'react';
import { Check, X, User, Shield } from 'lucide-react';

interface Request {
    id: number;
    created_at: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    user_email: string;
    user_id: string;
    driver_name: string;
    driver_id: string;
}

export const AdminRequests: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests/admin', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            const res = await fetch(`/api/requests/${id}/${action}`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (res.ok) {
                // Refresh list
                fetchRequests();
            } else {
                alert("Action failed");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    return (
        <div className="p-4 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="text-red-500" />
                Benutzer-Verwaltung & Anfragen
            </h2>

            {loading ? (
                <div className="text-center text-slate-400">Laden...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3 text-left">Datum</th>
                                <th className="p-3 text-left">User Email</th>
                                <th className="p-3 text-left">Angefragter Fahrer</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Keine offenen Anfragen</td>
                                </tr>
                            ) : requests.map(req => (
                                <tr key={req.id} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-3 text-gray-400 text-sm">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-slate-500" />
                                            {req.user_email}
                                        </div>
                                    </td>
                                    <td className="p-3 font-semibold text-blue-300">
                                        {req.driver_name}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-900 text-green-300' :
                                            req.status === 'REJECTED' ? 'bg-red-900 text-red-300' :
                                                'bg-yellow-900 text-yellow-300'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {req.status === 'PENDING' && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    className="p-1 bg-green-600 hover:bg-green-500 rounded text-white"
                                                    title="Genehmigen"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    className="p-1 bg-red-600 hover:bg-red-500 rounded text-white"
                                                    title="Ablehnen"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminRequests;
