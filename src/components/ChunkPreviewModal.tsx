import React, { useState, useEffect } from 'react';
import { ChunkItem } from '../types';
import { 
  X, 
  Volume2, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Music, 
  Maximize2, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { audioPlayer } from '../services/googleTtsService';

interface ChunkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: ChunkItem[];
  initialIndex?: number;
  dayNumber: number;
  lessonTitle: string;
}

export const ChunkPreviewModal: React.FC<ChunkPreviewModalProps> = ({
  isOpen,
  onClose,
  chunks,
  initialIndex = 0,
  dayNumber,
  lessonTitle
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const currentChunk = chunks[currentIndex] || chunks[0];

  const handlePlayAudio = async () => {
    if (!currentChunk) return;
    setIsPlayingAudio(true);
    try {
      await audioPlayer.playChunk(
        currentChunk.english,
        currentChunk.audio_url,
        'en-US-Journey-F',
        1.0
      );
    } catch {
      // ignore
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < chunks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'v') {
        setShowVietnamese(prev => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        handlePlayAudio();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, chunks.length]);

  if (!isOpen || !currentChunk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans animate-fade-in">
      <div className="bg-[#0A0A0A] text-white rounded-2xl border border-zinc-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col min-h-[500px]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#DC2626] text-white">
              Day {dayNumber}
            </span>
            <span className="font-display font-bold text-sm text-zinc-300">
              {lessonTitle}
            </span>
            <span className="font-mono text-xs text-zinc-500">
              ({currentIndex + 1} / {chunks.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVietnamese(!showVietnamese)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showVietnamese 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
              title="Phím tắt: V"
            >
              {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Tiếng Việt (V)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Presentation Stage */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center items-center text-center space-y-6">
          {/* Metadata badges */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#DC2626]/20 text-[#EF4444] border border-[#DC2626]/30">
              {currentChunk.category}
            </span>
            {currentChunk.speaker && (
              <span className="font-mono text-xs text-zinc-400 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                Speaker: {currentChunk.speaker}
              </span>
            )}
            {currentChunk.ipa && (
              <span className="font-mono text-xs text-zinc-500 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                {currentChunk.ipa}
              </span>
            )}
          </div>

          {/* Big English Chunk */}
          <div className="space-y-4 max-w-2xl">
            <h2 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              {currentChunk.english}
            </h2>

            {/* Beat Prosody */}
            {currentChunk.beat_prosody && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[#EF4444] font-mono text-sm md:text-base font-bold shadow-inner">
                <Music className="w-4 h-4 shrink-0" />
                <span>{currentChunk.beat_prosody}</span>
              </div>
            )}

            {/* Vietnamese Meaning */}
            <div className="min-h-[40px] flex items-center justify-center pt-2">
              {showVietnamese ? (
                <p className="font-sans text-lg md:text-xl text-zinc-400 font-medium animate-fade-in">
                  {currentChunk.vietnamese}
                </p>
              ) : (
                <span className="text-xs font-mono text-zinc-600 italic">
                  [Bấm 'V' hoặc nút trên để hiện nghĩa tiếng Việt]
                </span>
              )}
            </div>
          </div>

          {/* Audio Replay Button */}
          <button
            onClick={handlePlayAudio}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all cursor-pointer shadow-lg ${
              isPlayingAudio 
                ? 'bg-[#DC2626] border-[#DC2626] text-white animate-pulse' 
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
            }`}
            title="Phím tắt: R"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-bold font-mono">Nghe Phát Âm Chuẩn (R)</span>
          </button>
        </div>

        {/* Bottom Navigation & Hotkeys bar */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-zinc-500">
            <span>[Phím Space / →]: Tiếp theo</span>
            <span>[←]: Lùi lại</span>
            <span>[R]: Nghe</span>
            <span>[V]: Ẩn/Hiện dịch</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu Trước</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === chunks.length - 1}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 disabled:hover:bg-[#DC2626] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <span>Câu Kế Tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
