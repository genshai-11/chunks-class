import React, { useState } from 'react';
import { CourseLevel, ChunkItem, LessonDoc, Course } from '../types';
import { downloadLessonExcelTemplate, parseExcelLessonFile } from '../utils/excelTemplate';
import { saveLessonToFirestore, getCourses } from '../services/firestoreService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { audioPlayer } from '../services/googleTtsService';
import { 
  FileSpreadsheet, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  Play,
  Volume2,
  Trash2,
  Plus,
  Sparkles,
  Loader2
} from 'lucide-react';

interface LessonExcelUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (lessonId: string) => void;
  onStartDrillNow?: (lessonId: string, dayNumber: number) => void;
  availableCourses?: Course[];
}

export const LessonExcelUploader: React.FC<LessonExcelUploaderProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onStartDrillNow,
  availableCourses = []
}) => {
  const [levelCode, setLevelCode] = useState<CourseLevel>('LEVEL_A');
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonType, setLessonType] = useState<string>('Standard Drill Session');
  const [parsedChunks, setParsedChunks] = useState<ChunkItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [prepProgress, setPrepProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [playingChunkId, setPlayingChunkId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    setPrepProgress(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      const chunks = await parseExcelLessonFile(file, levelCode, dayNumber);
      setParsedChunks(chunks);
      if (!lessonTitle) {
        setLessonTitle(`Day ${dayNumber} - ${file.name.replace(/\.[^/.]+$/, "")}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng template chuẩn.');
      setParsedChunks([]);
    }
  };

  const handleChunkChange = (index: number, field: keyof ChunkItem, value: any) => {
    const updated = [...parsedChunks];
    updated[index] = { ...updated[index], [field]: value };
    setParsedChunks(updated);
  };

  const handleDeleteChunk = (index: number) => {
    const updated = parsedChunks.filter((_, i) => i !== index);
    setParsedChunks(updated);
  };

  const handleAddChunk = () => {
    const newChunk: ChunkItem = {
      chunk_id: `chunk_${levelCode.toLowerCase()}_d${dayNumber}_${String(parsedChunks.length + 1).padStart(4, '0')}`,
      item_number: parsedChunks.length + 1,
      category: 'phrase',
      english: '',
      vietnamese: '',
      speaker: null
    };
    setParsedChunks([...parsedChunks, newChunk]);
  };

  const handleBatchSynthesizeAudio = async () => {
    if (parsedChunks.length === 0) return;
    setIsSynthesizing(true);
    setPrepProgress({ current: 0, total: parsedChunks.length, message: 'Bắt đầu tổng hợp âm thanh đa luồng...' });

    try {
      await audioPlayer.prepareChunksAudio(
        parsedChunks,
        'aura-asteria-en',
        'DEEPGRAM_AURA',
        (current, total, message) => {
          setPrepProgress({ current, total, message });
        }
      );
      setSuccessMsg(`Đã chuẩn bị sẵn âm thanh cho ${parsedChunks.length} câu phản xạ!`);
    } catch (err: any) {
      setErrorMsg(`Lỗi khi tổng hợp audio: ${err?.message || String(err)}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePlayPreview = async (chunk: ChunkItem) => {
    if (!chunk.english.trim()) return;
    setPlayingChunkId(chunk.chunk_id);
    try {
      await audioPlayer.playChunk(chunk.english, chunk.audio_url, 'aura-asteria-en', 1.0);
    } catch {
      // ignore
    } finally {
      setPlayingChunkId(null);
    }
  };

  const handleSaveToFirestore = async (launchDrill: boolean = false) => {
    if (parsedChunks.length === 0) {
      setErrorMsg('Chưa có chunk nào để lưu. Vui lòng chọn file Excel hoặc thêm cụm từ.');
      return;
    }

    const invalid = parsedChunks.some(c => !c.english.trim());
    if (invalid) {
      setErrorMsg('Vui lòng điền nội dung tiếng Anh cho tất cả các chunk.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const prefix = String(levelCode).toLowerCase();
      const docId = `${prefix}_day_${dayNumber}`;
      const categories: string[] = Array.from(new Set(parsedChunks.map(c => String(c.category))));

      const courseMeta = curriculumRegistry.getCourse(levelCode);
      const courseId = courseMeta?.id || (String(levelCode).toLowerCase().includes('a') ? 'course_level_a' : 'course_level_b_eres');
      const courseTitle = courseMeta?.title || (levelCode === 'LEVEL_A' ? 'Level A - Foundation English' : 'Level B - Spoken Masterclass');

      const lessonDoc: LessonDoc = {
        id: docId,
        level_code: levelCode,
        course_id: courseId,
        day_number: dayNumber,
        course_title: courseTitle,
        lesson_title: lessonTitle || `Day ${dayNumber} Lesson`,
        lesson_type: lessonType,
        total_chunks: parsedChunks.length,
        categories: categories,
        chunks: parsedChunks,
        created_at: new Date().toISOString()
      };

      await saveLessonToFirestore(lessonDoc);
      setSuccessMsg(`Đã lưu thành công ${parsedChunks.length} chunks vào bài học '${docId}'!`);
      
      onUploadSuccess(docId);

      if (launchDrill && onStartDrillNow) {
        setTimeout(() => {
          onStartDrillNow(docId, dayNumber);
          onClose();
        }, 500);
      } else {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu bài học vào database.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#DC2626]/10 text-[#DC2626]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-900">
                Import Giáo Trình & Chuẩn Bị Drill Lớp Học
              </h2>
              <p className="text-xs text-zinc-500">
                Nhập file Excel (.xlsx) danh sách câu, xem trước chỉnh sửa, tạo âm thanh hàng loạt và chiếu lên lớp.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Alerts */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Khóa Học / Cấp Độ
              </label>
              <select
                value={levelCode}
                onChange={(e) => setLevelCode(e.target.value as CourseLevel)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
              >
                {curriculumRegistry.getAllCourses().map(c => (
                  <option key={c.id} value={c.level_code}>
                    {c.title} ({c.total_chunks.toLocaleString()} Chunks)
                  </option>
                ))}
                <option value="IELTS_DRILL">IELTS Speaking Drill (Custom)</option>
                <option value="CUSTOM">Khóa Học Tùy Chỉnh (Custom)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Buổi / Day Number
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={dayNumber}
                onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Tiêu Đề Bài Học
              </label>
              <input
                type="text"
                placeholder="VD: Day 3 - Daily Commute & Travel"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          {/* Upload Dropzone & Template Download */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropzone */}
            <div className="border-2 border-dashed border-zinc-200 hover:border-[#DC2626] rounded-2xl p-5 text-center transition-all bg-zinc-50/50 flex flex-col items-center justify-center relative group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-[#DC2626] transition-colors mb-2" />
              <p className="text-xs font-bold text-zinc-800">
                {fileName ? `Đã chọn: ${fileName}` : 'Kéo thả file Excel (.xlsx) vào đây hoặc bấm để duyệt'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Hỗ trợ cột: Item, English, Vietnamese, Category, Speaker
              </p>
            </div>

            {/* Template Card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 text-zinc-900 font-bold text-xs">
                  <Download className="w-4 h-4 text-[#DC2626]" />
                  <span>Tải Template Excel Mẫu Chuẩn</span>
                </div>
                <p className="text-xs text-zinc-500">
                  File mẫu có cấu trúc chuẩn hóa, tự động nhận diện danh mục từ vựng, cụm câu, mẫu câu và người nói.
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadLessonExcelTemplate(levelCode, dayNumber)}
                className="mt-3 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:border-[#DC2626] text-xs font-bold text-zinc-700 hover:text-[#DC2626] transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Mẫu (Day {dayNumber} Template.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Batch Synthesis Progress Notification */}
          {prepProgress && (
            <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-2 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DC2626] animate-spin" />
                  <span>{prepProgress.message}</span>
                </span>
                <span className="font-bold text-[#DC2626]">
                  {Math.round((prepProgress.current / prepProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#DC2626] h-full transition-all duration-200"
                  style={{ width: `${(prepProgress.current / prepProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Parsed Chunks Live CRUD Preview Table */}
          {parsedChunks.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-zinc-900">
                    Danh Sách Cụm Câu ({parsedChunks.length} chunks)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    • Có thể chỉnh sửa trực tiếp bên dưới
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddChunk}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3 h-3 text-[#DC2626]" />
                    <span>Thêm Hàng</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSynthesizing}
                    onClick={handleBatchSynthesizeAudio}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />}
                    <span>Chuẩn Bị Sẵn Audio</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5 w-32">Thể Loại</th>
                      <th className="p-2.5">Câu Tiếng Anh (English)</th>
                      <th className="p-2.5">Bản Dịch Tiếng Việt</th>
                      <th className="p-2.5 w-24 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {parsedChunks.map((chunk, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-2 text-center font-mono text-zinc-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={chunk.category}
                            onChange={(e) => handleChunkChange(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-md text-[11px] font-mono uppercase focus:bg-white focus:outline-none focus:border-[#DC2626]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={chunk.english}
                            onChange={(e) => handleChunkChange(idx, 'english', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={chunk.vietnamese}
                            onChange={(e) => handleChunkChange(idx, 'vietnamese', e.target.value)}
                            className="w-full px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-700 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePlayPreview(chunk)}
                              className="p-1 text-zinc-500 hover:text-[#DC2626] rounded-md transition-colors cursor-pointer"
                              title="Nghe thử"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChunk(idx)}
                              className="p-1 text-zinc-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                              title="Xóa hàng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading || parsedChunks.length === 0}
              onClick={() => handleSaveToFirestore(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 text-xs font-bold text-zinc-800 transition-all cursor-pointer shadow-xs"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>Lưu Vào Kho Giáo Trình</span>
            </button>

            <button
              type="button"
              disabled={isUploading || parsedChunks.length === 0}
              onClick={() => handleSaveToFirestore(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Lưu & Bắt Đầu Chiếu Lớp Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
