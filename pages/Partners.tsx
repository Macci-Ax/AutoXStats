import React, { useEffect, useState } from 'react';
import { Partner } from '../types';
import { Youtube, Facebook, Instagram, Globe, ExternalLink, Video } from 'lucide-react';

export const Partners: React.FC = () => {
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

    if (loading) return <div className="text-center text-slate-400 mt-10">Lade Partner...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
                Partner Media
            </h1>
            <p className="text-slate-400 mb-8">
                Hier findest du Links zu unseren Medienpartnern und Content Creators.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {partners.map(partner => (
                    <div key={partner.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
                        <h2 className="text-xl font-bold text-white mb-2">{partner.name}</h2>
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

                {partners.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-500 bg-slate-800/50 rounded-lg border border-slate-800">
                        Noch keine Partner eingetragen.
                    </div>
                )}
            </div>
        </div>
    );
};
