"use client";

import React, { useEffect, useRef, useState } from "react";

export interface VideoChapter {
  label: string;
  time: number; // in seconds
  timestamp: string; // e.g. "04:15"
}

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  mechanism?: string;
  chapters?: VideoChapter[];
  onOpenBooking?: () => void;
}

export function VideoModal({
  isOpen,
  onClose,
  videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  poster,
  title = "Scientific Clinical Briefing",
  subtitle = "Dr. David Andreas Runheim, MD &bull; Cognitive Edge Clinic",
  mechanism,
  chapters = [],
  onOpenBooking,
}: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1080px] bg-[#121826] border border-[#D4AF37]/30 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col scale-in-95 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Luxury Telemetry Header */}
        <div className="p-5 px-6 border-b border-[#D4AF37]/20 bg-canvas-obsidian/95 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-midnight border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-ping" />
              <span>Google Flow Clinical Stream &bull; Masterclass Briefing</span>
            </div>
            <h3 id="video-modal-title" className="font-display text-lg sm:text-xl text-text-surface font-normal">
              {title}
            </h3>
            <p
              className="font-mono text-xs text-text-surface-variant"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          </div>

          <button
            onClick={onClose}
            aria-label="Close video modal"
            className="text-text-surface-variant hover:text-champagne-gold p-2 rounded-lg hover:bg-surface-container transition-colors border border-transparent hover:border-[#D4AF37]/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 16:9 Video Canvas */}
        <div className="relative aspect-video w-full bg-black overflow-hidden group">
          <video
            ref={videoRef}
            src={videoSrc}
            poster={poster}
            autoPlay
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
            className="w-full h-full object-cover"
          />

          {/* Quick HUD Play/Pause Overlay */}
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-surface-midnight/80 border border-champagne-gold/60 flex items-center justify-center text-champagne-gold shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Playback Controls & Chapter Selectors */}
        <div className="p-5 bg-canvas-obsidian/95 border-t border-border-midnight space-y-4">
          {/* Progress Timeline Bar */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-text-surface-muted">
            <span>{formatSeconds(currentTime)}</span>
            <div
              className="flex-1 h-1.5 bg-surface-midnight rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                if (videoRef.current && duration) {
                  handleSeek(clickPos * duration);
                }
              }}
            >
              <div
                className="h-full bg-champagne-gold transition-all"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            <span>{formatSeconds(duration || 0)}</span>
          </div>

          {/* Interactive Chapter Selectors */}
          {chapters.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-champagne-gold font-semibold">
                Interactive Chapter Navigation:
              </span>
              <div className="flex flex-wrap gap-2">
                {chapters.map((ch, idx) => {
                  const isActive =
                    currentTime >= ch.time &&
                    (idx === chapters.length - 1 || currentTime < chapters[idx + 1].time);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSeek(ch.time)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all flex items-center gap-2 border ${
                        isActive
                          ? "bg-surface-midnight text-champagne-gold border-champagne-gold shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                          : "bg-surface-midnight/60 text-text-surface-variant border-border-midnight hover:border-champagne-gold/50 hover:text-text-surface"
                      }`}
                    >
                      <span className="text-vitality-sage font-bold">[{ch.timestamp}]</span>
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Callout */}
          <div className="pt-3 border-t border-border-midnight flex flex-col sm:flex-row items-center justify-between gap-3">
            {mechanism && (
              <p className="font-mono text-xs text-text-surface-variant">
                <span className="text-vitality-sage font-semibold">Molecular Target:</span> {mechanism}
              </p>
            )}

            {onOpenBooking && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className="px-5 py-2 rounded-full bg-champagne-gold hover:bg-gold-glow text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner"
              >
                Schedule Assessment with Dr. Runheim &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoModal;
