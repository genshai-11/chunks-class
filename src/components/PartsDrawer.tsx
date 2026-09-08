import React, { useState, useMemo } from 'react';
import { ChunkItem, LessonPart } from '../types';
import { Layers, X, Hash, Volume2, VolumeX, BookOpen, CheckCircle2 } from 'lucide-react';

/**
 * Smart Topic & Part Extractor
 * Identifies 2-topic structures (e.g. EREL 14 parts -> Topic 1 [Parts 1-7] & Topic 2 [Parts 8-14])
 * and calculates live audio readiness per section.
 */
export function groupChunksIntoParts(
  chunks: ChunkItem[],
  lessonTitle?: string,
  checkAudioReady?: (chunk: ChunkItem) => boolean
): LessonPart[] {
  if (!chunks || chunks.length === 0) return [];

  // 1. Extract potential topic titles from lessonTitle (e.g. "Day 1 - Gossipy & Office romance")
  let topic1Title = '';
  let topic2Title = '';
  if (lessonTitle) {
    const cleanTitle = lessonTitle.replace(/^Day\s*\d+\s*[-:]\s*/i, '').trim();
    if (cleanTitle.includes(' & ')) {
      const partsTitle = cleanTitle.split(' & ');
      topic1Title = partsTitle[0].trim();
      topic2Title = partsTitle.slice(1).join(' & ').trim();
    } else if (cleanTitle.includes(' and ')) {
      const partsTitle = cleanTitle.split(' and ');
      topic1Title = partsTitle[0].trim();
      topic2Title = partsTitle.slice(1).join(' and ').trim();
    }
  }

  // 2. Group contiguous chunks by part or category
  const rawParts: {
    firstChunk: ChunkItem;
    categoryKey: string;
    startIndex: number;
    endIndex: number;
    chunkCount: number;
  }[] = [];

  let currentKey = '';
  let startIndex = 0;

  chunks.forEach((chunk, index) => {
    const groupKey = chunk.part || chunk.category;
    if (groupKey !== currentKey) {
      if (currentKey !== '') {
        rawParts.push({
          firstChunk: chunks[startIndex],
          categoryKey: currentKey,
          startIndex: startIndex,
          endIndex: index - 1,
          chunkCount: index - startIndex
        });
      }
      currentKey = groupKey;
      startIndex = index;
    }
  });

  if (chunks.length > 0) {
    rawParts.push({
      firstChunk: chunks[startIndex],
      categoryKey: currentKey,
      startIndex: startIndex,
      endIndex: chunks.length - 1,
      chunkCount: chunks.length - startIndex
    });
  }

  // 3. Check if the lesson has 2 topics (e.g. EREL 14 parts, or explicit parts with Part >= 8, or 2 topics in title)
  const hasPart8OrMore = rawParts.some(p => {
    const match = p.firstChunk.part?.match(/Part\s*(\d+)/i);
    return match && parseInt(match[1], 10) >= 8;
  });
  const isTwoTopicLesson = Boolean((topic1Title && topic2Title) || hasPart8OrMore || rawParts.length === 14);

  const parts: LessonPart[] = rawParts.map((rp, idx) => {
    const partNumFromPart = rp.firstChunk.part?.match(/Part\s*(\d+)/i);
    const rawPartIndex = partNumFromPart ? parseInt(partNumFromPart[1], 10) : (idx + 1);

    // Clean title: "Part 1 - Vietnamese Slangs" -> "Vietnamese Slangs"
    const cleanTitle = rp.firstChunk.part
      ? rp.firstChunk.part.replace(/^Part\s*\d+\s*[-:]\s*/i, '').trim()
      : `Part ${idx + 1}: ${rp.categoryKey.toUpperCase().replace('_', ' ')}`;

    // Topic resolution
    let topic_number: 1 | 2 | undefined = undefined;
    let topic_title: string | undefined = undefined;
    let part_in_topic: number | undefined = undefined;

    if (isTwoTopicLesson) {
      if (rawPartIndex <= 7 && idx < 7) {
        topic_number = 1;
        topic_title = topic1Title || 'Topic 1';
        part_in_topic = rawPartIndex <= 7 ? rawPartIndex : (idx + 1);
      } else if (rawPartIndex >= 8 || idx >= 7) {
        topic_number = 2;
        topic_title = topic2Title || 'Topic 2';
        part_in_topic = rawPartIndex >= 8 ? (rawPartIndex - 7) : (idx - 6);
      }
    }

    // Audio readiness calculation per part
    let audioReadyCount = 0;
    for (let i = rp.startIndex; i <= rp.endIndex; i++) {
      const c = chunks[i];
      if (checkAudioReady) {
        if (checkAudioReady(c)) audioReadyCount++;
      } else {
        const hasGcs = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
        if (hasGcs) audioReadyCount++;
      }
    }

    return {
      part_index: idx + 1,
      category: cleanTitle || rp.firstChunk.category || 'General',
      title: cleanTitle || `Part ${idx + 1}`,
      start_index: rp.startIndex,
      end_index: rp.endIndex,
      chunk_count: rp.chunkCount,
      topic_number,
      topic_title,
      part_in_topic,
      audio_ready_count: audioReadyCount,
      audio_total_count: rp.chunkCount
    };
  });

  return parts;
}

interface PartsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parts: LessonPart[];
  currentChunkIndex: number;
  onSelectPart: (startIndex: number) => void;
  lessonTitle?: string;
}

export const PartsDrawer: React.FC<PartsDrawerProps> = ({
  isOpen,
  onClose,
  parts,
  currentChunkIndex,
  onSelectPart,
  lessonTitle
}) => {
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<'ALL' | 1 | 2>('ALL');

  const topic1Parts = useMemo(() => parts.filter(p => p.topic_number === 1), [parts]);
  const topic2Parts = useMemo(() => parts.filter(p => p.topic_number === 2), [parts]);
  const hasTwoTopics = topic1Parts.length > 0 && topic2Parts.length > 0;

  const topic1Title = topic1Parts[0]?.topic_title || 'Topic 1';
  const topic2Title = topic2Parts[0]?.topic_title || 'Topic 2';

  const displayedParts = useMemo(() => {
    if (!hasTwoTopics || selectedTopicFilter === 'ALL') return parts;
    return parts.filter(p => p.topic_number === selectedTopicFilter);
  }, [parts, hasTwoTopics, selectedTopicFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-88 sm:w-96 bg-white border-l border-[#E8E8EC] shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E8EC] bg-[#FAFAFA]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#0A0A0A]">
                Lesson Parts Navigation
              </h3>
              <p className="text-[11px] text-[#6B6B6B]">
                {lessonTitle ? lessonTitle : 'Jump directly to any section (Key: P)'}
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

        {/* Segmented Filter Tabs for 2-Topic Lessons */}
        {hasTwoTopics && (
          <div className="mt-3 flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
            <button
              onClick={() => setSelectedTopicFilter('ALL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                selectedTopicFilter === 'ALL'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Tất cả ({parts.length})
            </button>
            <button
              onClick={() => setSelectedTopicFilter(1)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center truncate cursor-pointer ${
                selectedTopicFilter === 1
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
              title={`Topic 1: ${topic1Title}`}
            >
              📘 Topic 1 ({topic1Parts.length})
            </button>
            <button
              onClick={() => setSelectedTopicFilter(2)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center truncate cursor-pointer ${
                selectedTopicFilter === 2
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
              title={`Topic 2: ${topic2Title}`}
            >
              📗 Topic 2 ({topic2Parts.length})
            </button>
          </div>
        )}
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {displayedParts.map((part) => {
          const isCurrentPart =
            currentChunkIndex >= part.start_index && currentChunkIndex <= part.end_index;
          const audioReady = part.audio_ready_count ?? 0;
          const audioTotal = part.audio_total_count ?? part.chunk_count;
          const isFullAudioReady = audioReady === audioTotal && audioTotal > 0;
          const isPartialAudio = audioReady > 0 && audioReady < audioTotal;

          return (
            <button
              key={part.part_index}
              onClick={() => {
                onSelectPart(part.start_index);
                onClose();
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                isCurrentPart
                  ? 'border-[#DC2626] bg-[#DC2626]/[0.05] ring-2 ring-[#DC2626]/20 shadow-xs'
                  : 'border-[#E8E8EC] bg-white hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                {part.topic_number ? (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      part.topic_number === 1
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {part.topic_number === 1 ? '📘 Topic 1' : '📗 Topic 2'} · Phần {part.part_in_topic || part.part_index}
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isCurrentPart
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    Phần {part.part_index}
                  </span>
                )}

                {/* Audio Readiness Badge */}
                {isFullAudioReady ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Volume2 className="w-3 h-3 text-emerald-600" />
                    <span>{audioReady}/{audioTotal} Audio</span>
                  </span>
                ) : isPartialAudio ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Volume2 className="w-3 h-3 text-amber-600" />
                    <span>{audioReady}/{audioTotal} Audio</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <VolumeX className="w-3 h-3 text-rose-500" />
                    <span>0/{audioTotal} Thiếu Audio</span>
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-[#0A0A0A] flex items-center justify-between">
                <span>{part.title}</span>
                {isCurrentPart && (
                  <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase">
                    Active
                  </span>
                )}
              </div>

              <div className="text-[11px] font-mono text-[#6B6B6B] mt-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-zinc-400" />
                  Chunks #{part.start_index + 1} – #{part.end_index + 1}
                </span>
                <span>
                  {part.chunk_count} {part.chunk_count === 1 ? 'chunk' : 'chunks'}
                </span>
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
