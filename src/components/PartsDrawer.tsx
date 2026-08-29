import React from 'react';
import { ChunkItem, LessonPart } from '../types';
import { Layers, X, ChevronRight, Hash } from 'lucide-react';

export function groupChunksIntoParts(chunks: ChunkItem[]): LessonPart[] {
  const parts: LessonPart[] = [];
  let currentCategory = '';
  let startIndex = 0;

  chunks.forEach((chunk, index) => {
    if (chunk.category !== currentCategory) {
      if (currentCategory !== '') {
        parts.push({
          part_index: parts.length + 1,
          category: currentCategory,
          title: `Part ${parts.length + 1}: ${currentCategory.toUpperCase().replace('_', ' ')}`,
          start_index: startIndex,
          end_index: index - 1,
          chunk_count: index - startIndex
        });
      }
      currentCategory = chunk.category;
      startIndex = index;
    }
  });

  if (chunks.length > 0) {
    parts.push({
      part_index: parts.length + 1,
      category: currentCategory,
      title: `Part ${parts.length + 1}: ${currentCategory.toUpperCase().replace('_', ' ')}`,
      start_index: startIndex,
      end_index: chunks.length - 1,
      chunk_count: chunks.length - startIndex
    });
  }

  return parts;
}

interface PartsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parts: LessonPart[];
  currentChunkIndex: number;
  onSelectPart: (startIndex: number) => void;
}

export const PartsDrawer: React.FC<PartsDrawerProps> = ({
  isOpen,
  onClose,
  parts,
  currentChunkIndex,
  onSelectPart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-[#E8E8EC] shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8EC] flex items-center justify-between bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#DC2626] text-white flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-[#0A0A0A]">
              Lesson Parts Navigation
            </h3>
            <p className="text-[11px] text-[#6B6B6B]">
              Jump directly to any section (Key: P)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
          title="Close Drawer (P / Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {parts.map((part) => {
          const isCurrentPart =
            currentChunkIndex >= part.start_index && currentChunkIndex <= part.end_index;
          return (
            <button
              key={part.part_index}
              onClick={() => {
                onSelectPart(part.start_index);
                onClose();
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                isCurrentPart
                  ? 'border-[#DC2626] bg-[#DC2626]/[0.05] ring-1 ring-[#DC2626]/20 shadow-xs'
                  : 'border-[#E8E8EC] bg-white hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isCurrentPart
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {part.category}
                </span>
                <span className="text-[11px] font-mono text-[#6B6B6B]">
                  {part.chunk_count} {part.chunk_count === 1 ? 'chunk' : 'chunks'}
                </span>
              </div>
              <div className="text-xs font-bold text-[#0A0A0A] flex items-center justify-between">
                <span>{part.title}</span>
                {isCurrentPart && (
                  <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-[#6B6B6B] mt-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-zinc-400" />
                <span>Chunks #{part.start_index + 1} – #{part.end_index + 1}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer shortcut helper */}
      <div className="p-3 border-t border-[#E8E8EC] bg-[#FAFAFA] text-[11px] font-mono text-[#6B6B6B] flex items-center justify-between">
        <span>Shortcut: <strong className="text-[#0A0A0A]">P</strong></span>
        <span>Clicker Remote Ready</span>
      </div>
    </div>
  );
};
