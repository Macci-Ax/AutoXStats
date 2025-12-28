import React, { useState } from 'react';
import AdminResults from './AdminResults';
import AdminEvents from './AdminEvents';
import AdminRequests from './AdminRequests';
import AdminPartners from './AdminPartners';
import { Settings, Calendar, Users, Share2 } from 'lucide-react';

export const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'editor' | 'events' | 'users' | 'partners'>('users');

    return (
        <div>
            <div className="flex space-x-4 mb-6 border-b border-gray-700 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'users'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Users size={18} />
                    Benutzer-Verwaltung
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'events'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Calendar size={18} />
                    Event-Verwaltung
                </button>
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'editor'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Settings size={18} />
                    Editor
                </button>
                <button
                    onClick={() => setActiveTab('partners')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'partners'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Share2 size={18} />
                    Partner Media
                </button>
            </div>

            <div className="bg-slate-900 rounded-lg min-h-[500px]">
                {activeTab === 'editor' && <AdminResults />}
                {activeTab === 'events' && <AdminEvents />}
                {activeTab === 'users' && <AdminRequests />}
                {activeTab === 'partners' && <AdminPartners />}
            </div>
        </div>
    );
};

export default Admin;
