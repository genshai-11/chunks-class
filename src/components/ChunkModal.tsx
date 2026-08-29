import React, { useState } from 'react';
import { ChunkItem, ChunkCategory } from '../types';
import { X, Check, Volume2, Sparkles, Music, HelpCircle } from 'lucide-react';
import { audioPlayer } from '../services/googleTtsService';

interface ChunkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chunk: ChunkItem) => Promise<void>;
  initialChunk?: ChunkItem | null;
  dayNumber: number;
}

export const ChunkModal: React.FC<ChunkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialChunk,
  dayNumber
}) => {
  const [english, setEnglish] = useState(initialChunk?.english || '');
  const [vietnamese, setVietnamese] = useState(initialChunk?.vietnamese || '');
  const [category, setCategory] = useState<ChunkCategory>(initialChunk?.category || 'phrase');
  const [beatProsody, setBeatProsody] = useState(initialChunk?.beat_prosody || '');
  const [ipa, setIpa] = useState(initialChunk?.ipa || '');
  const [speaker, setSpeaker] = useState(initialChunk?.speaker || '');
  const [notes, setNotes] = useState(initialChunk?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const categories: { id: ChunkCategory; label: string }[] = [
    { id: 'vocab', label: 'Vocabulary (Từ vựng cụm)' },
    { id: 'phrase', label: 'Spoken Phrase (Cụm nói phản xạ)' },
    { id: 'sentence', label: 'Sentence Pattern (Mẫu câu)' },
    { id: 'dialogue', label: 'Dialogue (Hội thoại thực tế)' },
    { id: 'monologue', label: 'Monologue (Đoạn độc thoại)' },
    { id: 'idiom', label: 'Idiom (Thành ngữ giao tiếp)' },
    { id: 'slang', label: 'Slang (Tiếng lóng tự nhiên)' },
    { id: 'grammar', label: 'Collocation (Ngữ pháp kết hợp)' },
    { id: 'word_family', label: 'Word Family (Họ từ)' },
    { id: 'review', label: 'Review (Ôn tập phản xạ)' }
  ];

  const handlePlayPreview = async () => {
    if (!english.trim()) return;
    setIsPlayingAudio(true);
    try {
      await audioPlayer.playChunk(
        english,
        initialChunk?.audio_url || null,
        'en-US-Journey-F',
        1.0
      );
    } catch {
      // ignore
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !vietnamese.trim()) return;

    setIsSaving(true);
    try {
      const chunkToSave: ChunkItem = {
        chunk_id: initialChunk?.chunk_id || `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        item_number: initialChunk?.item_number || 999,
        category,
        english: english.trim(),
        vietnamese: vietnamese.trim(),
        beat_prosody: beatProsody.trim() || null,
        ipa: ipa.trim() || null,
        speaker: speaker.trim() || null,
        notes: notes.trim() || undefined
      };

      await onSave(chunkToSave);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EC] bg-[#FAFAFA]">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase text-[#DC2626] tracking-wider">
              {initialChunk ? 'Chỉnh Sửa Chunk' : 'Thêm Chunk Mới Vào Database'}
            </div>
            <h3 className="text-base font-display font-bold text-[#0A0A0A]">
              Day {dayNumber} • {initialChunk ? initialChunk.chunk_id : 'New Chunk Record'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* English Chunk Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5">
                <span>Cụm Từ Tiếng Anh (English Chunk)</span>
                <span className="text-[#DC2626]">*</span>
              </label>
              {english.trim() && (
                <button
                  type="button"
                  onClick={handlePlayPreview}
                  className="text-[11px] font-mono text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  <span>Nghe thử phát âm</span>
                </button>
              )}
            </div>
            <textarea
              required
              rows={2}
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="e.g. As far as I'm concerned, we need to take action."
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-sm font-semibold text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* Vietnamese Translation */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
              Nghĩa Tiếng Việt (Vietnamese Meaning) <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={vietnamese}
              onChange={(e) => setVietnamese(e.target.value)}
              placeholder="e.g. Theo như tôi thấy, chúng ta cần phải hành động."
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-sm font-medium text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* Category & Speaker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
                Phân Loại (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ChunkCategory)}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-medium text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
                Người Nói / Speaker (Optional)
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Speaker A, Teacher, Mark"
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-medium text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          {/* Beat Prosody & Stress Accent */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#DC2626]" />
                Beat Prosody & Trọng Âm Nhịp Điệu (Optional)
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">VIẾT HOA từ nhấn trọng âm</span>
            </label>
            <input
              type="text"
              value={beatProsody}
              onChange={(e) => setBeatProsody(e.target.value)}
              placeholder="e.g. As FAR as I'm conCERNED, we NEED to TAKE ACTion."
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-mono font-medium text-[#DC2626] focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* IPA Transcription */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
              Phiên Âm Quốc Tế IPA (Optional)
            </label>
            <input
              type="text"
              value={ipa}
              onChange={(e) => setIpa(e.target.value)}
              placeholder="e.g. /æz fɑːr æz aɪm kənˈsɜːrnd/"
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-mono font-medium text-zinc-600 focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
              Ghi Chú Giảng Dạy (Teacher Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Nhắc học viên nối âm /z/ sang /æz/..."
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-medium text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8EC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !english.trim() || !vietnamese.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-zinc-300 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <span>Đang lưu vào Firestore...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{initialChunk ? 'Cập Nhật Chunk' : 'Lưu Vào Database'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
