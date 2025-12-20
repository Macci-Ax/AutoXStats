import React, { useState } from 'react';
import AdminResults from './AdminResults';
import AdminEvents from './AdminEvents';
import AdminRequests from './AdminRequests';
import { Settings, Calendar, Users } from 'lucide-react';

export const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'editor' | 'events' | 'users'>('users');

    return (
        <div>
            <div className="flex space-x-4 mb-6 border-b border-gray-700 pb-2">
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'editor'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Settings size={18} />
                    Editor
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'events'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Calendar size={18} />
                    Event-Verwaltung
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'users'
                        ? 'bg-slate-800 text-white border-b-2 border-red-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Users size={18} />
                    Benutzer-Verwaltung
                </button>
            </div>

            <div className="bg-slate-900 rounded-lg min-h-[500px]">
                {activeTab === 'editor' && <AdminResults />}
                {activeTab === 'events' && <AdminEvents />}
                {activeTab === 'users' && <AdminRequests />}
            </div>
        </div>
    );
};

export default Admin;
