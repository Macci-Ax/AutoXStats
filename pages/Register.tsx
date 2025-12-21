import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, UserPlus, CheckCircle } from 'lucide-react';

interface RegisterProps {
    onNavigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== passwordConfirm) {
            setError('Passwörter stimmen nicht überein');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, passwordConfirm }),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                // Show verification required message
                setRegistrationSuccess(true);
            } else {
                setError(data.error || 'Registrierung fehlgeschlagen');
            }
        } catch (err) {
            setError('Netzwerkfehler');
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                setError('');
                alert('Verifizierungs-E-Mail wurde erneut gesendet!');
            } else {
                setError(data.error || 'Fehler beim Senden');
            }
        } catch (err) {
            setError('Netzwerkfehler');
        } finally {
            setLoading(false);
        }
    };

    // Show success screen after registration
    if (registrationSuccess) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md text-center">
                    <CheckCircle size={60} className="mx-auto text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2 text-green-400">Registrierung erfolgreich!</h1>
                    <p className="text-slate-300 mb-6">
                        Wir haben dir eine E-Mail an <span className="font-semibold text-white">{email}</span> gesendet.
                        <br /><br />
                        Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
                    </p>

                    <div className="bg-slate-900/50 p-4 rounded-lg mb-6 text-sm text-slate-400">
                        <p>Die E-Mail kann einige Minuten dauern. Prüfe auch deinen Spam-Ordner.</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleResendEmail}
                            disabled={loading}
                            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white py-3 rounded-lg font-medium transition"
                        >
                            {loading ? 'Wird gesendet...' : 'E-Mail erneut senden'}
                        </button>
                        <button
                            onClick={() => onNavigate('login')}
                            className="w-full text-slate-400 hover:text-white py-2 transition"
                        >
                            Zurück zum Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md">
                <div className="flex items-center justify-center mb-6">
                    <UserPlus size={40} className="text-red-600" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-center">Konto erstellen</h1>
                <p className="text-slate-400 text-center mb-6 text-sm">Erstelle dein AutoXStats Konto</p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">E-Mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                                placeholder="deine@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">Passwort (mindestens 8 Zeichen)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                                minLength={8}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">Passwort bestätigen</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={e => setPasswordConfirm(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                                minLength={8}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Wird registriert...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Konto erstellen
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-700 pt-6">
                    Bereits ein Konto?{' '}
                    <button onClick={() => onNavigate('login')} className="text-red-500 hover:text-red-400 font-medium transition">
                        Zum Login
                    </button>
                </div>
            </div>
        </div>
    );
};
