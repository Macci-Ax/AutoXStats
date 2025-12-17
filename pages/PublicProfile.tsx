import React, { useState, useEffect } from 'react';
import { User, Instagram, Facebook, Youtube, ArrowLeft, CalendarDays, MapPin } from 'lucide-react';

interface PublicProfileData {
    userId: string;
    displayName?: string;
    bio?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialYoutube?: string;
}

interface PublicEvent {
    event_id: string;
    title: string;
    start_date: string;
    location: string;
}

interface PublicProfileProps {
    userId: string;
    onBack: () => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ userId, onBack }) => {
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [events, setEvents] = useState<PublicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPublicProfile();
        fetchPublicParticipations();
    }, [userId]);

    const fetchPublicProfile = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/profile/${userId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Benutzer nicht gefunden');
                    return;
                }
                throw new Error('Failed to load profile');
            }
            const data = await res.json();
            setProfile(data);
        } catch (err) {
            setError('Profil konnte nicht geladen werden');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicParticipations = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}/participations`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (err) {
            // Silently fail - participations are optional
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">{error || 'Profil nicht verfügbar'}</p>
                <button onClick={onBack} className="mt-4 text-red-500 hover:underline">
                    ← Zurück
                </button>
            </div>
        );
    }

    const hasPublicInfo = profile.displayName || profile.bio || profile.socialInstagram || profile.socialFacebook || profile.socialYoutube;

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Zurück
            </button>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="h-10 w-10 text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {profile.displayName || 'Benutzer'}
                        </h1>
                    </div>
                </div>

                {!hasPublicInfo && events.length === 0 ? (
                    <p className="text-slate-500 italic">
                        Dieser Benutzer hat keine öffentlichen Informationen freigegeben.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {profile.bio && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 mb-2">Über</h3>
                                <p className="text-white">{profile.bio}</p>
                            </div>
                        )}

                        {(profile.socialInstagram || profile.socialFacebook || profile.socialYoutube) && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 mb-3">Social Media</h3>
                                <div className="flex gap-4">
                                    {profile.socialInstagram && (
                                        <a
                                            href={`https://instagram.com/${profile.socialInstagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
                                        >
                                            <Instagram className="h-5 w-5" />
                                            @{profile.socialInstagram}
                                        </a>
                                    )}
                                    {profile.socialFacebook && (
                                        <a
                                            href={profile.socialFacebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <Facebook className="h-5 w-5" />
                                            Facebook
                                        </a>
                                    )}
                                    {profile.socialYoutube && (
                                        <a
                                            href={profile.socialYoutube}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Youtube className="h-5 w-5" />
                                            YouTube
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {events.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Geplante Events
                                </h3>
                                <div className="space-y-2">
                                    {events.map(event => (
                                        <div key={event.event_id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{event.title}</p>
                                                <p className="text-sm text-slate-400 flex items-center gap-2">
                                                    <MapPin className="h-3 w-3" /> {event.location}
                                                </p>
                                            </div>
                                            <span className="text-sm text-slate-400">{formatDate(event.start_date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;

