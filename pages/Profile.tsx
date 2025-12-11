import React, { useState } from 'react';
import { User, Driver } from '../types';
import { Save, User as UserIcon } from 'lucide-react';
import { Button } from '../components/Button';

interface ProfileProps {
  user: User;
  driverData?: Driver; // Linked driver data
  onLogout: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, driverData, onLogout, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(driverData?.bio || '');
  const [team, setTeam] = useState(driverData?.team || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Simulate save
    onUpdate({ ...user, name });
    setIsEditing(false);
    // In real app, would update driverData too
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">Mein Profil</h1>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
        <div className="flex items-center gap-6 mb-8">
           <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 border-2 border-slate-600">
              <UserIcon size={48} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-red-500 font-medium">{user.role === 'DRIVER' ? 'Fahrer' : 'Fan'}</p>
              <p className="text-slate-500 text-sm mt-1">{user.email}</p>
           </div>
        </div>

        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Anzeigename</label>
             <input 
               type="text" 
               value={name} 
               disabled={!isEditing}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
             />
           </div>

           {user.role === 'DRIVER' && (
             <>
               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1">Team</label>
                 <input 
                   type="text" 
                   value={team} 
                   disabled={!isEditing}
                   onChange={(e) => setTeam(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1">Bio / Über mich</label>
                 <textarea 
                   rows={4}
                   value={bio} 
                   disabled={!isEditing}
                   onChange={(e) => setBio(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                 />
               </div>
             </>
           )}
        </div>

        <div className="mt-8 flex gap-4">
           {isEditing ? (
             <>
              <Button onClick={handleSave}>
                <Save size={18} className="mr-2"/> Speichern
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
             </>
           ) : (
             <Button variant="outline" onClick={() => setIsEditing(true)}>
               Profil bearbeiten
             </Button>
           )}
           <div className="flex-1"></div>
           <Button variant="danger" onClick={onLogout}>
             Abmelden
           </Button>
        </div>
      </div>
      
      {user.isPremium ? (
        <div className="bg-gradient-to-r from-yellow-900/20 to-slate-800 p-4 rounded-lg border border-yellow-700/30">
           <p className="text-yellow-500 font-bold flex items-center gap-2">Premium Mitglied</p>
           <p className="text-slate-400 text-sm mt-1">Du hast Zugriff auf High-Res Downloads.</p>
        </div>
      ) : (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
           <p className="text-slate-300">Upgrade auf Premium für High-Res Bilder.</p>
        </div>
      )}
    </div>
  );
};