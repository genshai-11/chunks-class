import React, { useState } from 'react';
import { Cohort, ClassSession } from '../types';
import { exportScheduleAsICS, calculate15Sessions } from '../utils/scheduler';
import { CURRICULUM_CATALOG_LEVEL_B } from '../data/curriculumData';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { 
  Play, 
  Calendar, 
  Clock, 
  Download, 
  ArrowUpRight,
  Sparkles,
  Layers,
  CheckCircle2,
  CalendarCheck,
  Settings,
  Edit3,
  X,
  Check
} from 'lucide-react';

interface ScheduleViewProps {
  cohort: Cohort;
  onUpdateCohort: (updated: Cohort) => void;
  onLaunchProjectorForLesson: (lessonId: string, sessionNumber: number) => void;
  onOpenCreateCohort: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  cohort,
  onUpdateCohort,
  onLaunchProjectorForLesson,
  onOpenCreateCohort
}) => {
  const [editingSessionNumber, setEditingSessionNumber] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  
  // Cohort Settings Editor Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(cohort.title);
  const [editStartDate, setEditStartDate] = useState<string>(cohort.start_date || '2026-09-01');
  const [editDays, setEditDays] = useState<string[]>(cohort.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri']);
  const [editStartTime, setEditStartTime] = useState<string>(cohort.schedule_pattern?.start_time || '19:30');
  const [editEndTime, setEditEndTime] = useState<string>(cohort.schedule_pattern?.end_time || '21:00');

  const toggleEditDay = (day: string) => {
    if (editDays.includes(day)) {
      if (editDays.length > 1) {
        setEditDays(editDays.filter(d => d !== day));
      }
    } else {
      setEditDays([...editDays, day]);
    }
  };

  const handleSaveCohortSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newSessions = calculate15Sessions(
      cohort.level_code,
      editStartDate,
      editDays,
      editStartTime,
      editEndTime
    );
    const updatedCohort: Cohort = {
      ...cohort,
      title: editTitle.trim() || cohort.title,
      start_date: editStartDate,
      schedule_pattern: {
        days_of_week: editDays,
        start_time: editStartTime,
        end_time: editEndTime,
        duration_minutes: 90
      },
      sessions: newSessions,
      updated_at: new Date().toISOString()
    };
    onUpdateCohort(updatedCohort);
    setIsEditModalOpen(false);
  };

  const sessions = cohort?.sessions || [];
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const totalSessions = cohort?.total_sessions || sessions.length || 15;
  const inProgressSession = sessions.find(s => s.status === 'in_progress') || sessions.find(s => s.status === 'scheduled') || sessions[0];
  const progressPercent = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  const handleStatusChange = (sessionNumber: number, newStatus: ClassSession['status']) => {
    const updatedSessions = sessions.map(s => {
      if (s.session_number === sessionNumber) {
        return { ...s, status: newStatus };
      }
      return s;
    });
    onUpdateCohort({ ...cohort, sessions: updatedSessions, updated_at: new Date().toISOString() });
  };

  const handleDateChange = (sessionNumber: number, newDate: string) => {
    const updatedSessions = sessions.map(s => {
      if (s.session_number === sessionNumber) {
        const d = new Date(newDate);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return { ...s, scheduled_date: newDate, day_of_week: days[d.getDay()] };
      }
      return s;
    });
    onUpdateCohort({ ...cohort, sessions: updatedSessions, updated_at: new Date().toISOString() });
    setEditingSessionNumber(null);
  };

  const handleExportICS = () => {
    const icsData = exportScheduleAsICS(cohort);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(cohort?.title || 'Cohort').replace(/\s+/g, '_')}_15_Sessions.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const daysOfWeekText = cohort?.schedule_pattern?.days_of_week?.join(' - ') || 'Mon - Wed - Fri';
  const startTimeText = cohort?.schedule_pattern?.start_time || '19:30';
  const endTimeText = cohort?.schedule_pattern?.end_time || '21:00';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] uppercase">
                Standard 15-Session Cohort
              </span>
              <span className="text-xs text-[#6B6B6B] font-mono">
                • Start Date: {cohort.start_date}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[#0A0A0A] tracking-tight">
              {cohort.title}
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Level {cohort?.level_code?.replace('_', ' ') || 'B'} • {daysOfWeekText} ({startTimeText} – {endTimeText})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setEditTitle(cohort.title);
                setEditStartDate(cohort.start_date || '2026-09-01');
                setEditDays(cohort.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri']);
                setEditStartTime(cohort.schedule_pattern?.start_time || '19:30');
                setEditEndTime(cohort.schedule_pattern?.end_time || '21:00');
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E8EC] bg-white text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-xs"
              title="Change start date, times, and recalculate 15 sessions"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Edit Schedule</span>
            </button>

            <button
              onClick={handleExportICS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E8EC] bg-white text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-xs"
              title="Export calendar sync (.ics) for Google Calendar, Apple Calendar, or Outlook"
            >
              <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Export iCal (.ics)</span>
            </button>

            {inProgressSession && (
              <button
                onClick={() => onLaunchProjectorForLesson(inProgressSession.lesson_id, inProgressSession.session_number)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Session {inProgressSession.session_number}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-[#E8E8EC]">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0A0A0A]">Cohort Progression:</span>
              <span className="font-mono text-[#DC2626] font-bold">
                {completedCount} of {cohort.total_sessions} sessions completed
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#0A0A0A]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#F1F1F4] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#DC2626] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Spotlight Next Session Card */}
      {inProgressSession && (
        <div className="bg-gradient-to-r from-[#DC2626]/[0.04] via-[#FAFAFA] to-white rounded-xl border-2 border-[#DC2626]/20 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]"></span>
              </span>
              <span className="text-xs font-mono font-bold uppercase text-[#DC2626] tracking-wider">
                {inProgressSession.status === 'in_progress' ? 'Session In Progress' : 'Next Scheduled Session'}
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-[#0A0A0A]">
              Session {inProgressSession.session_number}: {inProgressSession.lesson_title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#6B6B6B] font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                {inProgressSession.day_of_week}, {inProgressSession.scheduled_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6B6B6B]" />
                {inProgressSession.start_time} – {inProgressSession.end_time}
              </span>
            </div>
          </div>

          <button
            onClick={() => onLaunchProjectorForLesson(inProgressSession.lesson_id, inProgressSession.session_number)}
            className="w-full md:w-auto px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <span>Launch Presenter Drill</span>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E8EC] rounded-lg shadow-2xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            All 15 Sessions ({cohort.sessions.length})
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'scheduled'
                ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            Scheduled ({cohort.sessions.filter(s => s.status === 'scheduled').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-[#16A34A] text-white font-semibold shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="text-xs text-[#6B6B6B] font-mono">
          * Direct clicker integration enabled for all sessions
        </div>
      </div>

      {/* 4. 15-Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((session) => {
          const lessonMeta = cohort.level_code === 'LEVEL_A'
            ? CURRICULUM_CATALOG_LEVEL_A.find(l => l.id === session.lesson_id)
            : CURRICULUM_CATALOG_LEVEL_B.find(l => l.id === session.lesson_id);

          const chunkCount = lessonMeta?.chunks.length || 10;
          const isCompleted = session.status === 'completed';
          const isInProgress = session.status === 'in_progress';

          return (
            <div
              key={session.session_number}
              className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all hover:shadow-sm ${
                isInProgress 
                  ? 'border-[#DC2626] ring-2 ring-[#DC2626]/10' 
                  : isCompleted 
                    ? 'border-[#16A34A]/40 bg-[#FAFAFA]/70' 
                    : 'border-[#E8E8EC]'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isInProgress 
                        ? 'bg-[#DC2626] text-white' 
                        : isCompleted 
                          ? 'bg-[#16A34A] text-white' 
                          : 'bg-[#F1F1F4] text-[#0A0A0A]'
                    }`}>
                      {session.session_number}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#0A0A0A]">
                      Session {session.session_number}/15
                    </span>
                  </div>

                  <select
                    value={session.status}
                    onChange={(e) => handleStatusChange(session.session_number, e.target.value as any)}
                    className={`text-[11px] font-semibold font-mono rounded-md px-2 py-1 border transition-colors cursor-pointer ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : isInProgress 
                          ? 'bg-red-50 text-[#DC2626] border-red-200 font-bold' 
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    <option value="scheduled">⏳ Scheduled</option>
                    <option value="in_progress">🔴 In Progress</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">🚫 Postponed</option>
                  </select>
                </div>

                {/* Lesson Title */}
                <h3 className="font-display font-bold text-sm text-[#0A0A0A] leading-snug line-clamp-2 min-h-[2.5rem]">
                  {session.lesson_title}
                </h3>

                {/* Metadata Details */}
                <div className="mt-3 space-y-1.5 text-xs text-[#6B6B6B]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      {session.day_of_week}, {session.scheduled_date}
                    </span>
                    {editingSessionNumber === session.session_number ? (
                      <input
                        type="date"
                        defaultValue={session.scheduled_date}
                        onBlur={(e) => handleDateChange(session.session_number, e.target.value)}
                        className="text-[11px] border rounded px-1 py-0.5 font-mono"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingSessionNumber(session.session_number)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-700 underline cursor-pointer"
                        title="Reschedule Date"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-[#6B6B6B]" />
                      {session.start_time} – {session.end_time}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {chunkCount} Chunks
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Drill Launch CTA */}
              <div className="mt-4 pt-3 border-t border-[#E8E8EC] flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate">
                  {session.lesson_type}
                </span>

                <button
                  onClick={() => onLaunchProjectorForLesson(session.lesson_id, session.session_number)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isInProgress
                      ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs'
                      : 'bg-zinc-100 hover:bg-[#DC2626] hover:text-white text-zinc-800'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Launch Drill</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. EDIT COHORT & SCHEDULE SETTINGS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E8EC] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0A0A0A] tracking-tight">Edit Cohort & Schedule</h3>
                  <p className="text-xs text-zinc-500">Configure start date, recurring days, and recalculate 15 sessions</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCohortSettings} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Cohort Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm focus:outline-hidden focus:border-[#DC2626]"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Start Date (Khai Giảng)
                </label>
                <input
                  type="date"
                  required
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono focus:outline-hidden focus:border-[#DC2626]"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  All 15 sessions will automatically skip to matching weekdays from this date.
                </p>
              </div>

              {/* Recurring Days */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Schedule Days
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = editDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleEditDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#DC2626] text-white shadow-xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono focus:outline-hidden focus:border-[#DC2626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono focus:outline-hidden focus:border-[#DC2626]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E8EC] text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Recalculate & Save 15 Sessions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
