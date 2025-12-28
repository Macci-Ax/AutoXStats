import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Drivers } from './pages/Drivers';
import { Events } from './pages/Events';
import { Gallery } from './pages/Gallery';
import { Profile } from './pages/Profile';
import { ProfileEdit } from './pages/ProfileEdit';
import { PublicProfile } from './pages/PublicProfile';
import Admin from './pages/Admin';
import DriverProfileEditor from './pages/DriverProfileEditor';

import Login from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { User } from './types';
import { useAuth } from './context/AuthContext';

// Context is now dynamic
import { Driver, Event } from './types';
import { Button } from './components/Button';
import { MOCK_DRIVERS } from './constants';

import { EventResults } from './pages/EventResults';
import { Calendar } from './pages/Calendar';

const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  // Real Auth Context
  const { user, loading } = useAuth();
  const [contextString, setContextString] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/drivers').then(r => r.json())
    ]).then(([events, drivers]) => {
      const eStr = Array.isArray(events) ? (events as Event[]).map(e => `${e.name} am ${e.date} (${e.status})`).join(', ') : '';
      const dStr = Array.isArray(drivers) ? (drivers as Driver[]).map(d => `${d.name} (${d.points} Punkte)`).join(', ') : '';
      setContextString(`Events: ${eStr}.\nFahrer (Auszug): ${dStr}.`);
    }).catch(err => console.error("Failed to load context:", err));
  }, []);

  // Handle URL-based routing for email verification
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/verify-email') {
      setPage('verify-email');
    }
  }, []);

  // Create simple onNavigate wrapper to handle routing
  const navigate = (newPage: string) => setPage(newPage);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setPage('event-results');
  };

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home onNavigate={navigate} />;
      case 'drivers': return <Drivers />;
      case 'events': return <Events onSelectEvent={handleSelectEvent} />;
      case 'event-results': return selectedEventId ? <EventResults eventId={selectedEventId} onBack={() => setPage('events')} /> : <Events onSelectEvent={handleSelectEvent} />;
      case 'gallery': return <Gallery user={user} />;
      case 'admin':
        // Auth Protection for Admin
        if (!user || user.role !== 'ADMIN') return <Login onNavigate={navigate} />;
        return <Admin />;
      case 'login': return <Login onNavigate={navigate} />;
      case 'register': return <Register onNavigate={navigate} />;
      case 'verify-email': return <VerifyEmail onNavigate={navigate} />;
      case 'profile': return user ? <Profile user={user} driverData={MOCK_DRIVERS.find(d => d.id === user.driverId)} onLogout={() => { /* Logout handled by context usually or component */ setPage('home'); }} onUpdate={() => { }} /> : <Home onNavigate={navigate} />;
      case 'profile-edit': return user ? <ProfileEdit onNavigate={navigate} /> : <Login onNavigate={navigate} />;
      case 'my-driver-profile': return user && user.driverId ? <DriverProfileEditor user={user} /> : <Home onNavigate={navigate} />;
      case 'calendar': return user ? <Calendar onNavigate={navigate} /> : <Login onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
      <Navbar currentPage={page} onNavigate={setPage} user={user} onLoginClick={() => setPage('login')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} AutoX-Stats DACH. Alle Rechte vorbehalten.</p>
          <p className="mt-2">Made for Racer.</p>
        </div>
      </footer>



      {/* Modal Removed - uses Login page now */}
    </div>
  );
};

export default App;