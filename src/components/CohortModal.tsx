import React, { useState, useMemo } from 'react';
import { Cohort, ClassSession, CourseLevel, Course } from '../types';
import { calculate15Sessions, resolveCourseIdFromLevel } from '../utils/scheduler';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { X, CheckCircle, Plus } from 'lucide-react';

interface CohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCohort: (newCohort: Cohort) => void;
  initialLevelCode?: CourseLevel;
}

const getInitialTitle = (level: CourseLevel) => {
  if (level === 'LEVEL_A') return 'Level A - Foundation Chunks K25 (Mon-Wed-Fri)';
  if (level === 'LEVEL_B_EREL') return 'Level B - EREL Listening K25 (Mon-Wed-Fri)';
  if (level === 'LEVEL_B_ERES' || level === 'LEVEL_B') return 'Level B - ERES Speaking K25 (Mon-Wed-Fri)';
  return `${level} - Cohort K25 (Mon-Wed-Fri)`;
};

export const CohortModal: React.FC<CohortModalProps> = ({
  isOpen,
  onClose,
  onCreateCohort,
  initialLevelCode = 'LEVEL_B_ERES'
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [levelCode, setLevelCode] = useState<CourseLevel>(initialLevelCode);
  const [title, setTitle] = useState(getInitialTitle(initialLevelCode));
  const [startDate, setStartDate] = useState(today);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [startTime, setStartTime] = useState('19:30');
  const [endTime, setEndTime] = useState('21:00');

  const availableCourses = useMemo<Course[]>(() => {
    return curriculumRegistry.getAllCourses();
  }, []);

  const weekdaysList = [
    { id: 'Mon', label: 'Mon' },
    { id: 'Tue', label: 'Tue' },
    { id: 'Wed', label: 'Wed' },
    { id: 'Thu', label: 'Thu' },
    { id: 'Fri', label: 'Fri' },
    { id: 'Sat', label: 'Sat' },
    { id: 'Sun', label: 'Sun' }
  ];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const previewSessions: ClassSession[] = useMemo(() => {
    return calculate15Sessions(levelCode, startDate, selectedDays, startTime, endTime);
  }, [levelCode, startDate, selectedDays, startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedDays.length === 0) return;

    const courseId = resolveCourseIdFromLevel(levelCode);

    const newCohort: Cohort = {
      id: 'cohort_' + Date.now(),
      title: title.trim(),
      level_code: levelCode,
      course_id: courseId,
      teacher_id: 'teacher_genshai',
      start_date: startDate,
      schedule_pattern: {
        days_of_week: selectedDays,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: 90
      },
      total_sessions: previewSessions.length,
      sessions: previewSessions,
      audio_settings: {
        voice_profile_primary: 'aura-asteria-en',
        voice_profile_secondary: 'vi-VN-Neural2-A',
        voice_profile_en: 'aura-asteria-en',
        voice_profile_vi: 'vi-VN-Neural2-A',
        language_mode: 'EN_THEN_VI',
        auto_advance_delay_sec: 0,
        default_speed: 1.0,
        repeat_count: 1
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onCreateCohort(newCohort);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-[#0A0A0A] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E8EC] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E8EC] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626] flex items-center justify-center text-white font-bold text-sm">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#0A0A0A]">
                Create Automated 15-Session Cohort
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Calculates recurring schedule and links curriculum sessions automatically
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
              Cohort Title / Batch Name:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
              placeholder="e.g. Level B - Evening Cohort K25 (Mon-Wed-Fri)"
            />
          </div>

          {/* Level & Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
                Course Level:
              </label>
              <select
                value={levelCode}
                onChange={(e) => {
                  const newLevel = e.target.value as CourseLevel;
                  setLevelCode(newLevel);
                  setTitle(getInitialTitle(newLevel));
                }}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
              >
                {availableCourses.map((c) => {
                  let optionLabel = `${c.title} (${c.total_chunks.toLocaleString()} Chunks • ${c.total_days} Lessons)`;
                  if (c.level_code === 'LEVEL_A') {
                    optionLabel = `Level A (Foundation - 4,480 Chunks • 16 Lessons)`;
                  } else if (c.level_code === 'LEVEL_B_EREL') {
                    optionLabel = `Level B - EREL (Listening & Shadowing - 1,019 Chunks • 15 Lessons)`;
                  } else if (c.level_code === 'LEVEL_B_ERES') {
                    optionLabel = `Level B - ERES (Speaking & Reflexes - 3,371 Chunks • 15 Lessons)`;
                  }
                  return (
                    <option key={c.id} value={c.level_code}>
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
                Start Date (Session 1):
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          {/* Weekday Selection */}
          <div>
            <label className="text-xs font-semibold text-[#0A0A0A] block mb-1.5">
              Weekly Schedule Days:
            </label>
            <div className="flex flex-wrap gap-2">
              {weekdaysList.map((w) => {
                const isSelected = selectedDays.includes(w.id);
                return (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => toggleDay(w.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : 'bg-[#FAFAFA] text-zinc-600 border border-[#E8E8EC] hover:bg-zinc-100'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
                Start Time:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-mono font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
                End Time:
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-mono font-medium"
              />
            </div>
          </div>

          {/* 15 Sessions Preview */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#0A0A0A]">
                Calculated 15-Session Schedule Preview:
              </span>
              <span className="text-[11px] font-mono text-[#DC2626] font-bold">
                15 Sessions ({previewSessions[0]?.scheduled_date} ➔ {previewSessions[previewSessions.length - 1]?.scheduled_date})
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto border border-[#E8E8EC] rounded-lg p-2.5 bg-[#FAFAFA] space-y-1 text-[11px] font-mono">
              {previewSessions.map((s) => (
                <div key={s.session_number} className="flex items-center justify-between text-zinc-600 py-0.5">
                  <span className="font-bold text-zinc-800">Session {s.session_number}:</span>
                  <span>{s.day_of_week}, {s.scheduled_date}</span>
                  <span className="text-zinc-500 truncate max-w-[220px]">{s.lesson_title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#E8E8EC] text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Create Cohort & Generate Calendar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
