import React, { useState } from 'react';
import { TeacherSidebar } from './TeacherSidebar';
import { Course, NavTab, Cohort } from '../types';
import { CohortModal } from './CohortModal';
import { DEFAULT_COURSES } from '../services/firestoreService';
import { 
  ChevronDown, 
  Plus, 
  Calendar, 
  Check, 
  Sparkles,
  BookOpen,
  Volume2
} from 'lucide-react';

interface AppLayoutProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeCohort: Cohort;
  allCohorts: Cohort[];
  onSelectCohort: (cohort: Cohort) => void;
  onCreateCohort: (newCohort: Cohort) => void;
  onOpenExcelUpload?: () => void;
  courses?: Course[];
  selectedCourseId?: string;
  onSelectCourse?: (courseId: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  activeCohort,
  allCohorts = [],
  onSelectCohort,
  onCreateCohort,
  onOpenExcelUpload,
  courses = DEFAULT_COURSES,
  selectedCourseId = activeCohort?.course_id || 'course_level_b',
  onSelectCourse,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCreateCohortOpen, setIsCreateCohortOpen] = useState<boolean>(false);
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState<boolean>(false);

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans antialiased text-[#0A0A0A]">
      {/* 1. TEACHER SIDEBAR */}
      <TeacherSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={onSelectCourse || ((courseId) => {
          const match = allCohorts.find(c => c.course_id === courseId);
          if (match) onSelectCohort(match);
        })}
        cohorts={allCohorts}
        selectedCohortId={activeCohort?.id || ''}
        onSelectCohort={(cohortId) => {
          const match = allCohorts.find(c => c.id === cohortId);
          if (match) onSelectCohort(match);
        }}
        onOpenCreateCohort={() => setIsCreateCohortOpen(true)}
        onOpenExcelUpload={onOpenExcelUpload}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E8E8EC] px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-lg text-[#0A0A0A]">
              {activeTab === 'schedule' && '15-Session Cohort Schedule'}
              {activeTab === 'projector' && 'Presentation - Focus Mode'}
              {activeTab === 'improv-manager' && 'Improv Studio'}
              {activeTab === 'improv-presentation' && 'Improv - Focus Mode'}
              {activeTab === 'curriculum' && 'Curriculum Repository (7,851 Chunks)'}
              {activeTab === 'audio-manager' && 'Quản Lý Âm Thanh Toàn Diện (Audio Management)'}
              {activeTab === 'audio-hub' && 'Voice Engine & Audio Hub'}
              {activeTab === 'settings' && 'Cohort & System Settings'}
            </h2>

            <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              Level {activeCohort?.level_code?.replace('_', ' ') || 'B'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Cohort switcher button */}
            <div className="relative">
              <button
                onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8E8EC] hover:border-zinc-300 bg-[#FAFAFA] text-xs font-semibold text-[#0A0A0A] transition-all cursor-pointer"
              >
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  {activeCohort?.title || 'Select Cohort'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {/* Click-outside backdrop overlay */}
              {isCohortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setIsCohortDropdownOpen(false)}
                  />
                  {/* Cohort Switcher Dropdown */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#E8E8EC] py-2 z-[100] animate-scale-up"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase text-zinc-400 border-b border-zinc-100">
                      Active Cohorts ({(allCohorts || []).length})
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                      {(allCohorts || []).map((c) => {
                        const isSelected = c.id === activeCohort?.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              onSelectCohort(c);
                              setIsCohortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                              isSelected
                                ? 'bg-[#DC2626]/10 text-[#DC2626] font-bold'
                                : 'hover:bg-zinc-50 text-zinc-800'
                            }`}
                          >
                            <div className="truncate mr-2">
                              <div className="truncate">{c.title}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                {c.start_date} • 15 sessions
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#DC2626] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setIsCohortDropdownOpen(false);
                          setIsCreateCohortOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New 15-Session Cohort</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Canvas View */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* 3. COHORT CREATION MODAL */}
      <CohortModal
        isOpen={isCreateCohortOpen}
        onClose={() => setIsCreateCohortOpen(false)}
        onCreateCohort={onCreateCohort}
      />
    </div>
  );
};

