import React, { useState, useEffect } from 'react';
import { User, Save, Instagram, Facebook, Youtube, Eye, EyeOff } from 'lucide-react';
import { DriverLinkRequest } from '../components/DriverLinkRequest';

interface ProfileData {
    userId: string;
    email: string;
    displayName: string;
    bio: string;
    driverId?: string; // Add this to check if already linked
    avatarImageId: string | null;
    socialInstagram: string;
    socialFacebook: string;
    socialYoutube: string;
    isDisplayNamePublic: boolean;
    isBioPublic: boolean;
    isSocialPublic: boolean;
}

interface ProfileEditProps {
    onNavigate: (page: string) => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ onNavigate }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile/me', {
                credentials: 'include'
            });
            if (!res.ok) {
                if (res.status === 401) {
                    onNavigate('login');
                    return;
                }
                throw new Error('Failed to load profile');
            }
            const data = await res.json();
            setProfile(data);
        } catch (err) {
            setMessage({ type: 'error', text: 'Profil konnte nicht geladen werden' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(profile)
            });

            if (!res.ok) throw new Error('Save failed');
            setMessage({ type: 'success', text: 'Profil gespeichert!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Speichern fehlgeschlagen' });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof ProfileData, value: string | boolean) => {
        if (!profile) return;
        setProfile({ ...profile, [field]: value });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">Profil nicht verfügbar</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <User className="h-7 w-7 text-red-500" />
                Profil bearbeiten
            </h1>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-6">
                {/* Display Name */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300">Anzeigename</label>
                        <VisibilityToggle
                            isPublic={profile.isDisplayNamePublic}
                            onChange={(v) => updateField('isDisplayNamePublic', v)}
                        />
                    </div>
                    <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => updateField('displayName', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Dein Anzeigename"
                    />
                </div>

                {/* Bio */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300">Über mich</label>
                        <VisibilityToggle
                            isPublic={profile.isBioPublic}
                            onChange={(v) => updateField('isBioPublic', v)}
                        />
                    </div>
                    <textarea
                        value={profile.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        rows={4}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        placeholder="Erzähl etwas über dich..."
                    />
                </div>

                {/* Social Links */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-slate-300">Social Media</label>
                        <VisibilityToggle
                            isPublic={profile.isSocialPublic}
                            onChange={(v) => updateField('isSocialPublic', v)}
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Instagram className="h-5 w-5 text-pink-500" />
                            <input
                                type="text"
                                value={profile.socialInstagram}
                                onChange={(e) => updateField('socialInstagram', e.target.value)}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Instagram Username"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Facebook className="h-5 w-5 text-blue-500" />
                            <input
                                type="text"
                                value={profile.socialFacebook}
                                onChange={(e) => updateField('socialFacebook', e.target.value)}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Facebook URL"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Youtube className="h-5 w-5 text-red-500" />
                            <input
                                type="text"
                                value={profile.socialYoutube}
                                onChange={(e) => updateField('socialYoutube', e.target.value)}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="YouTube Kanal URL"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-700">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="h-5 w-5" />
                        {saving ? 'Speichern...' : 'Profil speichern'}
                    </button>
                </div>
            </div>

            {/* Driver Link Request Section */}
            {!profile.driverId && <DriverLinkRequest />}

            {/* Info Note */}
            <p className="text-sm text-slate-500 mt-4 text-center">
                <Eye className="inline h-4 w-4 mr-1" /> = öffentlich sichtbar |
                <EyeOff className="inline h-4 w-4 mx-1" /> = nur für dich sichtbar
            </p>
        </div>
    );
};

// Visibility Toggle Component
const VisibilityToggle: React.FC<{ isPublic: boolean; onChange: (v: boolean) => void }> = ({ isPublic, onChange }) => (
    <button
        onClick={() => onChange(!isPublic)}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${isPublic
            ? 'bg-green-900/50 text-green-400 border border-green-700'
            : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
    >
        {isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {isPublic ? 'Öffentlich' : 'Privat'}
    </button>
);

export default ProfileEdit;
