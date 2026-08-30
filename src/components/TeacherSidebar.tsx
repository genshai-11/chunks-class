import React from 'react';
import { Course, Cohort, NavTab } from '../types';
import { 
  Calendar, 
  Mic2, 
  BookOpen, 
  Volume2, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface TeacherSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  cohorts: Cohort[];
  selectedCohortId: string;
  onSelectCohort: (cohortId: string) => void;
  onOpenCreateCohort: () => void;
  onOpenExcelUpload?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  activeTab,
  onSelectTab,
  courses = [],
  selectedCourseId = '',
  onSelectCourse,
  cohorts = [],
  selectedCohortId = '',
  onSelectCohort,
  onOpenCreateCohort,
  onOpenExcelUpload,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'schedule', label: '15-Session Schedule', icon: <Calendar className="w-4 h-4" /> },
    { id: 'projector', label: 'In-Class Presentation', icon: <Mic2 className="w-4 h-4" />, badge: 'LIVE' },
    { id: 'curriculum', label: 'Curriculum & Chunks', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'audio-hub', label: 'Voice & GCS Storage', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Cohort Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <aside
      className={`h-screen bg-white border-r border-[#E8E8EC] flex flex-col justify-between transition-all duration-200 z-30 sticky top-0 font-sans shrink-0 ${
        isCollapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-[#E8E8EC] justify-between ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="truncate min-w-0 flex flex-col justify-center">
            <img
              src="/logo.png"
              alt="CHUNKS"
              className={`${isCollapsed ? 'w-9' : 'w-[100px]'} h-auto object-contain rounded-[3px] shadow-2xs`}
            />
            {!isCollapsed && (
              <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                <span>Teacher Studio</span>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shrink-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Dual Selectors: Course & Cohort */}
        {!isCollapsed && (
          <div className="p-3.5 border-b border-[#E8E8EC] bg-[#FAFAFA] space-y-2.5">
            {/* Course Selector */}
            <div>
              <label className="text-[10px] font-mono font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                Course Level
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => onSelectCourse?.(e.target.value)}
                className="w-full bg-white border border-[#E8E8EC] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#DC2626] cursor-pointer shadow-xs"
              >
                {(courses || []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.level_code === 'LEVEL_A'
                      ? '📗 Level A (Foundation)'
                      : c.level_code === 'LEVEL_B_EREL'
                      ? '🎧 Level B (EREL Listening)'
                      : c.level_code === 'LEVEL_B_ERES'
                      ? '🗣️ Level B (ERES Speaking)'
                      : `📕 ${c.title || c.level_code}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Cohort Selector */}
            <div>
              <label className="text-[10px] font-mono font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                Active Cohort
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => onSelectCohort?.(e.target.value)}
                className="w-full bg-white border border-[#E8E8EC] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#DC2626] cursor-pointer shadow-xs truncate"
              >
                {(cohorts || []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#DC2626]/[0.08] text-[#DC2626] font-bold'
                    : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F8F8FA]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <span className={isActive ? 'text-[#DC2626]' : 'text-zinc-500'}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer CTA & Profile */}
      <div className="p-3.5 border-t border-[#E8E8EC] space-y-2">
        {!isCollapsed && (
          <>
            {onOpenExcelUpload && (
              <button
                onClick={onOpenExcelUpload}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#E8E8EC] hover:border-[#DC2626] text-[#0A0A0A] hover:text-[#DC2626] text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Upload Lesson (Excel)</span>
              </button>
            )}

            <button
              onClick={onOpenCreateCohort}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New 15-Session Cohort</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-7 h-7 rounded-full bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center font-bold text-xs text-[#DC2626] shrink-0">
            T
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#0A0A0A] truncate">
                teacher_genshai
              </div>
              <div className="text-[10px] text-[#16A34A] font-medium flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span>Firestore Live DB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
