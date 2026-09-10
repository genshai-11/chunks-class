import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChunkItem, LessonPart } from '../types';
import { 
  X, 
  Search, 
  Play, 
  CheckCircle2, 
  Layers, 
  GraduationCap, 
  Volume2, 
  ChevronRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';

import { groupChunksIntoParts } from './PartsDrawer';

interface ChunkListPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: ChunkItem[];
  currentIndex: number;
  parts: LessonPart[];
  currentPart: LessonPart | null;
  onSelectChunk: (index: number) => void;
  onPreviewAudio?: (chunk: ChunkItem) => void;
  highContrastDark?: boolean;
}

export const ChunkListPreviewDrawer: React.FC<ChunkListPreviewDrawerProps> = ({
  isOpen,
  onClose,
  chunks,
  currentIndex,
  parts,
  currentPart,
  onSelectChunk,
  onPreviewAudio,
  highContrastDark = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPartTab, setSelectedPartTab] = useState<number | 'all'>('all');
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Derive parts dynamically if not provided
  const effectiveParts = useMemo(() => {
    if (parts && parts.length > 0) return parts;
    return groupChunksIntoParts(chunks);
  }, [parts, chunks]);

  // Format tab label (e.g. "Part 1: Slangs (10)")
  const formatPartLabel = (p: LessonPart) => {
    let title = (p.title || p.category || '').replace(/^Part\s*\d+\s*[-:]\s*/i, '').trim();
    const lower = title.toLowerCase();
    if (lower === 'slang') title = 'Slangs';
    else if (lower === 'vocab') title = 'Vocab';
    else if (lower === 'phrase') title = 'Phrases';
    else if (lower === 'sentence') title = 'Sentences';
    else if (lower === 'review') title = '5s Review';
    else if (lower === 'monologue') title = 'Monologue';
    else if (lower === 'dialogue') title = 'Dialogue';
    else if (title) {
      title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return `Part ${p.part_index}: ${title || p.category} (${p.chunk_count})`;
  };

  // Auto-scroll to active chunk when drawer opens
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter chunks by selected Part and search query
  const filteredChunks = useMemo(() => {
    const targetPart = selectedPartTab === 'all' 
      ? null 
      : effectiveParts.find(p => p.part_index === selectedPartTab);

    return chunks.map((chunk, originalIndex) => ({ chunk, originalIndex })).filter(({ chunk, originalIndex }) => {
      if (targetPart) {
        if (originalIndex < targetPart.start_index || originalIndex > targetPart.end_index) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          chunk.english.toLowerCase().includes(q) ||
          chunk.vietnamese.toLowerCase().includes(q) ||
          (chunk.speaker && chunk.speaker.toLowerCase().includes(q)) ||
          (chunk.notes && chunk.notes.toLowerCase().includes(q)) ||
          (chunk.part && chunk.part.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [chunks, effectiveParts, selectedPartTab, searchQuery]);

  if (!isOpen) return null;

  // Calculate Progress %
  const totalChunks = chunks.length;
  const classProgressPercent = totalChunks > 0 ? Math.round(((currentIndex + 1) / totalChunks) * 100) : 0;

  // Part Progress %
  let partProgressPercent = 0;
  let partChunkCurrent = 0;
  let partChunkTotal = 0;

  if (currentPart) {
    partChunkTotal = currentPart.chunk_count;
    partChunkCurrent = Math.max(0, Math.min(partChunkTotal, currentIndex - currentPart.start_index + 1));
    partProgressPercent = partChunkTotal > 0 ? Math.round((partChunkCurrent / partChunkTotal) * 100) : 0;
  }

  const renderCategoryBadge = (chunk: ChunkItem) => {
    const cat = (chunk.category || '').toLowerCase();
    const isExample = Boolean(
      chunk.is_example || 
      (chunk.notes && (chunk.notes.includes('[Example Sentence]') || chunk.notes.toLowerCase().includes('example')))
    );

    if (cat === 'slang') {
      if (isExample) {
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            SLANG EXAMPLE
          </span>
        );
      }
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
          SLANG
        </span>
      );
    }

    if (cat === 'vocab') {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          VOCAB
        </span>
      );
    }

    if (cat === 'phrase') {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          PHRASE
        </span>
      );
    }

    if (cat === 'sentence') {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          SENTENCE
        </span>
      );
    }

    if (cat === 'monologue') {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          MONOLOGUE
        </span>
      );
    }

    if (cat === 'dialogue') {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          DIALOGUE
        </span>
      );
    }

    if (cat === 'review') {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
          REVIEW
        </span>
      );
    }

    return (
      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        {cat ? cat.toUpperCase() : 'CHUNK'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200" 
      />

      {/* Slide-over Drawer Panel */}
      <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ${
        highContrastDark ? 'bg-zinc-900 border-l border-zinc-800 text-zinc-100' : 'bg-white border-l border-[#E8E8EC] text-[#0A0A0A]'
      }`}>
        
        {/* Top Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          highContrastDark ? 'bg-zinc-950 border-zinc-800' : 'bg-[#FAFAFA] border-[#E8E8EC]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Vocabulary & Chunks Overview</h3>
              <p className="text-[11px] text-zinc-500">Preview & jump to any sentence in this session</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Progress Bars Panel (% theo Part & % theo Class) */}
        <div className={`p-4 border-b space-y-3 ${
          highContrastDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50/70 border-[#E8E8EC]'
        }`}>
          {/* 1. Progress theo Part */}
          {currentPart && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Part {currentPart.part_index}: {currentPart.category.toUpperCase()}</span>
                </span>
                <span className="font-mono font-bold text-[#DC2626]">
                  {partChunkCurrent}/{partChunkTotal} ({partProgressPercent}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#DC2626] rounded-full transition-all duration-300"
                  style={{ width: `${partProgressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* 2. Progress theo Toàn Bộ Buổi Học (Class Total) */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Class Overall Completion</span>
              </span>
              <span className="font-mono font-bold text-emerald-600">
                {currentIndex + 1}/{totalChunks} ({classProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${classProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search & Part Tabs Filter */}
        <div className="p-3 border-b border-[#E8E8EC] dark:border-zinc-800 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search words, English, Vietnamese..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border transition-all focus:outline-hidden focus:border-[#DC2626] ${
                highContrastDark 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' 
                  : 'bg-white border-[#E8E8EC] text-[#0A0A0A] placeholder-zinc-400'
              }`}
            />
          </div>

          {/* Part & Phase Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedPartTab('all')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedPartTab === 'all'
                  ? 'bg-[#DC2626] text-white shadow-xs'
                  : highContrastDark
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All ({totalChunks})
            </button>
            {effectiveParts.map((part) => (
              <button
                key={part.part_index}
                onClick={() => setSelectedPartTab(part.part_index)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedPartTab === part.part_index
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : highContrastDark
                      ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {formatPartLabel(part)}
              </button>
            ))}
          </div>
        </div>

        {/* Chunks List Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredChunks.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No matching words or chunks found.
            </div>
          ) : (
            filteredChunks.map(({ chunk, originalIndex }) => {
              const isCurrent = originalIndex === currentIndex;
              const isPassed = originalIndex < currentIndex;

              return (
                <div
                  key={chunk.chunk_id || originalIndex}
                  ref={isCurrent ? activeItemRef : null}
                  className={`p-3 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 group ${
                    isCurrent
                      ? 'border-[#DC2626] bg-[#DC2626]/[0.06] shadow-sm ring-1 ring-[#DC2626]'
                      : isPassed
                        ? highContrastDark
                          ? 'border-zinc-800 bg-zinc-950/40 opacity-75'
                          : 'border-zinc-200/80 bg-zinc-50/50 opacity-80'
                        : highContrastDark
                          ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                          : 'border-[#E8E8EC] hover:border-zinc-300 bg-white'
                  }`}
                >
                  {/* Left Column: Number + Info */}
                  <div 
                    onClick={() => { onSelectChunk(originalIndex); onClose(); }}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                      )}

                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        #{originalIndex + 1} / {totalChunks}
                      </span>

                      {renderCategoryBadge(chunk)}

                      {chunk.speaker && (
                        <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {chunk.speaker}
                        </span>
                      )}
                    </div>

                    {/* English Chunk Text */}
                    <div className={`text-xs font-bold leading-snug tracking-tight mb-0.5 ${
                      isCurrent ? 'text-[#DC2626]' : ''
                    }`}>
                      "{chunk.english}"
                    </div>

                    {/* Vietnamese Translation */}
                    <div className="text-[11px] text-zinc-500 leading-normal">
                      {chunk.vietnamese}
                    </div>
                  </div>

                  {/* Right Actions (Play Audio Preview & Jump) */}
                  <div className="flex items-center gap-1 pt-1 shrink-0">
                    {onPreviewAudio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewAudio(chunk);
                        }}
                        className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        title="Listen preview"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => { onSelectChunk(originalIndex); onClose(); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-[#DC2626] text-white' 
                          : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800'
                      }`}
                      title="Jump to this chunk"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className={`p-3 border-t text-center text-[10px] font-mono ${
          highContrastDark ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-[#FAFAFA] border-[#E8E8EC] text-zinc-500'
        }`}>
          Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-bold">Key L</kbd> to toggle this word list drawer anytime
        </div>

      </div>
    </div>
  );
};
