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
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] border border-rose-200 dark:border-rose-800/80 shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>TỔNG QUAN NGỮ PHÁP · GRAMMAR OVERVIEW</span>
            </span>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border shadow-xs ${
              highContrastDark 
                ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700' 
                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
              <span>TEACHER BRIEFING · NO AUDIO</span>
            </span>
          </div>

          {/* Day & Slide indicator Right */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white">
              Slide 0 (Briefing)
            </span>
            {dayNumber !== undefined && (
              <span className={`px-2.5 py-1 rounded-lg border ${
                highContrastDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}>
                Day {dayNumber}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="pt-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#DC2626] mb-1">
            Mục tiêu ngữ pháp bài giảng
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
            {lessonTitle || 'Grammar & Core Sentence Patterns'}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${
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
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
              Chưa có cấu trúc ngữ pháp bổ trợ cho chủ đề này
            </h3>
            <p className="text-xs leading-relaxed max-w-md mx-auto">
              Chưa có cấu trúc ngữ pháp bổ trợ cho chủ đề này. Giáo viên có thể bắt đầu phần luyện tập Chunks ngay.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* Column 1: Sentence Structures */}
            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Cấu trúc câu
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">Sentence Structures</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {sentenceStructures.length > 0 ? (
                    sentenceStructures.map((struct, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border text-xs leading-relaxed font-semibold transition-all ${
                          highContrastDark 
                            ? 'bg-zinc-900/90 border-zinc-800/80 text-blue-300' 
                            : 'bg-blue-50/50 border-blue-100 text-blue-950'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          <span className="font-mono text-[13px]">{struct}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-2">
                      (Không yêu cầu cấu trúc đặc biệt)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-400">
                {sentenceStructures.length} mẫu câu trọng tâm
              </div>
            </div>

            {/* Column 2: Verb Forms & Key Collocations */}
            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Dạng động từ & Cụm từ
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">Verb Forms & Collocations</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {verbForms.length > 0 ? (
                    verbForms.map((vf, idx) => (
                      <span 
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs transition-all ${
                          highContrastDark 
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{vf}</span>
                      </span>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-2">
                      (Động từ dạng thông thường)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-400">
                {verbForms.length} dạng động từ & collocations
              </div>
            </div>

            {/* Column 3: Tenses & Grammar Focus */}
            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
              highContrastDark 
                ? 'bg-[#121216] border-zinc-800 hover:border-zinc-700' 
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Thì & Điểm ngữ pháp
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">Tenses & Grammar Focus</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {tenses.length > 0 ? (
                    tenses.map((tense, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                          highContrastDark 
                            ? 'bg-purple-950/30 border-purple-800/60 text-purple-200' 
                            : 'bg-purple-50/70 border-purple-200/70 text-purple-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <span>{tense}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-2">
                      (Các thì ngữ pháp tự nhiên)
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-400">
                {tenses.length} điểm ngữ pháp chính
              </div>
            </div>
          </div>
        )}

        {/* Optional Teacher Notes Callout */}
        {grammar?.notes && (
          <div className={`mt-5 max-w-4xl mx-auto p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            highContrastDark 
              ? 'bg-amber-950/20 border-amber-800/50 text-amber-200' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-mono uppercase tracking-wider mr-1">Lưu ý giáo viên:</span>
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border shadow-2xs"
            style={{
              backgroundColor: highContrastDark ? '#18181B' : '#F4F4F5',
              borderColor: highContrastDark ? '#27272A' : '#E4E4E7',
              color: highContrastDark ? '#A1A1AA' : '#71717A'
            }}
          >
            <Keyboard className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>
              Phím <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">G</kbd>: Xem lại Ngữ pháp bất kỳ lúc nào &nbsp;|&nbsp; <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">PageDown</kbd>: Tiếp tục
            </span>
          </div>

          {/* Start Drill Button */}
          <button
            type="button"
            onClick={onStartDrill}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 animate-pulse"
          >
            <span>Bắt đầu Luyện tập Chunks (Space / Clicker Next)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
