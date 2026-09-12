import React from 'react';
import { LessonGrammar } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
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
    <div className={`w-full h-full flex flex-col justify-between p-3 sm:p-5 font-sans transition-colors overflow-hidden select-none animate-fade-in ${
      highContrastDark ? 'text-white' : 'text-[#0A0A0A]'
    }`}>
      {/* 1. Header Section */}
      <div 
        className="space-y-1.5 shrink-0 border-b pb-2 sm:pb-3 transition-colors"
        style={{ borderColor: highContrastDark ? '#27272A' : '#E4E4E7' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Badges Left */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] border border-rose-200 dark:border-rose-800/80 shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>GRAMMAR OVERVIEW</span>
            </span>
          </div>

          {/* Day & Slide indicator Right */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white shadow-xs">
              Slide 0 · Grammar
            </span>
            {dayNumber !== undefined && (
              <span className={`px-2.5 py-1 rounded-lg border shadow-xs ${
                highContrastDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}>
                Day {dayNumber}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="pt-0.5 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight">
            {lessonTitle || 'Grammar & Core Sentence Structures'}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 font-medium ${
            highContrastDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Target sentence patterns, verb collocations & grammatical structures.
          </p>
        </div>
      </div>

      {/* 2. Main Content Stage (3 Cards / Columns or Empty Placeholder) */}
      <div className="flex-1 min-h-0 my-2 sm:my-3 w-full flex flex-col justify-center">
        {!hasContent ? (
          <div className={`max-w-md mx-auto p-6 rounded-2xl border-2 border-dashed text-center space-y-3 ${
            highContrastDark 
              ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' 
              : 'bg-zinc-50/80 border-zinc-200 text-zinc-600'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-zinc-900 dark:text-zinc-100">
              Grammar Overview
            </h3>
            <p className="text-sm leading-relaxed max-w-sm mx-auto">
              No specific grammar notes recorded for this topic. Ready for Chunk drill.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 w-full h-full max-h-full items-stretch">
            {/* Column 1: Sentence Structures */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between h-full min-h-0 overflow-hidden shadow-md transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-blue-600 dark:text-blue-300">
                    SENTENCE STRUCTURES
                  </h3>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 scrollbar-thin pt-2">
                {sentenceStructures.length > 0 ? (
                  sentenceStructures.map((struct, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 sm:p-3 rounded-xl border text-sm sm:text-base lg:text-lg font-bold font-mono leading-snug text-left flex items-start gap-2.5 transition-all ${
                        highContrastDark 
                          ? 'bg-zinc-900/90 border-blue-500/30 text-blue-100 shadow-md' 
                          : 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-xs'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-xs" />
                      <span className="break-words leading-snug">{struct}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs sm:text-sm text-zinc-400 italic py-2">
                    (No specialized sentence structures)
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono font-medium text-zinc-400 shrink-0">
                {sentenceStructures.length} key {sentenceStructures.length === 1 ? 'structure' : 'structures'}
              </div>
            </div>

            {/* Column 2: Verb Forms & Phrases */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between h-full min-h-0 overflow-hidden shadow-md transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                    VERB FORMS & PHRASES
                  </h3>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin pt-2">
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {verbForms.length > 0 ? (
                    verbForms.map((vf, idx) => (
                      <span 
                        key={idx}
                        className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm lg:text-base font-bold font-mono inline-flex items-center gap-2 shadow-xs transition-all ${
                          highContrastDark 
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-100 shadow-md' 
                            : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="break-words">{vf}</span>
                      </span>
                    ))
                  ) : (
                    <div className="text-xs sm:text-sm text-zinc-400 italic py-2">
                      (Standard verb forms)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono font-medium text-zinc-400 shrink-0">
                {verbForms.length} verb {verbForms.length === 1 ? 'phrase' : 'phrases'}
              </div>
            </div>

            {/* Column 3: Tenses & Patterns */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between h-full min-h-0 overflow-hidden shadow-md transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                    TENSES & PATTERNS
                  </h3>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 scrollbar-thin pt-2">
                {tenses.length > 0 ? (
                  tenses.map((tense, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm lg:text-base font-bold font-mono flex items-center gap-2.5 text-left transition-all ${
                        highContrastDark 
                          ? 'bg-purple-950/30 border-purple-700/60 text-purple-100 shadow-md' 
                          : 'bg-purple-50/80 border-purple-300 text-purple-950 shadow-xs'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 shadow-xs" />
                      <span className="break-words">{tense}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs sm:text-sm text-zinc-400 italic py-2">
                    (Natural tenses & patterns)
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono font-medium text-zinc-400 shrink-0">
                {tenses.length} grammar {tenses.length === 1 ? 'pattern' : 'patterns'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div 
        className="pt-2 sm:pt-3 border-t shrink-0 transition-colors"
        style={{ borderColor: highContrastDark ? '#27272A' : '#E4E4E7' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Keyboard reminder pill */}
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border shadow-2xs"
            style={{
              backgroundColor: highContrastDark ? '#18181B' : '#F4F4F5',
              borderColor: highContrastDark ? '#27272A' : '#E4E4E7',
              color: highContrastDark ? '#A1A1AA' : '#71717A'
            }}
          >
            <Keyboard className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>
              Press 'G' to toggle Grammar · Press Space / Next on clicker to begin
            </span>
          </div>

          {/* Start Drill Button */}
          <button
            type="button"
            onClick={onStartDrill}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base font-black rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer active:scale-95 animate-pulse"
          >
            <span>START CHUNKS DRILL (SPACE / NEXT ➔)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
