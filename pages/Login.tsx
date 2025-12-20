import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Removed unused import
import { useAuth } from '../context/AuthContext';

// Adding prop interface
interface LoginProps {
    onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    // navigate handling depends on routing setup
    // Checking App.tsx will reveal if routing is used. 
    // Usually Vite+React uses generic 'App' state or React Router.
    // I'll assume React Router for now but if simple state switching is used I'll adapt.

    // Placeholder for navigation - will update after seeing App.tsx
    // const navigate = useNavigate(); 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await res.json();

            if (res.ok) {
                login(data.user);
                onNavigate('home');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-red-500">Admin Login</h2>
                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:border-red-500 focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:border-red-500 focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                    >
                        Login
                    </button>
                    <div className='text-center mt-4'>
                        <a href="/" className="text-gray-400 hover:text-white text-sm">Back to Home</a>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-700 pt-6">
                    Noch kein Konto?{' '}
                    <button onClick={() => onNavigate('register')} className="text-red-500 hover:text-red-400 font-medium transition">
                        Jetzt registrieren
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
