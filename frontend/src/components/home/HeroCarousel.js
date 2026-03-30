"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";

const slides = [
  { src: "/header/header-1.png", alt: "Precision Peptide Intelligence" },
  // { src: "/header/header-2.png", alt: "Advanced Protocol Management" },
  // { src: "/header/header-3.png", alt: "Clinical-Grade Dosage Planning" },
  { src: "/header/header-4.png", alt: "How-to peptide videos" },
  { src: "/header/header-5.png", alt: "Search popular peptides" },
  { src: "/header/header-6.png", alt: "Search popular peptides" },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);
  const touchStartRef = useRef(0);

  const goToSlide = useCallback((index) => setCurrentSlide(index), []);
  const nextSlide = useCallback(() => setCurrentSlide((p) => (p + 1) % slides.length), []);
  const prevSlide = useCallback(() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    autoPlayRef.current = setInterval(nextSlide, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, nextSlide]);

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { pauseAutoPlay(); diff > 0 ? nextSlide() : prevSlide(); }
  };

  return (
    <section
      className="relative -mx-2 w-[calc(100%+1rem)] overflow-hidden rounded-none bg-slate-100 sm:mx-0 sm:w-full sm:rounded-3xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-16/7 sm:aspect-16/6 w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <Image src={slide.src} alt={slide.alt} fill className="object-cover" priority={index === 0} sizes="100vw" />
          </div>
        ))}

        <button
          onClick={() => { pauseAutoPlay(); prevSlide(); }}
          className="absolute left-3 sm:left-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/30 text-slate-700/70 shadow-lg backdrop-blur-sm transition-all hover:bg-white/50 hover:scale-110 active:scale-95 sm:bg-white/80 sm:text-slate-700 sm:hover:bg-white"
          aria-label="Previous slide"
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => { pauseAutoPlay(); nextSlide(); }}
          className="absolute right-3 sm:right-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/30 text-slate-700/70 shadow-lg backdrop-blur-sm transition-all hover:bg-white/50 hover:scale-110 active:scale-95 sm:bg-white/80 sm:text-slate-700 sm:hover:bg-white"
          aria-label="Next slide"
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="absolute bottom-3 sm:bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => { pauseAutoPlay(); goToSlide(index); }}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-white shadow-md" : "w-2 bg-white/50 hover:bg-white/80"}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
