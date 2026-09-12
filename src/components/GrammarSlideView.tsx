import React from 'react';
import { LessonGrammar } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  VolumeX, 
  FileText,
  Keyboard,
  Info
} from 'lucide-react';

export interface GrammarSlideViewProps {
  grammar?: LessonGrammar | null;
  lessonTitle: string;
  dayNumber?: number;
  highContrastDark?: boolean;
  onStartDrill: () => void;
}

export const GrammarSlideView: React.FC<GrammarSlideViewProps> = ({
  grammar,
  lessonTitle,
  dayNumber,
  highContrastDark = false,
  onStartDrill
}) => {
  const sentenceStructures = grammar?.sentence_structures || [];
  const verbForms = grammar?.verb_forms || [];
  const tenses = grammar?.tense || [];
  const hasContent = sentenceStructures.length > 0 || verbForms.length > 0 || tenses.length > 0;

  return (
    <div className={`w-full h-full flex flex-col justify-between overflow-y-auto p-3 sm:p-6 font-sans transition-colors animate-fade-in ${
      highContrastDark ? 'text-white' : 'text-[#0A0A0A]'
    }`}>
      {/* 1. Header Section */}
      <div className="space-y-2.5 shrink-0">
        <div 
          className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 transition-colors"
          style={{ borderColor: highContrastDark ? '#27272A' : '#E4E4E7' }}
        >
          {/* Badges Left */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] border border-rose-200 dark:border-rose-800/80 shadow-xs">
              <BookOpen className="w-4 h-4" />
              <span>GRAMMAR OVERVIEW</span>
            </span>

            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-medium border shadow-xs ${
              highContrastDark 
                ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700' 
                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              <VolumeX className="w-4 h-4 text-zinc-400" />
              <span>TEACHER BRIEFING · NO AUDIO</span>
            </span>
          </div>

          {/* Day & Slide indicator Right */}
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-[#DC2626] text-white shadow-xs">
              Slide 0 · Briefing
            </span>
            {dayNumber !== undefined && (
              <span className={`px-3 py-1.5 rounded-xl border shadow-xs ${
                highContrastDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}>
                Day {dayNumber}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="pt-1 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display">
            {lessonTitle || 'Grammar & Core Sentence Structures'}
          </h1>
          <p className={`text-base sm:text-lg mt-2 max-w-5xl font-medium ${
            highContrastDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Target sentence patterns, verb collocations & grammatical structures.
          </p>
        </div>
      </div>

      {/* 2. Main Content Stage (3 Cards / Columns or Empty Placeholder) */}
      <div className="my-auto py-3 w-full">
        {!hasContent ? (
          <div className={`max-w-2xl mx-auto p-8 rounded-2xl border-2 border-dashed text-center space-y-4 ${
            highContrastDark 
              ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' 
              : 'bg-zinc-50/80 border-zinc-200 text-zinc-600'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Grammar Overview
            </h3>
            <p className="text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
              No specific grammar notes recorded for this topic. Ready for Chunk drill.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-[1600px] mx-auto my-auto py-4">
            {/* Column 1: Sentence Structures */}
            <div className={`p-5 sm:p-7 rounded-3xl border-2 shadow-md flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-blue-600 dark:text-blue-300">
                      SENTENCE STRUCTURES
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {sentenceStructures.length > 0 ? (
                    sentenceStructures.map((struct, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 sm:p-5 rounded-2xl border-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono leading-snug text-left flex items-start gap-3 sm:gap-4 transition-all ${
                          highContrastDark 
                            ? 'bg-zinc-900/90 border-blue-500/30 text-blue-100 shadow-md' 
                            : 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-blue-500 shrink-0 mt-2 shadow-xs" />
                        <span className="break-words leading-snug">{struct}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-base sm:text-lg text-zinc-400 italic py-3">
                      (No specialized sentence structures)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm font-mono font-medium text-zinc-400">
                {sentenceStructures.length} key {sentenceStructures.length === 1 ? 'structure' : 'structures'}
              </div>
            </div>

            {/* Column 2: Verb Forms & Phrases */}
            <div className={`p-5 sm:p-7 rounded-3xl border-2 shadow-md flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                      VERB FORMS & PHRASES
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {verbForms.length > 0 ? (
                    verbForms.map((vf, idx) => (
                      <span 
                        key={idx}
                        className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl border-2 text-lg sm:text-xl lg:text-2xl font-black font-mono inline-flex items-center gap-2.5 sm:gap-3 shadow-sm transition-all ${
                          highContrastDark 
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-100 shadow-md' 
                            : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                        <span className="break-words">{vf}</span>
                      </span>
                    ))
                  ) : (
                    <div className="text-base sm:text-lg text-zinc-400 italic py-3">
                      (Standard verb forms)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm font-mono font-medium text-zinc-400">
                {verbForms.length} verb {verbForms.length === 1 ? 'phrase' : 'phrases'}
              </div>
            </div>

            {/* Column 3: Tenses & Patterns */}
            <div className={`p-5 sm:p-7 rounded-3xl border-2 shadow-md flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                      TENSES & PATTERNS
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {tenses.length > 0 ? (
                    tenses.map((tense, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border-2 text-lg sm:text-xl lg:text-2xl font-black font-mono flex items-center gap-3 sm:gap-3.5 text-left transition-all ${
                          highContrastDark 
                            ? 'bg-purple-950/30 border-purple-700/60 text-purple-100 shadow-md' 
                            : 'bg-purple-50/80 border-purple-300 text-purple-950 shadow-sm'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-purple-500 shrink-0 shadow-xs" />
                        <span className="break-words">{tense}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-base sm:text-lg text-zinc-400 italic py-3">
                      (Natural tenses & patterns)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm font-mono font-medium text-zinc-400">
                {tenses.length} grammar {tenses.length === 1 ? 'pattern' : 'patterns'}
              </div>
            </div>
          </div>
        )}

        {/* Optional Teacher Notes Callout */}
        {grammar?.notes && (
          <div className={`mt-4 max-w-[1600px] mx-auto p-4 sm:p-5 rounded-2xl border-2 text-sm sm:text-base leading-relaxed flex items-start gap-3 shadow-sm w-full ${
            highContrastDark 
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' 
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-black font-mono uppercase tracking-wider mr-2 text-xs sm:text-sm">Teacher Notes:</span>
              <span className="font-medium">{grammar.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div 
        className="pt-3 border-t space-y-2 shrink-0 transition-colors"
        style={{ borderColor: highContrastDark ? '#27272A' : '#E4E4E7' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Keyboard reminder pill */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-mono border shadow-2xs"
            style={{
              backgroundColor: highContrastDark ? '#18181B' : '#F4F4F5',
              borderColor: highContrastDark ? '#27272A' : '#E4E4E7',
              color: highContrastDark ? '#A1A1AA' : '#71717A'
            }}
          >
            <Keyboard className="w-4 h-4 text-[#DC2626]" />
            <span>
              Press 'G' to toggle Grammar · Press Space / Next on clicker to begin
            </span>
          </div>

          {/* Start Drill Button */}
          <button
            type="button"
            onClick={onStartDrill}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base sm:text-xl font-black rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer active:scale-95 animate-pulse"
          >
            <span>START CHUNKS DRILL (SPACE / NEXT ➔)</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
