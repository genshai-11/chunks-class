import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChunkItem, LessonPart } from '../types';
import { Layers, X, Hash, Volume2, VolumeX, BookOpen, CheckCircle2, Play, RotateCw, Loader2, Edit2, Save, Zap } from 'lucide-react';
import {
  getPartOverrides,
  findPartOverride,
  getPartSpeechText,
  isPartAudioCached,
  playPartIntro,
  regeneratePartAudio,
  savePartOverrides,
  PartOverride,
  CANONICAL_PARTS,
  deriveCanonicalPartKey
} from '../services/partAudioService';
import { audioPlayer } from '../services/googleTtsService';
import { modelRegistryService } from '../services/modelRegistryService';
/**
 * Smart Topic & Part Extractor
 * Identifies 2-topic structures (e.g. EREL 14 parts -> Topic 1 [Parts 1-7] & Topic 2 [Parts 8-14])
 * and calculates live audio readiness per section.
 */
export function groupChunksIntoParts(
  chunks: ChunkItem[],
  lessonTitle?: string,
  checkAudioReady?: (chunk: ChunkItem) => boolean,
  courseLevel?: string
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

    // Derive canonical part key
    const rawPartStr = rp.firstChunk.part || cleanTitle;
    const partKey = deriveCanonicalPartKey(rawPartStr, rawPartIndex);

    // Apply custom part overrides if configured
    const overrides = courseLevel ? getPartOverrides(courseLevel) : getPartOverrides('LEVEL_B');
    const override = findPartOverride(overrides, rawPartStr, rawPartIndex);
    let effectiveCleanTitle = cleanTitle;
    if (override?.titleEn?.trim()) {
      effectiveCleanTitle = override.titleEn.trim().replace(/^Part\s*\d+\s*[-:.]\s*/i, '').trim() || override.titleEn.trim();
    }
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
      category: effectiveCleanTitle || rp.firstChunk.category || 'General',
      title: effectiveCleanTitle || `Part ${idx + 1}`,
      start_index: rp.startIndex,
      end_index: rp.endIndex,
      chunk_count: rp.chunkCount,
      raw_part: rp.firstChunk.part,
      part_key: partKey,
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
  onSelectGrammar?: () => void;
  isGrammarActive?: boolean;
  hasGrammar?: boolean;
  lessonTitle?: string;
  selectedVoice?: string;
  courseLevel?: string;
}

export const PartsDrawer: React.FC<PartsDrawerProps> = ({
  isOpen,
  onClose,
  parts,
  currentChunkIndex,
  onSelectPart,
  onSelectGrammar,
  isGrammarActive = false,
  hasGrammar = true,
  lessonTitle,
  selectedVoice,
  courseLevel
}) => {
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<'ALL' | 1 | 2>('ALL');
  const [partAudioCacheStatus, setPartAudioCacheStatus] = useState<Record<number, boolean>>({});
  const [auditioningPartIndex, setAuditioningPartIndex] = useState<number | null>(null);
  const [regeneratingPartIndex, setRegeneratingPartIndex] = useState<number | null>(null);

  // Inline Part Customization State
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSpeechText, setEditSpeechText] = useState<string>('');
  const [isSavingPart, setIsSavingPart] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const topic1Parts = useMemo(() => parts.filter(p => p.topic_number === 1), [parts]);
  const topic2Parts = useMemo(() => parts.filter(p => p.topic_number === 2), [parts]);
  const hasTwoTopics = topic1Parts.length > 0 && topic2Parts.length > 0;

  const topic1Title = topic1Parts[0]?.topic_title || 'Topic 1';
  const topic2Title = topic2Parts[0]?.topic_title || 'Topic 2';

  const displayedParts = useMemo(() => {
    if (!hasTwoTopics || selectedTopicFilter === 'ALL') return parts;
    return parts.filter(p => p.topic_number === selectedTopicFilter);
  }, [parts, hasTwoTopics, selectedTopicFilter]);
  // Check cache status for parts on mount or voice change
  const checkPartsCache = useCallback(async () => {
    const status: Record<number, boolean> = {};
    for (const part of parts) {
      const effectivePartNum = part.part_in_topic || part.part_index;
      status[part.part_index] = await isPartAudioCached(
        part.raw_part || part.title,
        selectedVoice,
        effectivePartNum,
        courseLevel
      );
    }
    setPartAudioCacheStatus(status);
  }, [parts, selectedVoice, courseLevel]);

  useEffect(() => {
    if (isOpen) {
      checkPartsCache();
    }
  }, [isOpen, checkPartsCache]);

  useEffect(() => {
    if (!isOpen) {
      setEditingPartIndex(null);
      setSaveToast(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (saveToast) {
      const timer = setTimeout(() => {
        setSaveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  useEffect(() => {
    const handleOverridesUpdated = () => {
      checkPartsCache();
    };
    window.addEventListener('chunks:part-overrides-updated', handleOverridesUpdated);
    return () => {
      window.removeEventListener('chunks:part-overrides-updated', handleOverridesUpdated);
    };
  }, [checkPartsCache]);

  const handleAudition = async (e: React.MouseEvent, part: LessonPart) => {
    e.stopPropagation();
    if (auditioningPartIndex !== null || regeneratingPartIndex !== null || isSavingPart) return;
    setAuditioningPartIndex(part.part_index);
    try {
      const effectivePartNum = part.part_in_topic || part.part_index;
      await playPartIntro(
        part.raw_part || part.title,
        effectivePartNum,
        selectedVoice,
        courseLevel
      );
      setPartAudioCacheStatus(prev => ({ ...prev, [part.part_index]: true }));
    } catch (err) {
      console.warn('[PartsDrawer] Failed to play part intro:', err);
    } finally {
      setAuditioningPartIndex(null);
    }
  };

  const handleRegenerate = async (e: React.MouseEvent, part: LessonPart) => {
    e.stopPropagation();
    if (auditioningPartIndex !== null || regeneratingPartIndex !== null || isSavingPart) return;
    setRegeneratingPartIndex(part.part_index);
    try {
      const effectivePartNum = part.part_in_topic || part.part_index;
      await regeneratePartAudio(
        part.raw_part || part.title,
        effectivePartNum,
        selectedVoice,
        courseLevel
      );
      setPartAudioCacheStatus(prev => ({ ...prev, [part.part_index]: true }));
    } catch (err) {
      console.warn('[PartsDrawer] Failed to regenerate part audio:', err);
    } finally {
      setRegeneratingPartIndex(null);
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, part: LessonPart) => {
    e.stopPropagation();
    const effectiveLevel = courseLevel || 'LEVEL_A';
    const overrides = getPartOverrides(effectiveLevel);
    const effectivePartNum = part.part_in_topic || part.part_index;
    const existing = findPartOverride(overrides, part.raw_part || part.title, effectivePartNum);

    setEditingPartIndex(part.part_index);
    setEditTitle(existing?.titleEn || part.title);
    setEditSpeechText(
      existing?.speechText || getPartSpeechText(part.raw_part || part.title, effectivePartNum, courseLevel)
    );
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPartIndex(null);
    setEditTitle('');
    setEditSpeechText('');
  };

  const handleSaveEdit = async (
    e: React.MouseEvent,
    part: LessonPart,
    generateAudio: boolean
  ) => {
    e.stopPropagation();
    const newTitle = editTitle.trim();
    const newSpeech = editSpeechText.trim();
    if (!newTitle || !newSpeech) {
      setSaveToast({ type: 'error', message: 'Tiêu đề Part và TTS Speech Text không được để trống.' });
      return;
    }

    setIsSavingPart(true);
    try {
      const effectiveLevel = courseLevel || 'LEVEL_A';
      const existing = getPartOverrides(effectiveLevel);
      const effectivePartNum = part.part_in_topic || part.part_index;
      const existingOverride = findPartOverride(existing, part.raw_part || part.title, effectivePartNum);

      const partKey = part.part_key
        || existingOverride?.key
        || deriveCanonicalPartKey(part.raw_part || part.title, effectivePartNum);

      const overrideObj: PartOverride = {
        key: partKey,
        partNumber: effectivePartNum,
        titleEn: newTitle,
        speechText: newSpeech,
        titleVi: existingOverride?.titleVi
      };

      const updatedOverrides: Record<string, PartOverride> = {
        ...existing,
        [partKey]: overrideObj
      };

      await savePartOverrides(effectiveLevel, updatedOverrides);

      if (generateAudio) {
        const voiceEn = selectedVoice || modelRegistryService.getMainModelEn();
        await audioPlayer.synthesizeSingleChunk({
          text: newSpeech,
          language: 'en',
          voiceName: voiceEn,
          forceRegenerate: true
        });
        await audioPlayer.playChunk(newSpeech, null, voiceEn, 1.0, true);
        setPartAudioCacheStatus(prev => ({ ...prev, [part.part_index]: true }));
        setSaveToast({ type: 'success', message: `✅ Đã lưu và tạo âm thanh Part "${newTitle}"!` });
      } else {
        const voiceEn = selectedVoice || modelRegistryService.getMainModelEn();
        const cached = await audioPlayer.getCachedAudioAsync(newSpeech, voiceEn);
        setPartAudioCacheStatus(prev => ({ ...prev, [part.part_index]: Boolean(cached) }));
        setSaveToast({ type: 'success', message: `✅ Đã lưu cấu hình Part "${newTitle}"!` });
      }

      setEditingPartIndex(null);
      setEditTitle('');
      setEditSpeechText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[PartsDrawer] Failed to save part override:', err);
      setSaveToast({ type: 'error', message: `Lỗi khi lưu Part: ${msg}` });
    } finally {
      setIsSavingPart(false);
    }
  };

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

        {/* Toast Notification */}
        {saveToast && (
          <div
            className={`mt-2.5 p-2 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs border animate-in fade-in duration-150 ${
              saveToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span className="flex-1 mr-2">{saveToast.message}</span>
            <button
              type="button"
              onClick={() => setSaveToast(null)}
              className="p-0.5 text-zinc-500 hover:text-zinc-700 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Dedicated 0. Grammar & Structures Slide Entry */}
        {onSelectGrammar && (
          <button
            type="button"
            onClick={() => {
              onSelectGrammar();
              onClose();
            }}
            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              isGrammarActive
                ? 'border-[#DC2626] bg-[#DC2626]/[0.05] ring-2 ring-[#DC2626]/20 shadow-xs'
                : 'border-[#E8E8EC] bg-white hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isGrammarActive ? 'bg-[#DC2626] text-white' : 'bg-rose-50 text-[#DC2626] border border-rose-200'
              }`}>
                Phần 0 · Slide 0
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <BookOpen className="w-3 h-3 text-[#DC2626]" />
                <span>No Audio · Briefing</span>
              </span>
            </div>
            <div className="text-sm font-bold text-[#0A0A0A] flex items-center justify-between">
              <span>0. Grammar & Sentence Structures</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Điểm qua các mẫu câu, dạng động từ và ngữ pháp trọng tâm (Phím G)
            </p>
          </button>
        )}

        {displayedParts.map((part) => {
          const isCurrentPart =
            currentChunkIndex >= part.start_index && currentChunkIndex <= part.end_index;
          const audioReady = part.audio_ready_count ?? 0;
          const audioTotal = part.audio_total_count ?? part.chunk_count;
          const isFullAudioReady = audioReady === audioTotal && audioTotal > 0;
          const isPartialAudio = audioReady > 0 && audioReady < audioTotal;

          const isEditing = editingPartIndex === part.part_index;

          return (
              <div
                key={part.part_index}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (isEditing) return;
                  onSelectPart(part.start_index);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (isEditing) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPart(part.start_index);
                    onClose();
                  }
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all select-none ${
                  isEditing
                    ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300/50 shadow-sm cursor-default'
                    : isCurrentPart
                    ? 'border-[#DC2626] bg-[#DC2626]/[0.05] ring-2 ring-[#DC2626]/20 shadow-xs cursor-pointer'
                    : 'border-[#E8E8EC] bg-white hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer'
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

                {!isEditing ? (
                  <>
                    <div className="text-sm font-bold text-[#0A0A0A] flex items-center justify-between">
                      <span>{part.title}</span>
                      {isCurrentPart && (
                        <span className="text-[10px] font-mono font-bold text-[#DC2626] uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Part Intro TTS Speech & Action Controls */}
                    {(() => {
                      const speechText = getPartSpeechText(
                        part.raw_part || part.title,
                        part.part_in_topic || part.part_index,
                        courseLevel
                      );
                      const isCached = partAudioCacheStatus[part.part_index] ?? false;
                      const isAuditioning = auditioningPartIndex === part.part_index;
                      const isRegenerating = regeneratingPartIndex === part.part_index;
                      return (
                        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-col gap-2">
                          <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-[10px] font-mono text-zinc-700 flex items-start gap-1">
                            <span className="text-zinc-400 shrink-0 font-sans">TTS:</span>
                            <span className="font-semibold text-zinc-900 break-words line-clamp-2">"{speechText}"</span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5 pt-0.5">
                            {/* Audio status badge */}
                            {isCached ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Ready / Cached</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                                <span>Live TTS</span>
                              </span>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                 onClick={(e) => handleAudition(e, part)}
                                 disabled={isAuditioning || isRegenerating || isSavingPart}
                                 className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                 title="Nghe Part Intro"
                               >
                                 {isAuditioning ? (
                                   <>
                                     <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                                     <span>Đọc...</span>
                                   </>
                                 ) : (
                                   <>
                                     <Play className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                                     <span>Nghe Intro</span>
                                   </>
                                 )}
                               </button>
                               <button
                                 type="button"
                                 onClick={(e) => handleRegenerate(e, part)}
                                 disabled={isAuditioning || isRegenerating || isSavingPart}
                                 className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold transition-all cursor-pointer border border-zinc-300 disabled:opacity-50"
                                 title="Tạo lại âm thanh Part Intro"
                               >
                                 {isRegenerating ? (
                                   <Loader2 className="w-2.5 h-2.5 animate-spin text-purple-600" />
                                 ) : (
                                   <RotateCw className="w-2.5 h-2.5 text-zinc-600" />
                                 )}
                                 <span>Tạo lại</span>
                               </button>
                               <button
                                 type="button"
                                 onClick={(e) => handleOpenEdit(e, part)}
                                 disabled={isAuditioning || isRegenerating || isSavingPart}
                                 className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold transition-all cursor-pointer border border-amber-300 disabled:opacity-50"
                                 title="Chỉnh sửa Tiêu đề & TTS Speech Text"
                               >
                                 <Edit2 className="w-2.5 h-2.5 text-amber-700" />
                                 <span>Sửa</span>
                               </button>
                             </div>
                           </div>
                         </div>
                       );
                     })()}
                   </>
                 ) : (
                   /* Inline Editor Form */
                   <div
                     onClick={(e) => e.stopPropagation()}
                     className="mt-2.5 pt-2.5 border-t border-amber-200 flex flex-col gap-2.5 cursor-default"
                   >
                     <div>
                       <label className="block text-[10px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                         Tiêu đề Part:
                       </label>
                       <input
                         type="text"
                         value={editTitle}
                         onChange={(e) => setEditTitle(e.target.value)}
                         onClick={(e) => e.stopPropagation()}
                         onKeyDown={(e) => {
                           e.stopPropagation();
                           if (e.key === 'Escape') handleCancelEdit();
                         }}
                         placeholder="VD: Vocabulary Check..."
                         className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                       />
                     </div>

                     <div>
                       <label className="block text-[10px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                         TTS Speech Text:
                       </label>
                       <textarea
                         rows={2}
                         value={editSpeechText}
                         onChange={(e) => setEditSpeechText(e.target.value)}
                         onClick={(e) => e.stopPropagation()}
                         onKeyDown={(e) => {
                           e.stopPropagation();
                           if (e.key === 'Escape') handleCancelEdit();
                         }}
                         placeholder="VD: Part 1. Vocabulary."
                         className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none shadow-2xs"
                       />
                     </div>

                     <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                       <button
                         type="button"
                         onClick={handleCancelEdit}
                         disabled={isSavingPart}
                         className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold transition-all cursor-pointer border border-zinc-300 disabled:opacity-50"
                       >
                         Hủy
                       </button>
                       <button
                         type="button"
                         onClick={(e) => handleSaveEdit(e, part, false)}
                         disabled={isSavingPart || !editTitle.trim() || !editSpeechText.trim()}
                         className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                         title="Lưu cấu hình lên Cloud Firestore & đồng bộ Focus Mode"
                       >
                         {isSavingPart ? (
                           <>
                             <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                             <span>Đang lưu...</span>
                           </>
                         ) : (
                           <>
                             <Save className="w-2.5 h-2.5 text-amber-400" />
                             <span>💾 Lưu Cấu Hình</span>
                           </>
                         )}
                       </button>
                       <button
                         type="button"
                         onClick={(e) => handleSaveEdit(e, part, true)}
                         disabled={isSavingPart || !editTitle.trim() || !editSpeechText.trim()}
                         className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[10px] font-extrabold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                         title="Lưu cấu hình và tổng hợp âm thanh TTS ngay lập tức"
                       >
                         {isSavingPart ? (
                           <>
                             <Loader2 className="w-2.5 h-2.5 animate-spin text-zinc-950" />
                             <span>Đang xử lý...</span>
                           </>
                         ) : (
                           <>
                             <Zap className="w-2.5 h-2.5 text-zinc-950 fill-current" />
                             <span>⚡ Lưu & Tạo Audio Ngay</span>
                           </>
                         )}
                       </button>
                     </div>
                   </div>
                )}

                {/* Chunk range info */}
                <div className="text-[11px] font-mono text-[#6B6B6B] mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-zinc-400" />
                    Chunks #{part.start_index + 1} – #{part.end_index + 1}
                  </span>
                  <span>
                    {part.chunk_count} {part.chunk_count === 1 ? 'chunk' : 'chunks'}
                  </span>
                </div>
              </div>
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
