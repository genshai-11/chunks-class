import React, { useState } from 'react';
import { Cohort, CourseLevel, LanguageMode, CohortAudioSettings } from '../types';
import { calculateSessions } from '../utils/scheduler';
import { 
  Cloud, 
  Keyboard, 
  RotateCcw, 
  Check, 
  Sliders,
  Server,
  Layers,
  Database,
  Save,
  Calendar,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SettingsViewProps {
  cohort: Cohort;
  onUpdateCohort: (cohort: Cohort) => void;
  onResetToDefault: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cohort,
  onUpdateCohort,
  onResetToDefault
}) => {
  const [formData, setFormData] = useState<Cohort>({ ...cohort });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [recalcSuccess, setRecalcSuccess] = useState<boolean>(false);

  // Sync state if prop updates
  React.useEffect(() => {
    setFormData({ ...cohort });
  }, [cohort]);

  const handleFieldChange = (field: keyof Cohort, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAudioSettingChange = (field: keyof CohortAudioSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      audio_settings: {
        ...prev.audio_settings,
        [field]: value
      }
    }));
  };

  const handleDayOfWeekToggle = (day: string) => {
    const currentDays = formData.schedule?.days_of_week || ['Mon', 'Wed', 'Fri'];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days_of_week: newDays
      }
    }));
  };

  const handleRecalculateSchedule = async () => {
    const days = formData.schedule?.days_of_week || ['Mon', 'Wed', 'Fri'];
    const startDate = formData.schedule?.start_date || new Date().toISOString().split('T')[0];
    const totalSessions = formData.total_sessions || 15;

    const newSessions = await calculateSessions({
      courseIdOrLevel: formData.course_id || formData.level_code,
      startDateStr: startDate,
      daysOfWeek: days,
      totalSessions: totalSessions,
      startTime: formData.schedule?.start_time || '19:30',
      endTime: formData.schedule?.end_time || '21:00'
    });

    setFormData(prev => ({
      ...prev,
      sessions: newSessions
    }));

    setRecalcSuccess(true);
    setTimeout(() => setRecalcSuccess(false), 2500);
  };

  const handleSave = () => {
    onUpdateCohort(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const allWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] uppercase">
              Cohort Admin & Classroom Configuration
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Enabled
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-zinc-900 tracking-tight">
            Quản Lý Lớp Học & Cấu Hình Hệ Thống
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Chỉnh sửa thông tin lớp, giảng viên, lịch học tuần, ngày khai giảng và thiết lập âm thanh mặc định.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Đã Lưu Thành Công!' : 'Lưu Thay Đổi (Save)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Editable Cohort Profile Form */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <User className="w-5 h-5 text-[#DC2626]" />
          <h2 className="font-display font-bold text-base text-zinc-900">
            Thông Tin Lớp Học & Giảng Viên
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
              Tên Lớp Học (Cohort Title)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
              Khóa Học / Cấp Độ (Level)
            </label>
            <select
              value={formData.level_code}
              onChange={(e) => handleFieldChange('level_code', e.target.value as CourseLevel)}
              className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
            >
              <option value="LEVEL_A">Level A (Foundation - 16 Buổi)</option>
              <option value="LEVEL_B">Level B (Spoken Masterclass - 14 Buổi)</option>
              <option value="CUSTOM">Khóa Học Tùy Chỉnh (Custom)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
              Mã Giảng Viên (Teacher ID)
            </label>
            <input
              type="text"
              value={formData.teacher_id || ''}
              onChange={(e) => handleFieldChange('teacher_id', e.target.value)}
              placeholder="VD: teacher_genshai"
              className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>

        {/* Schedule & Timing Setup */}
        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#DC2626]" />
              <span className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                Lịch Học Tuần & Ngày Khai Giảng
              </span>
            </div>

            <button
              type="button"
              onClick={handleRecalculateSchedule}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{recalcSuccess ? 'Đã Tính Lại Lịch!' : 'Tự Động Tính Lại Ngày Học'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-1">
                Ngày Bắt Đầu (Start Date)
              </label>
              <input
                type="date"
                value={formData.schedule?.start_date || ''}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    schedule: {
                      ...prev.schedule,
                      start_date: e.target.value
                    }
                  }));
                }}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-1">
                Khung Giờ Học
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={formData.schedule?.start_time || '19:30'}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, start_time: e.target.value }
                    }));
                  }}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900"
                />
                <span className="text-zinc-400 font-mono">-</span>
                <input
                  type="time"
                  value={formData.schedule?.end_time || '21:00'}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, end_time: e.target.value }
                    }));
                  }}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-1">
                Số Buổi Học Tổng (Sessions)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.total_sessions || 15}
                onChange={(e) => handleFieldChange('total_sessions', parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900"
              />
            </div>
          </div>

          {/* Weekday Selector Pills */}
          <div>
            <label className="text-xs font-bold text-zinc-600 block mb-2">
              Các Ngày Học Trong Tuần (Days of Week)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {allWeekdays.map((day) => {
                const isSelected = formData.schedule?.days_of_week?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayOfWeekToggle(day)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Default Audio Configuration for this Cohort */}
        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#DC2626]" />
            <span className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
              Cấu Hình Âm Thanh Mặc Định Của Lớp (Cohort Audio Defaults)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-1">
                Giọng Tiếng Anh Mặc Định
              </label>
              <select
                value={formData.audio_settings?.voice_profile_en || 'aura-asteria-en'}
                onChange={(e) => handleAudioSettingChange('voice_profile_en', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="aura-asteria-en">Deepgram Asteria (Nữ Mỹ - Chuẩn)</option>
                <option value="aura-luna-en">Deepgram Luna (Nữ Mỹ - Ấm áp)</option>
                <option value="aura-orion-en">Deepgram Orion (Nam Mỹ - Trầm)</option>
                <option value="en-US-Journey-F">Google Journey Female (Cao cấp)</option>
                <option value="en-US-Studio-O">Google Studio Narrator</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-1">
                Chế Độ Phát Song Ngữ
              </label>
              <select
                value={formData.audio_settings?.language_mode || 'EN_THEN_VI'}
                onChange={(e) => handleAudioSettingChange('language_mode', e.target.value as LanguageMode)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="EN_THEN_VI">Tiếng Anh ➔ Tiếng Việt (EN ➔ VI)</option>
                <option value="EN_ONLY">Chỉ Tiếng Anh (EN Only)</option>
                <option value="VI_ONLY">Chỉ Tiếng Việt (VI Only)</option>
                <option value="VI_THEN_EN">Tiếng Việt ➔ Tiếng Anh (VI ➔ EN)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-1">
                Tốc Độ Đọc Mặc Định
              </label>
              <select
                value={formData.audio_settings?.default_speed || 1.0}
                onChange={(e) => handleAudioSettingChange('default_speed', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="0.8">0.8x (Chậm, rõ âm)</option>
                <option value="0.9">0.9x (Vừa phải)</option>
                <option value="1.0">1.0x (Chuẩn tự nhiên)</option>
                <option value="1.2">1.2x (Nhanh)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Reset & Confirmation */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-xs text-zinc-900">
            Khôi Phục Danh Sách Lớp Mặc Định
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Đặt lại dữ liệu về 2 lớp học mẫu Level A K12 và Level B K24 tiêu chuẩn.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetToDefault}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi Phục Lớp Mặc Định</span>
        </button>
      </div>
    </div>
  );
};
