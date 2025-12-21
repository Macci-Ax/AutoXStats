import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

interface VerifyEmailProps {
    onNavigate: (page: string) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ onNavigate }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Kein Verifizierungstoken gefunden.');
                return;
            }

            try {
                const res = await fetch(`/api/auth/verify-email?token=${token}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    setStatus('success');
                    setMessage(data.message || 'E-Mail erfolgreich verifiziert!');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verifizierung fehlgeschlagen.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Netzwerkfehler. Bitte versuche es später erneut.');
            }
        };

        verifyEmail();
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 size={60} className="mx-auto text-red-500 animate-spin mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Verifiziere E-Mail...</h1>
                        <p className="text-slate-400">Bitte warte einen Moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={60} className="mx-auto text-green-500 mb-4" />
                        <h1 className="text-2xl font-bold mb-2 text-green-400">Erfolgreich!</h1>
                        <p className="text-slate-300 mb-6">{message}</p>
                        <button
                            onClick={() => onNavigate('login')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                        >
                            <Mail size={18} />
                            Zum Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={60} className="mx-auto text-red-500 mb-4" />
                        <h1 className="text-2xl font-bold mb-2 text-red-400">Fehler</h1>
                        <p className="text-slate-300 mb-6">{message}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => onNavigate('register')}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
                            >
                                Erneut registrieren
                            </button>
                            <button
                                onClick={() => onNavigate('home')}
                                className="w-full text-slate-400 hover:text-white py-2 transition"
                            >
                                Zurück zur Startseite
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
