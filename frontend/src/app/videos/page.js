"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import { VIDEO_CATEGORIES } from "@/lib/config";
import videosData from "@/lib/videosData.json";

function durationLabel(value) {
  if (!value) return "N/A";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function VideosPage() {
  const [category, setCategory] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPlayingVideoId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const videos = videosData.filter((video) => {
    if (!category) return true;
    return video.category === category;
  });

  const playingVideo = videos.find(v => v.id === playingVideoId);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl pt-4 font-bold">Video Library</h1>
            <p className="text-sm text-slate-600">Learn reconstitution, injection techniques, and peptide-specific workflows.</p>
          </div>
          <Select value={category} onChange={(event) => setCategory(event.target.value)} className="max-w-xs">
            {VIDEO_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden flex flex-col group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow">
              
              {/* Interactive Player Frame */}
              <div 
                className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setPlayingVideoId(video.id)}
              >
                  <Image 
                    src={video.customThumbnail} 
                    alt={video.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={60}
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                  />
                  <div className="absolute inset-0 transition-colors duration-300 bg-slate-900/30 group-hover:bg-transparent"></div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                      <svg className="h-6 w-6 ml-1 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  
                  {/* Duration Badge */}
                  {video.durationSeconds > 0 && (
                    <div className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-xs font-bold tracking-wide text-white shadow-sm backdrop-blur-md">
                      {durationLabel(video.durationSeconds)}
                    </div>
                  )}
              </div>

              {/* Video Metadata */}
              <div className="flex flex-col flex-1 p-5 lg:p-6 bg-white">
                <h3 className="text-xl font-bold leading-snug text-slate-900 mb-3">{video.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 flex-1 whitespace-pre-wrap">{video.description}</p>
                
                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200">
                    {VIDEO_CATEGORIES.find(c => c.value === video.category)?.label || "Protocol"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Cinematic Video Player Modal */}
        {playingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
              onClick={() => setPlayingVideoId(null)}
            />
            <div 
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between  bg-zinc-900/80 px-4 py-3 border-b border-zinc-800 text-white">
                <h3  className="text-sm font-semibold text-white! drop-shadow-sm truncate pr-4">{playingVideo.title}</h3>
                <button 
                  onClick={() => setPlayingVideoId(null)}
                  className="rounded-full bg-zinc-800/80 p-2 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe 
                  className="h-full w-full border-none" 
                  src={`${playingVideo.embedUrl}?autoplay=1`} 
                  title={playingVideo.title} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
