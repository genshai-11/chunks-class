import React, { useState } from 'react';
import { TeacherSidebar } from './TeacherSidebar';
import { Course, NavTab, Cohort } from '../types';
import { CohortModal } from './CohortModal';
import { DEFAULT_COURSES } from '../services/firestoreService';

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
              {activeTab === 'projector' && 'Focus Mode'}
              {activeTab === 'improv-manager' && 'Improv Studio'}
              {activeTab === 'improv-presentation' && 'Improv Mode'}
              {activeTab === 'curriculum' && 'Curriculum Repository (7,851 Chunks)'}
              {activeTab === 'audio-manager' && 'Quản Lý Âm Thanh Toàn Diện (Audio Management)'}
              {activeTab === 'audio-hub' && 'Voice Engine & Audio Hub'}
              {activeTab === 'settings' && 'Cohort & System Settings'}
            </h2>

            <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              Level {activeCohort?.level_code?.replace('_', ' ') || 'B'}
            </span>
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

