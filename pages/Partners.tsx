import React, { useEffect, useState } from 'react';
import { Partner } from '../types';
import { Youtube, Facebook, Instagram, Globe, ExternalLink, Video } from 'lucide-react';

export const Partners: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'MEDIA' | 'VEREIN'>('MEDIA');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch('/api/partners');
                if (res.ok) {
                    const data = await res.json();
                    setPartners(data);
                }
            } catch (error) {
                console.error("Failed to fetch partners", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'YOUTUBE': return <Youtube size={20} className="text-red-500" />;
            case 'FACEBOOK': return <Facebook size={20} className="text-blue-500" />;
            case 'INSTAGRAM': return <Instagram size={20} className="text-pink-500" />;
            case 'TIKTOK': return <Video size={20} className="text-black dark:text-white" />; // No lucide icon for tiktok yet
            case 'WEBSITE': return <Globe size={20} className="text-gray-400" />;
            default: return <ExternalLink size={20} className="text-gray-400" />;
        }
    };

    const filteredPartners = partners.filter(p => (p.type || 'MEDIA') === activeTab);

    if (loading) return <div className="text-center text-slate-400 mt-10">Lade Partner...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
                Unsere Partner
            </h1>
            <p className="text-slate-400 mb-8">
                {activeTab === 'MEDIA'
                    ? 'Hier findest du Links zu unseren Medienpartnern und Content Creators.'
                    : 'Hier findest du unsere befreundeten Vereine und Organisationen.'}
            </p>

            <div className="flex bg-slate-800/50 p-1 rounded-lg mb-8 inline-flex border border-slate-700">
                <button
                    onClick={() => setActiveTab('MEDIA')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'MEDIA'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    Media & Partner
                </button>
                <button
                    onClick={() => setActiveTab('VEREIN')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'VEREIN'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    Vereine
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPartners.map(partner => (
                    <div key={partner.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-white mb-2">{partner.name}</h2>
                            {partner.type === 'VEREIN' && (
                                <span className="text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded border border-blue-800">Verein</span>
                            )}
                        </div>

                        {partner.description && (
                            <p className="text-slate-400 text-sm mb-4">{partner.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {partner.links.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm text-slate-200"
                                >
                                    {getIcon(link.type)}
                                    <span>{link.type === 'OTHER' ? 'Link' : link.type}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredPartners.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-500 bg-slate-800/50 rounded-lg border border-slate-800">
                        {activeTab === 'MEDIA' ? 'Noch keine Medienpartner eingetragen.' : 'Noch keine Vereine eingetragen.'}
                    </div>
                )}
            </div>
        </div>
    );
};
