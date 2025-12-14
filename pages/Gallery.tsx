import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Tag, Loader2, Image as ImageIcon, Filter, ArrowLeft } from 'lucide-react';
import { Photo, User, Event } from '../types';
import { analyzeImage } from '../services/geminiService';

interface GalleryProps {
  user: User | null;
}

interface GalleryEvent extends Event {
  photo_count: number;
  cover_url: string;
}

export const Gallery: React.FC<GalleryProps> = ({ user }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]); // All events for dropdown
  const [galleryEvents, setGalleryEvents] = useState<GalleryEvent[]>([]); // Events with photos for overview

  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [uploadEventId, setUploadEventId] = useState<string>(''); // For upload modal

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Load Events (dropdown)
    fetch('http://localhost:3000/api/events')
      .then(r => r.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Failed to load events", err));

    // 2. Load Gallery Events (Overview)
    fetch('http://localhost:3000/api/gallery/events')
      .then(r => r.json())
      .then(data => {
        const mapped = data.map((e: any) => ({
          ...e,
          cover_url: e.cover_url ? `http://localhost:3000${e.cover_url}` : null
        }));
        setGalleryEvents(mapped);
      })
      .catch(err => console.error("Failed to load gallery events", err));

    // 3. Load Photos (if needed, or wait for selection)
    // loadPhotos(); // Don't load all photos initially anymore
  }, []);

  const loadPhotos = (eventId?: string) => {
    let url = 'http://localhost:3000/api/photos';
    if (eventId && eventId !== 'all') {
      url += `?eventId=${eventId}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(data => {
        // Transform relative URL to absolute for localhost
        const mapped = data.map((p: any) => ({
          ...p,
          url: `http://localhost:3000${p.url}` // Helper for localhost
        }));
        setPhotos(mapped);
      })
      .catch(err => console.error("Failed to load photos", err));
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    loadPhotos(eventId);
    setView('detail');
  };

  const handleBackToOverview = () => {
    setView('overview');
    setSelectedEventId('all');
    // Reload gallery events to update counts/covers if changed
    fetch('http://localhost:3000/api/gallery/events')
      .then(r => r.json())
      .then(data => {
        const mapped = data.map((e: any) => ({
          ...e,
          cover_url: e.cover_url ? `http://localhost:3000${e.cover_url}` : null
        }));
        setGalleryEvents(mapped);
      });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Require Event Selection for Upload
    if (!uploadEventId) {
      alert("Bitte wähle zuerst ein Event aus, zu dem das Foto gehört.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setAnalysis(null);

    const formData = new FormData();
    // Append all selected files
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    formData.append('eventId', uploadEventId);
    formData.append('photographer', user?.name || 'Gast');

    try {
      const res = await fetch('http://localhost:3000/api/photos', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        // Refresh photos
        loadPhotos(selectedEventId);
        // Reset
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert(`${result.message || 'Upload erfolgreich'}`);
      } else {
        alert("Fehler beim Hochladen.");
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {view === 'detail' && (
              <button onClick={handleBackToOverview} className="hover:bg-slate-800 p-1 rounded-full text-slate-400 hover:text-white transition">
                <ArrowLeft size={28} />
              </button>
            )}
            Media Galerie
          </h1>
          <p className="text-slate-400">
            {view === 'overview' ? 'Wähle ein Event, um Fotos zu sehen.' : 'Die besten Shots der Saison.'}
          </p>
        </div>

        {/* Upload Button */}
        {user && (
          <div className="flex gap-2 items-center">
            <select
              className="bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-red-500 max-w-[200px]"
              value={uploadEventId}
              onChange={(e) => setUploadEventId(e.target.value)}
            >
              <option value="">Event für Upload...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />
            <button
              onClick={() => {
                if (!uploadEventId) { alert("Bitte erst Event auswählen"); return; }
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* OVERVIEW VIEW */}
      {view === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryEvents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>Noch keine Galerien vorhanden.</p>
            </div>
          ) : (
            galleryEvents.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="group bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-red-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-red-900/10"
              >
                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                  {event.cover_url ? (
                    <img src={event.cover_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition" />
                  <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono flex items-center gap-1">
                    <ImageIcon size={12} /> {event.photo_count}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">{event.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
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
                      onClick={(e) => { e.stopPropagation(); downloadImage(photo); }}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur text-white p-2 rounded-full border border-white/20"
                      title={user?.isPremium ? "Download High-Res" : "Download Low-Res (Login für High-Res)"}
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>

                {/* Mobile Footer */}
                <div className="p-3 md:hidden">
                  <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>{photo.photographer}</span>
                    <Download size={16} onClick={() => downloadImage(photo)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {photos.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>Keine Fotos für dieses Event gefunden.</p>
            </div>
          )}
        </>
      )}

      {/* Empty State / Call to Action if not logged in */}
      {!user && view === 'overview' && galleryEvents.length === 0 && (
        <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
          <ImageIcon className="mx-auto text-slate-500 mb-2" size={32} />
          <p className="text-slate-400">Melde dich an, um erste Fotos hochzuladen.</p>
        </div>
      )}
    </div>
  );
};