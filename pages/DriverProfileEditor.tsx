import React from 'react';
import { User, Flag } from 'lucide-react';

export const DriverProfileEditor: React.FC<{ user: any }> = ({ user }) => {
    return (
        <div className="container mx-auto p-4 text-white">
            <h1 className="text-3xl font-bold mb-6 text-neon-blue flex items-center gap-3">
                <Flag className="text-red-500" />
                Mein Fahrerprofil
            </h1>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <p className="text-xl mb-4">Willkommen, {user.name}!</p>
                <p className="text-slate-400">
                    Du bist erfolgreich mit deinem Fahrerprofil verknüpft (Driver ID: {user.driverId}).
                </p>
                <div className="mt-8 p-4 bg-slate-900 rounded border border-dashed border-slate-600 text-center text-slate-500">
                    Weitere Funktionen zum Bearbeiten deines Fahrerprofils (Bio, Fotos, Sponsoren) kommen bald.
                </div>
            </div>
        </div>
    );
};

export default DriverProfileEditor;
