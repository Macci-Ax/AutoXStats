import React, { useState, useRef } from 'react';
import { Upload, Download, Tag, Loader2, Image as ImageIcon } from 'lucide-react';
import { MOCK_PHOTOS } from '../constants';
import { Photo, User } from '../types';
import { analyzeImage } from '../services/geminiService';

interface GalleryProps {
  user: User | null;
}

export const Gallery: React.FC<GalleryProps> = ({ user }) => {
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAnalysis(null);

    // Convert to base64 for Gemini
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; // Remove data:image/jpeg;base64,
      
      // Call Gemini
      const geminiResult = await analyzeImage(base64Data, file.type);
      setAnalysis(geminiResult);
      
      // Mock create new photo
      const newPhoto: Photo = {
        id: `p_${Date.now()}`,
        url: URL.createObjectURL(file), // Local preview
        photographer: user?.name || 'Gast',
        eventId: 'e_temp',
        tags: ['Neu'],
        uploadDate: new Date().toISOString(),
        highResAvailable: true
      };

      setPhotos(prev => [newPhoto, ...prev]);
      setUploading(false);
      
      // Reset input
      if(fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = (photo: Photo) => {
    if (photo.highResAvailable && (!user || !user.isPremium)) {
      alert("High-Res Downloads sind nur für registrierte Fahrer und Premium-Mitglieder.");
      return;
    }
    // Simulate download
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `autox_${photo.id}.jpg`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Media Galerie</h1>
           <p className="text-slate-400">Die besten Shots der Saison.</p>
        </div>
        
        {user && (
          <div className="w-full md:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20} />}
              <span>Foto hochladen</span>
            </button>
          </div>
        )}
      </div>

      {/* Analysis Result Notification */}
      {analysis && (
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex gap-3 animate-fade-in">
           <div className="bg-blue-900/30 p-2 rounded h-fit">
              <Tag className="text-blue-400" size={20} />
           </div>
           <div>
              <h4 className="font-bold text-white text-sm mb-1">KI-Analyse (Gemini)</h4>
              <p className="text-slate-300 text-sm">{analysis}</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map(photo => (
          <div key={photo.id} className="group bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition relative">
            <div className="aspect-[4/3] overflow-hidden bg-slate-900">
               <img src={photo.url} alt="Autocross" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
               <div className="flex justify-between items-end">
                  <div className="text-white text-sm">
                     <p className="font-bold">{photo.photographer}</p>
                     <p className="text-xs opacity-75">{new Date(photo.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => downloadImage(photo)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur text-white p-2 rounded-full border border-white/20"
                    title={user?.isPremium ? "Download High-Res" : "Download Low-Res (Login für High-Res)"}
                  >
                    <Download size={20} />
                  </button>
               </div>
            </div>
            
            {/* Mobile Footer (visible always on mobile, hidden on hover desktop if overlay works well, but keeping simple here) */}
            <div className="p-3 md:hidden">
                 <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>{photo.photographer}</span>
                    <Download size={16} onClick={() => downloadImage(photo)}/>
                 </div>
            </div>
          </div>
        ))}
      </div>
      
      {!user && (
        <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
           <ImageIcon className="mx-auto text-slate-500 mb-2" size={32}/>
           <p className="text-slate-400">Melde dich an, um eigene Fotos hochzuladen und in voller Qualität herunterzuladen.</p>
        </div>
      )}
    </div>
  );
};