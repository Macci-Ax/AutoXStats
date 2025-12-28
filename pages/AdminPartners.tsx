import React, { useEffect, useState } from 'react';
import { Partner, PartnerLink } from '../types';
import { Plus, Trash2, Edit2, Save, X, Link as LinkIcon } from 'lucide-react';

const AdminPartners: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Partner>>({ name: '', description: '', links: [], type: 'MEDIA' });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        const res = await fetch('/api/partners');
        if (res.ok) {
            const data = await res.json();
            setPartners(data);
        }
    };

    const handleCreate = () => {
        setEditingId('new');
        setEditForm({ name: '', description: '', links: [], type: 'MEDIA' });
    };

    const handleEdit = (partner: Partner) => {
        setEditingId(partner.id);
        setEditForm({ ...partner });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Wirklich löschen?')) return;
        await fetch(`/api/partners/${id}`, { method: 'DELETE' });
        fetchPartners();
    };

    const handleSave = async () => {
        if (!editForm.name) return alert('Name ist erforderlich');

        const method = editingId === 'new' ? 'POST' : 'PUT';
        const url = editingId === 'new' ? '/api/partners' : `/api/partners/${editingId}`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
        });

        if (res.ok) {
            setEditingId(null);
            fetchPartners();
        } else {
            alert('Fehler beim Speichern');
        }
    };

    const addLink = () => {
        const newLinks = [...(editForm.links || [])];
        newLinks.push({ url: '', type: 'WEBSITE' });
        setEditForm({ ...editForm, links: newLinks });
    };

    const removeLink = (index: number) => {
        const newLinks = [...(editForm.links || [])];
        newLinks.splice(index, 1);
        setEditForm({ ...editForm, links: newLinks });
    };

    const updateLink = (index: number, field: keyof PartnerLink, value: string) => {
        const newLinks = [...(editForm.links || [])];
        // @ts-ignore
        newLinks[index][field] = value;
        setEditForm({ ...editForm, links: newLinks });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Partner & Media Verwaltung</h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                    <Plus size={18} /> Neuer Partner
                </button>
            </div>

            {editingId && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                        {editingId === 'new' ? 'Neuer Partner' : 'Partner bearbeiten'}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Name</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Typ</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                value={editForm.type || 'MEDIA'}
                                onChange={e => setEditForm({ ...editForm, type: e.target.value as any })}
                            >
                                <option value="MEDIA">Media & Partner</option>
                                <option value="VEREIN">Verein</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Beschreibung</label>
                            <textarea
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Links</label>
                            {editForm.links?.map((link, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <select
                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white text-sm"
                                        value={link.type}
                                        onChange={e => updateLink(idx, 'type', e.target.value)}
                                    >
                                        <option value="WEBSITE">Webseite</option>
                                        <option value="YOUTUBE">YouTube</option>
                                        <option value="FACEBOOK">Facebook</option>
                                        <option value="INSTAGRAM">Instagram</option>
                                        <option value="TIKTOK">TikTok</option>
                                        <option value="OTHER">Andere</option>
                                    </select>
                                    <input
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                                        placeholder="URL (https://...)"
                                        value={link.url}
                                        onChange={e => updateLink(idx, 'url', e.target.value)}
                                    />
                                    <button
                                        onClick={() => removeLink(idx)}
                                        className="p-2 text-red-500 hover:bg-slate-700 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addLink}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                            >
                                <Plus size={14} /> Link hinzufügen
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-slate-400 hover:text-white"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
                        >
                            <Save size={18} /> Speichern
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {partners.map(partner => (
                    <div key={partner.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-lg">{partner.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${partner.type === 'VEREIN' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                                    {partner.type || 'MEDIA'}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">{partner.description}</p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {partner.links.map((link, idx) => (
                                    <span key={idx} className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700 flex items-center gap-1">
                                        <LinkIcon size={10} /> {link.type}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(partner)}
                                className="p-2 text-blue-400 hover:bg-slate-700 rounded transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(partner.id)}
                                className="p-2 text-red-500 hover:bg-slate-700 rounded transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPartners;
