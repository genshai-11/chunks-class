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
    <div className={`w-full h-full flex flex-col justify-between p-6 sm:p-10 font-sans transition-colors animate-fade-in ${
      highContrastDark ? 'text-white' : 'text-[#0A0A0A]'
    }`}>
      {/* 1. Header Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 transition-colors"
          style={{ borderColor: highContrastDark ? '#27272A' : '#E4E4E7' }}
        >
          {/* Badges Left */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] border border-rose-200 dark:border-rose-800/80 shadow-xs">
              <BookOpen className="w-4 h-4" />
              <span>TỔNG QUAN NGỮ PHÁP · GRAMMAR OVERVIEW</span>
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
              Slide 0 (Briefing)
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
        <div className="pt-2">
          <div className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#DC2626] mb-1.5">
            Mục tiêu ngữ pháp bài giảng
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            {lessonTitle || 'Grammar & Core Sentence Patterns'}
          </h1>
          <p className={`text-sm sm:text-base mt-1.5 max-w-3xl ${
            highContrastDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Giáo viên điểm qua các cấu trúc trọng tâm trước khi bước vào luyện phản xạ Chunks.
          </p>
        </div>
      </div>

      {/* 2. Main Content Stage (3 Cards / Columns or Empty Placeholder) */}
      <div className="my-auto py-6">
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
              Chưa có cấu trúc ngữ pháp bổ trợ cho chủ đề này
            </h3>
            <p className="text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
              Chưa có cấu trúc ngữ pháp bổ trợ cho chủ đề này. Giáo viên có thể bắt đầu phần luyện tập Chunks ngay.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Column 1: Sentence Structures */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                      Cấu trúc câu
                    </h3>
                    <span className="text-xs sm:text-sm font-mono text-zinc-400">Sentence Structures</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {sentenceStructures.length > 0 ? (
                    sentenceStructures.map((struct, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 sm:p-5 rounded-2xl border text-lg sm:text-2xl font-bold font-mono leading-relaxed transition-all ${
                          highContrastDark 
                            ? 'bg-zinc-900/90 border-zinc-800/80 text-blue-200 shadow-xs' 
                            : 'bg-blue-50/70 border-blue-200/80 text-blue-950 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2 sm:mt-2.5" />
                          <span className="break-words">{struct}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-base sm:text-lg text-zinc-400 italic py-3">
                      (Không yêu cầu cấu trúc đặc biệt)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm font-mono font-medium text-zinc-400">
                {sentenceStructures.length} mẫu câu trọng tâm
              </div>
            </div>

            {/* Column 2: Verb Forms & Key Collocations */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                      Dạng động từ & Cụm từ
                    </h3>
                    <span className="text-xs sm:text-sm font-mono text-zinc-400">Verb Forms & Collocations</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {verbForms.length > 0 ? (
                    verbForms.map((vf, idx) => (
                      <span 
                        key={idx}
                        className={`inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-base sm:text-xl font-bold border shadow-xs transition-all ${
                          highContrastDark 
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
                            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                        <span className="break-words">{vf}</span>
                      </span>
                    ))
                  ) : (
                    <div className="text-base sm:text-lg text-zinc-400 italic py-3">
                      (Động từ dạng thông thường)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm font-mono font-medium text-zinc-400">
                {verbForms.length} dạng động từ & collocations
              </div>
            </div>

            {/* Column 3: Tenses & Grammar Focus */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                      Thì & Điểm ngữ pháp
                    </h3>
                    <span className="text-xs sm:text-sm font-mono text-zinc-400">Tenses & Grammar Focus</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {tenses.length > 0 ? (
                    tenses.map((tense, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border text-base sm:text-xl font-extrabold flex items-center gap-3 transition-all ${
                          highContrastDark 
                            ? 'bg-purple-950/30 border-purple-800/60 text-purple-200 shadow-xs' 
                            : 'bg-purple-50/80 border-purple-200 text-purple-950 shadow-xs'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500 shrink-0" />
                        <span className="break-words">{tense}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-base sm:text-lg text-zinc-400 italic py-3">
                      (Các thì ngữ pháp tự nhiên)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm font-mono font-medium text-zinc-400">
                {tenses.length} điểm ngữ pháp chính
              </div>
            </div>
          </div>
        )}

        {/* Optional Teacher Notes Callout */}
        {grammar?.notes && (
          <div className={`mt-6 max-w-5xl mx-auto p-4 sm:p-5 rounded-2xl border text-sm sm:text-base leading-relaxed flex items-start gap-3 shadow-xs ${
            highContrastDark 
              ? 'bg-amber-950/20 border-amber-800/50 text-amber-200' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-mono uppercase tracking-wider mr-2 text-xs sm:text-sm">Lưu ý giáo viên:</span>
              <span>{grammar.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div className="pt-4 border-t space-y-3 transition-colors"
        style={{ borderColor: highContrastDark ? '#27272A' : '#E4E4E7' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Keyboard reminder pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-mono border shadow-2xs"
            style={{
              backgroundColor: highContrastDark ? '#18181B' : '#F4F4F5',
              borderColor: highContrastDark ? '#27272A' : '#E4E4E7',
              color: highContrastDark ? '#A1A1AA' : '#71717A'
            }}
          >
            <Keyboard className="w-4 h-4 text-[#DC2626]" />
            <span>
              Phím <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">G</kbd>: Xem lại Ngữ pháp &nbsp;|&nbsp; <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">PageDown</kbd>: Tiếp tục
            </span>
          </div>

          {/* Start Drill Button */}
          <button
            type="button"
            onClick={onStartDrill}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-base sm:text-lg font-bold rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 animate-pulse"
          >
            <span>Bắt đầu Luyện tập Chunks (Space / Clicker Next)</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
