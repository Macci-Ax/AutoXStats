import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Drivers } from './pages/Drivers';
import { Events } from './pages/Events';
import { Gallery } from './pages/Gallery';
import { Profile } from './pages/Profile';
import { ChatAssistant } from './components/ChatAssistant';
import { User } from './types';

// Context is now dynamic
import { Driver, Event } from './types';
import { Button } from './components/Button';
import { MOCK_DRIVERS } from './constants';


const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [contextString, setContextString] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/events').then(r => r.json()),
      fetch('http://localhost:3000/api/drivers').then(r => r.json())
    ]).then(([events, drivers]) => {
      const eStr = Array.isArray(events) ? (events as Event[]).map(e => `${e.name} am ${e.date} (${e.status})`).join(', ') : '';
      const dStr = Array.isArray(drivers) ? (drivers as Driver[]).map(d => `${d.name} (${d.points} Punkte)`).join(', ') : '';
      setContextString(`Events: ${eStr}.\nFahrer (Auszug): ${dStr}.`);
    }).catch(err => console.error("Failed to load context:", err));
  }, []);


  // Mock Login Handler
  const handleLogin = (isDriver: boolean) => {
    const mockUser: User = {
      id: isDriver ? 'u1' : 'u2',
      name: isDriver ? 'Max Müller' : 'Renn Fan 88',
      email: 'test@example.com',
      role: isDriver ? 'DRIVER' : 'USER',
      driverId: isDriver ? 'd1' : undefined,
      isPremium: isDriver
    };
    setUser(mockUser);
    setShowLoginModal(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home onNavigate={setPage} />;
      case 'drivers': return <Drivers />;
      case 'events': return <Events />;
      case 'gallery': return <Gallery user={user} />;
      case 'profile': return user ? <Profile user={user} driverData={MOCK_DRIVERS.find(d => d.id === user.driverId)} onLogout={() => { setUser(null); setPage('home'); }} onUpdate={setUser} /> : <Home onNavigate={setPage} />;
      default: return <Home onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
      <Navbar currentPage={page} onNavigate={setPage} user={user} onLoginClick={() => setShowLoginModal(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} AutoX-Stats DACH. Alle Rechte vorbehalten.</p>
          <p className="mt-2">Made for Racer.</p>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <ChatAssistant contextData={contextString} />

      {/* Simple Modal for Login Mock */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-4">Anmelden</h2>
            <p className="text-slate-400 mb-6 text-sm">Simulierte Anmeldung für die Demo.</p>
            <div className="space-y-3">
              <Button fullWidth onClick={() => handleLogin(true)}>Als Fahrer (Max Müller)</Button>
              <Button fullWidth variant="secondary" onClick={() => handleLogin(false)}>Als Fan / Zuschauer</Button>
              <Button fullWidth variant="outline" onClick={() => setShowLoginModal(false)}>Abbrechen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;