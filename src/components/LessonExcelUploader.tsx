import React, { useState } from 'react';
import { CourseLevel, ChunkItem, LessonDoc } from '../types';
import { downloadLessonExcelTemplate, parseExcelLessonFile } from '../utils/excelTemplate';
import { saveLessonToFirestore } from '../services/firestoreService';
import { 
  FileSpreadsheet, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface LessonExcelUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (lessonId: string) => void;
}

export const LessonExcelUploader: React.FC<LessonExcelUploaderProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [levelCode, setLevelCode] = useState<CourseLevel>('LEVEL_A');
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonType, setLessonType] = useState<string>('Standard Lesson');
  const [parsedChunks, setParsedChunks] = useState<ChunkItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
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
      setErrorMsg(err.message || 'Failed to parse Excel file. Please ensure it follows the CHUNKS template format.');
      setParsedChunks([]);
    }
  };

  const handleSaveToFirestore = async () => {
    if (parsedChunks.length === 0) {
      setErrorMsg('No chunks to upload. Please select a valid Excel file.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const prefix = levelCode === 'LEVEL_A' ? 'level_a' : 'level_b';
      const docId = `${prefix}_day_${dayNumber}`;
      const categories: string[] = Array.from(new Set(parsedChunks.map(c => String(c.category))));

      const lessonDoc: LessonDoc = {
        id: docId,
        level_code: levelCode,
        day_number: dayNumber,
        course_title: levelCode === 'LEVEL_A' ? 'Level A - Foundation & Core Vocabulary' : 'Level B - Advanced Spoken Masterclass',
        lesson_title: lessonTitle || `Day ${dayNumber} Lesson`,
        lesson_type: lessonType,
        total_chunks: parsedChunks.length,
        categories: categories,
        chunks: parsedChunks,
        created_at: new Date().toISOString()
      };

      await saveLessonToFirestore(lessonDoc);
      setSuccessMsg(`Uploaded ${parsedChunks.length} chunks to Firestore document '${docId}'!`);
      
      setTimeout(() => {
        onUploadSuccess(docId);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save lesson to Firestore.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E8EC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A0A0A] tracking-tight">
                Upload Lesson via Excel (.xlsx)
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Ingest curriculum chunks directly into Live Google Cloud Firestore
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={downloadLessonExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DC2626]/[0.08] hover:bg-[#DC2626]/[0.15] text-[#DC2626] text-xs font-bold rounded-lg transition-all cursor-pointer"
              title="Download standardized Excel template with sample chunks"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Level & Day Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#0A0A0A] block mb-1">Course Level</label>
              <select
                value={levelCode}
                onChange={(e) => setLevelCode(e.target.value as CourseLevel)}
                className="w-full bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl p-2.5 text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#DC2626]"
              >
                <option value="LEVEL_A">📗 Level A (Foundation English)</option>
                <option value="LEVEL_B">📕 Level B (Spoken Masterclass)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#0A0A0A] block mb-1">Day Number (1 to 15)</label>
              <input
                type="number"
                min={1}
                max={15}
                value={dayNumber}
                onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl p-2.5 text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          {/* Lesson Title */}
          <div>
            <label className="text-xs font-bold text-[#0A0A0A] block mb-1">Lesson Title</label>
            <input
              type="text"
              placeholder="e.g. Day 3 - Tell Me About Yourself"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl p-2.5 text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-[#E8E8EC] hover:border-[#DC2626] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#FAFAFA] group">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E8EC] group-hover:border-[#DC2626] shadow-xs flex items-center justify-center mx-auto mb-2 text-[#DC2626]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-[#0A0A0A]">
                {fileName ? fileName : 'Click to select or drag & drop Excel file (.xlsx)'}
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-1">
                Standard columns: Item Number, Category, Speaker, English, Vietnamese, Beat Prosody
              </p>
            </label>
          </div>

          {/* Parsed Preview */}
          {parsedChunks.length > 0 && (
            <div className="p-3.5 bg-[#FAFAFA] border border-[#E8E8EC] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully parsed {parsedChunks.length} chunks
                </span>
                <span className="text-[11px] font-mono text-[#DC2626] font-bold">
                  Document ID: {levelCode.toLowerCase()}_day_{dayNumber}
                </span>
              </div>
              
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {parsedChunks.slice(0, 5).map((c, i) => (
                  <div key={i} className="p-2 bg-white border border-[#E8E8EC] rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase shrink-0">
                        {c.category}
                      </span>
                      <span className="font-semibold truncate text-[#0A0A0A]">"{c.english}"</span>
                    </div>
                    <span className="text-[#6B6B6B] truncate max-w-[200px] text-[11px] shrink-0 text-right">{c.vietnamese}</span>
                  </div>
                ))}
                {parsedChunks.length > 5 && (
                  <div className="text-[11px] text-center text-[#6B6B6B] italic py-1">
                    + {parsedChunks.length - 5} more chunks in this lesson file
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8E8EC]">
          <span className="text-[11px] text-zinc-400 font-mono">
            {parsedChunks.length > 0 ? `${parsedChunks.length} chunks ready for ingestion` : 'Awaiting Excel file'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E8E8EC] text-xs font-bold rounded-xl text-[#6B6B6B] hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToFirestore}
              disabled={parsedChunks.length === 0 || isUploading}
              className="flex items-center gap-2 px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Uploading to Firestore...' : `Upload ${parsedChunks.length} Chunks to Firestore`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
