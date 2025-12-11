import React from 'react';
import { Menu, X, Trophy, Calendar, Users, Image, User, LogIn } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, user, onLoginClick }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Start', icon: Trophy },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'drivers', label: 'Fahrer', icon: Users },
    { id: 'gallery', label: 'Galerie', icon: Image },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => handleNav('home')}>
            <span className="text-2xl font-bold italic text-red-600 tracking-tighter">AutoX</span>
            <span className="text-2xl font-bold text-white tracking-tighter ml-1">Stats</span>
            <span className="text-xs font-mono text-slate-400 ml-2 border border-slate-700 px-1 rounded">DACH</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                    currentPage === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
             {user ? (
               <button onClick={() => handleNav('profile')} className="flex items-center gap-2 text-slate-300 hover:text-white">
                 <img src={user.avatarUrl || 'https://picsum.photos/40/40'} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600"/>
                 <span className="text-sm font-medium">{user.name}</span>
               </button>
             ) : (
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-400 px-3 py-2 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-all"
                >
                  <LogIn size={16} /> Login
                </button>
             )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 ${
                  currentPage === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            <div className="border-t border-slate-800 mt-4 pt-4">
               {user ? (
                  <button onClick={() => handleNav('profile')} className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md flex items-center gap-3">
                    <User size={18} /> Profil: {user.name}
                  </button>
               ) : (
                 <button onClick={() => {onLoginClick(); setIsOpen(false);}} className="w-full text-left px-3 py-2 text-red-500 hover:bg-slate-800 rounded-md flex items-center gap-3">
                   <LogIn size={18} /> Anmelden / Registrieren
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};