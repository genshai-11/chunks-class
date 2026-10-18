import React, { useState, useEffect, useMemo } from 'react';
import { LessonDoc, Course } from '../types';
import { 
  X, 
  Check, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  SlidersHorizontal, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Layers,
  Wand2,
  FileText,
  Hash
} from 'lucide-react';
import { batchUpdateLessons } from '../services/firestoreService';

interface CourseLessonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  lessons: LessonDoc[];
  onLessonsUpdated: (updatedLessons: LessonDoc[]) => void;
}

interface EditableLessonRow {
  id: string;
  day_number: number;
  original_day_number: number;
  original_lesson_title: string;
  display_title: string;
  is_active: boolean;
  chunks_count: number;
  lesson_type: string;
  categories: string[];
}

export const CourseLessonManagerModal: React.FC<CourseLessonManagerModalProps> = ({
  isOpen,
  onClose,
  course,
  lessons,
  onLessonsUpdated
}) => {
  const [rows, setRows] = useState<EditableLessonRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [filterText, setFilterText] = useState('');

  // Initialize editable rows from passed lessons
  useEffect(() => {
    if (isOpen && lessons.length > 0) {
      const mapped: EditableLessonRow[] = [...lessons]
        .sort((a, b) => a.day_number - b.day_number)
        .map(l => ({
          id: l.id,
          day_number: l.day_number,
          original_day_number: l.day_number,
          original_lesson_title: l.lesson_title || '',
          display_title: l.display_title ?? l.lesson_title ?? '',
          is_active: l.is_active !== false,
          chunks_count: l.chunks?.length || l.total_chunks || 0,
          lesson_type: l.lesson_type || 'Standard Lesson',
          categories: l.categories || []
        }));
      setRows(mapped);
      setSaveStatus(null);
    }
  }, [isOpen, lessons]);

  const activeCount = useMemo(() => rows.filter(r => r.is_active).length, [rows]);
  const totalCount = rows.length;

  if (!isOpen) return null;

  // Helper to re-sequence active rows in place
  const resequenceRows = (targetRows: EditableLessonRow[]): EditableLessonRow[] => {
    let currentDay = 1;
    return targetRows.map(r => {
      if (!r.is_active) {
        return { ...r, day_number: 0 };
      }
      const assignedDay = currentDay++;
      let newTitle = r.display_title;
      if (/^Day\s*\d+\s*[-:]\s*/i.test(newTitle)) {
        newTitle = newTitle.replace(/^Day\s*\d+\s*[-:]\s*/i, `Day ${assignedDay} - `);
      } else if (/^Lesson\s*\d+/i.test(newTitle)) {
        newTitle = `Day ${assignedDay} - ${newTitle}`;
      }
      return {
        ...r,
        day_number: assignedDay,
        display_title: newTitle
      };
    });
  };

  // Toggle single row is_active with automatic sequence adjustment
  const handleToggleRow = (id: string) => {
    setRows(prev => {
      const toggled = prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r);
      return resequenceRows(toggled);
    });
  };

  // Change title of single row
  const handleTitleChange = (id: string, newTitle: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, display_title: newTitle } : r));
  };

  // Change day number of single row
  const handleDayNumberChange = (id: string, newDay: number) => {
    const val = isNaN(newDay) ? 0 : Math.max(0, Math.min(99, Math.floor(newDay)));
    setRows(prev => prev.map(r => r.id === id ? { ...r, day_number: val } : r));
  };

  // Preset 1: Enable all lessons and resequence
  const handleEnableAll = () => {
    setRows(prev => resequenceRows(prev.map(r => ({ ...r, is_active: true }))));
  };

  // Preset 2: Disable Day 0 & Day 1 and auto re-index remaining active lessons starting from Day 1
  const handleDisableDay0And1 = () => {
    setRows(prev => {
      const updated = prev.map(r => {
        const isIntro = r.original_day_number === 0 || r.original_day_number === 1 || 
          r.id.toLowerCase().includes('day_0') || 
          r.id.toLowerCase().includes('word_list') ||
          r.original_lesson_title.toLowerCase().includes('word list') ||
          r.original_lesson_title.toLowerCase().includes('orientation');
        return isIntro ? { ...r, is_active: false } : r;
      });
      return resequenceRows(updated);
    });
  };

  // Preset 2b: Auto Re-index Active Lessons (Day 1, 2, 3...)
  const handleAutoReindexActive = () => {
    setRows(prev => resequenceRows(prev));
  };

  // Preset 3: Enable Day 0 & Day 1
  const handleEnableDay0And1 = () => {
    setRows(prev => {
      const updated = prev.map(r => {
        const isIntro = r.original_day_number === 0 || r.original_day_number === 1 || 
          r.id.toLowerCase().includes('day_0') || 
          r.id.toLowerCase().includes('word_list');
        return isIntro ? { ...r, is_active: true } : r;
      });
      return resequenceRows(updated);
    });
  };

  // Preset 4: Format Lesson X instead of Day X
  // E.g. "Day 2 - Lesson 1 How to survive" -> "Lesson 1: How to survive"
  // E.g. "Day 3 - Lesson 2 Personal info" -> "Lesson 2: Personal info"
  // E.g. "Day 1 - Orientation" -> "Orientation"
  const handleFormatLessonTitlePreset = () => {
    setRows(prev => prev.map(r => {
      let t = r.original_lesson_title;
      // Match pattern like "Day 2 - Lesson 1 How to survive" or "Day 3 - Lesson 2..."
      const match = t.match(/Day\s*\d+\s*[-:]\s*(Lesson\s*\d+)\s*[-:]?\s*(.*)/i);
      if (match) {
        const lessonPart = match[1];
        const restPart = match[2]?.trim();
        t = restPart ? `${lessonPart}: ${restPart}` : lessonPart;
      } else {
        // Strip leading "Day \d+ - " if no Lesson X
        t = t.replace(/^Day\s*\d+\s*[-:]\s*/i, '');
      }
      return { ...r, display_title: t.trim() };
    }));
  };

  // Preset 5: Reset to default
  const handleResetToDefault = () => {
    const rawMap = new Map<string, LessonDoc>(lessons.map(l => [l.id, l]));
    setRows(prev => prev.map(r => {
      const original = rawMap.get(r.id);
      return {
        ...r,
        day_number: original?.day_number ?? r.original_day_number,
        display_title: original?.lesson_title || r.original_lesson_title,
        is_active: true
      };
    }));
  };

  // Save changes to Firestore
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const rowsMap = new Map<string, EditableLessonRow>(rows.map(r => [r.id, r]));
      const updatedLessonDocs: LessonDoc[] = lessons.map(lesson => {
        const edited = rowsMap.get(lesson.id);
        if (!edited) return lesson;
        const finalTitle = edited.display_title.trim() || lesson.lesson_title;
        return {
          ...lesson,
          day_number: edited.day_number,
          display_title: finalTitle,
          lesson_title: finalTitle,
          is_active: Boolean(edited.is_active)
        };
      });

      const res = await batchUpdateLessons(updatedLessonDocs);
      if (res.success) {
        setSaveStatus({
          success: true,
          message: "✅ ĐÃ LƯU THÀNH CÔNG LÊN CLOUD FIRESTORE! Đã cập nhật bài học và tự động đồng bộ Lịch dạy (Cohorts) trên Cloud cho mọi thiết bị."
        });
        onLessonsUpdated(updatedLessonDocs);
        setTimeout(() => {
          onClose();
        }, 3500);
      } else {
        setSaveStatus({ success: false, message: `Lỗi lưu Firestore: ${res.error}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus({ success: false, message: `Lỗi không xác định: ${msg}` });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRows = rows.filter(r => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      r.day_number.toString().includes(q) ||
      r.display_title.toLowerCase().includes(q) ||
      r.original_lesson_title.toLowerCase().includes(q) ||
      r.lesson_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Quản lý Bài học & Index Khóa học</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {course?.title || 'Course Index Manager'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bật/Tắt bài học hiển thị (is_active) và tùy chỉnh tiêu đề Day / Lesson linh hoạt cho giảng viên.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Top Status Notification Banner */}
        {saveStatus && (
          <div className={`px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold shrink-0 border-b animate-in fade-in duration-150 ${
            saveStatus.success 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {saveStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="truncate">{saveStatus.message}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                Đóng modal (Close)
              </button>
              <button
                type="button"
                onClick={() => setSaveStatus(null)}
                className="p-1 rounded hover:bg-black/5 text-zinc-500 hover:text-zinc-800 cursor-pointer"
                title="Ẩn thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}


        {/* Action Presets Toolbar */}
        <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5 text-red-600" />
              Presets:
            </span>
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 hover:border-emerald-500 hover:text-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Bật tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={handleAutoReindexActive}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 hover:border-red-500 hover:text-red-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Đánh lại số Day 1, 2, 3... liên tiếp cho toàn bộ bài học đang Bật, bài học tắt về Day 0"
            >
              <Hash className="w-3.5 h-3.5 text-red-600" />
              ⚡ Đánh lại số Day (Auto Re-index Active)
            </button>
            <button
              type="button"
              onClick={handleDisableDay0And1}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 hover:border-amber-500 hover:text-amber-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Tắt Day 0 (Word list) và Day 1 (Orientation), tự động đánh số bài tiếp theo bắt đầu từ Day 1"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
              Tắt Day 0 & Day 1 (Re-index)
            </button>
            <button
              type="button"
              onClick={handleEnableDay0And1}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 hover:border-blue-500 hover:text-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Bật Day 0 & Day 1
            </button>
            <button
              type="button"
              onClick={handleFormatLessonTitlePreset}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 hover:border-purple-500 hover:text-purple-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Format: Đổi 'Day 2 - Lesson 1 How to survive' thành 'Lesson 1: How to survive'"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              Format: Lesson X thay vì Day X
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-600 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              Khôi phục gốc
            </button>
          </div>

          {/* Status summary */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activeCount} / {totalCount} bài học đang bật
            </span>
          </div>
        </div>

        {/* Filter input */}
        <div className="px-6 py-2.5 bg-white border-b border-zinc-100 flex items-center justify-between gap-3 shrink-0">
          <input
            type="text"
            placeholder="Lọc nhanh danh sách bài học theo Day, tiêu đề, loại bài..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-red-600"
          />
          <div className="text-[11px] text-zinc-500 italic">
            * Nhấn lưu để áp dụng thay đổi vào Firestore & Projector
          </div>
        </div>

        {/* Lessons Table Container */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-mono text-[11px] sticky top-0 bg-white z-10">
                <th className="py-2.5 px-3 w-16 text-center">Day</th>
                <th className="py-2.5 px-3 w-24 text-center">Kích hoạt</th>
                <th className="py-2.5 px-3">Tiêu đề hiển thị (Display Title)</th>
                <th className="py-2.5 px-3 w-48">Tiêu đề gốc (Original)</th>
                <th className="py-2.5 px-3 w-28 text-center">Chunks</th>
                <th className="py-2.5 px-3 w-32 text-center">Thể loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans">
              {filteredRows.map((row) => (
                <tr 
                  key={row.id} 
                  className={`transition-colors ${
                    row.is_active 
                      ? 'hover:bg-zinc-50/80 bg-white' 
                      : 'bg-zinc-50/50 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* Day Number (Interactive Input) */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[11px] font-mono text-zinc-400 font-semibold">D</span>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={row.day_number}
                        onChange={(e) => handleDayNumberChange(row.id, parseInt(e.target.value, 10))}
                        className="w-13 px-1.5 py-1 text-center font-mono font-bold text-xs bg-zinc-100 hover:bg-zinc-200/80 focus:bg-white text-zinc-800 border border-zinc-200 focus:border-red-600 rounded-lg focus:outline-none transition-all shadow-2xs"
                        title={`Day ${row.day_number} (Gốc: Day ${row.original_day_number})`}
                      />
                    </div>
                  </td>

                  {/* Active Toggle Switch */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRow(row.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        row.is_active ? 'bg-emerald-600' : 'bg-zinc-300'
                      }`}
                      title={row.is_active ? 'Bài đang BẬT (click để Tắt)' : 'Bài đang TẮT (click để Bật)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          row.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="text-[10px] font-bold mt-0.5">
                      {row.is_active ? (
                        <span className="text-emerald-700">Bật</span>
                      ) : (
                        <span className="text-zinc-500">Tắt</span>
                      )}
                    </div>
                  </td>

                  {/* Editable Display Title */}
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={row.display_title}
                      onChange={(e) => handleTitleChange(row.id, e.target.value)}
                      placeholder={row.original_lesson_title}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-red-600 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-none transition-all shadow-2xs"
                    />
                  </td>

                  {/* Original Title Reference */}
                  <td className="py-3 px-3 text-zinc-500 truncate max-w-[200px]" title={row.original_lesson_title}>
                    <span className="text-[11px] font-mono">{row.original_lesson_title}</span>
                  </td>

                  {/* Chunks Count */}
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold text-[11px]">
                      {row.chunks_count} chunks
                    </span>
                  </td>

                  {/* Lesson Type */}
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                      {row.lesson_type}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                    Không tìm thấy bài học nào phù hợp với từ khóa lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
            {saveStatus && (
              <div className={`flex items-center justify-between gap-3 font-semibold px-3.5 py-2 rounded-xl border flex-1 shadow-xs ${
                saveStatus.success 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                  : 'bg-red-50 text-red-900 border-red-300'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {saveStatus.success ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold leading-tight">{saveStatus.message}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Xong & Đóng
                </button>
              </div>
            )}
            {!saveStatus && (
              <span className="text-zinc-500">
                Các bài học bị tắt sẽ không xuất hiện trong Session Recurrence & Classroom Focus.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi ({rows.length} bài)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
