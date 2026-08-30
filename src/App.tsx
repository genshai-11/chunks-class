import React, { useState, useEffect } from 'react';
import { NavTab, Cohort, CohortAudioSettings } from './types';
import { createDefaultCohort } from './utils/scheduler';
import { AppLayout } from './components/AppLayout';
import { ScheduleView } from './components/ScheduleView';
import { ClassroomPresentation } from './components/ClassroomPresentation';
import { CurriculumExplorer } from './components/CurriculumExplorer';
import { AudioHubView } from './components/AudioHubView';
import { SettingsView } from './components/SettingsView';
import { LessonExcelUploader } from './components/LessonExcelUploader';
import { getFirestoreCohorts, saveFirestoreCohort, deleteFirestoreCohort, DEFAULT_COURSES } from './services/firestoreService';
import { useAppRouter } from './hooks/useAppRouter';

export const App: React.FC = () => {
  const { currentTab: activeTab, navigateToTab: setActiveTab } = useAppRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeCohortId, setActiveCohortId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [drillLessonId, setDrillLessonId] = useState<string>('level_b_day_1');
  const [drillSessionNumber, setDrillSessionNumber] = useState<number>(1);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  // Load cohorts on mount
  useEffect(() => {
    async function loadData() {
      try {
        const loadedCohorts = await getFirestoreCohorts();
        if (loadedCohorts.length > 0) {
          setCohorts(loadedCohorts);
          setActiveCohortId(loadedCohorts[0].id);
        } else {
          const defaultB = createDefaultCohort("Level B - Spoken Masterclass K24", "LEVEL_B");
          const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
          setCohorts([defaultB, defaultA]);
          setActiveCohortId(defaultB.id);
          await saveFirestoreCohort(defaultB);
          await saveFirestoreCohort(defaultA);
        }
      } catch (e) {
        console.error('Error loading cohorts:', e);
        const defaultB = createDefaultCohort("Level B - Spoken Masterclass K24", "LEVEL_B");
        setCohorts([defaultB]);
        setActiveCohortId(defaultB.id);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCohort = cohorts.find(c => c.id === activeCohortId) || cohorts[0] || createDefaultCohort();

  const handleUpdateCohort = async (updated: Cohort) => {
    setCohorts(prev => prev.map(c => c.id === updated.id ? updated : c));
    await saveFirestoreCohort(updated);
  };

  const handleCreateCohort = async (newCohort: Cohort) => {
    setCohorts(prev => [newCohort, ...prev]);
    setActiveCohortId(newCohort.id);
    setActiveTab('schedule');
    await saveFirestoreCohort(newCohort);
  };

  const handleResetToDefault = async () => {
    if (window.confirm("Are you sure you want to reset and restore the default 15-session cohorts?")) {
      const defaultB = createDefaultCohort("Level B - Spoken Masterclass K24", "LEVEL_B");
      const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
      setCohorts([defaultB, defaultA]);
      setActiveCohortId(defaultB.id);
      await saveFirestoreCohort(defaultB);
      await saveFirestoreCohort(defaultA);
    }
  };

  const handleSelectCourse = (courseId: string) => {
    const matchingCohort = cohorts.find(c => c.course_id === courseId);
    if (matchingCohort) {
      setActiveCohortId(matchingCohort.id);
      const firstSession = matchingCohort.sessions?.[0];
      if (firstSession) {
        setDrillLessonId(firstSession.lesson_id);
        setDrillSessionNumber(firstSession.session_number);
      }
    }
  };

  const handleLaunchProjectorForLesson = (lessonId: string, sessionNumber: number) => {
    setDrillLessonId(lessonId);
    setDrillSessionNumber(sessionNumber);
    setActiveTab('projector');
  };

  const handleUpdateAudioSettings = async (newAudioSettings: CohortAudioSettings) => {
    const updated = {
      ...activeCohort,
      audio_settings: newAudioSettings,
      updated_at: new Date().toISOString()
    };
    await handleUpdateCohort(updated);
  };

  if (isLoading && cohorts.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FBFBFC] text-zinc-600 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
          <span>Loading CHUNKS Teacher Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      activeCohort={activeCohort}
      allCohorts={cohorts}
      courses={DEFAULT_COURSES}
      selectedCourseId={activeCohort?.course_id || 'course_level_b'}
      onSelectCourse={handleSelectCourse}
      onSelectCohort={(c) => {
        setActiveCohortId(c.id);
        const firstSession = c.sessions?.[0];
        if (firstSession) {
          setDrillLessonId(firstSession.lesson_id);
          setDrillSessionNumber(firstSession.session_number);
        }
      }}
      onCreateCohort={handleCreateCohort}
      onOpenExcelUpload={() => setIsExcelModalOpen(true)}
    >
      {activeTab === 'schedule' && (
        <ScheduleView
          cohort={activeCohort}
          onUpdateCohort={handleUpdateCohort}
          onLaunchProjectorForLesson={handleLaunchProjectorForLesson}
          onOpenCreateCohort={() => {}}
        />
      )}

      {activeTab === 'projector' && (
        <ClassroomPresentation
          initialLessonId={drillLessonId}
          sessionNumber={drillSessionNumber}
          onExit={() => setActiveTab('schedule')}
          audioSettings={activeCohort.audio_settings}
        />
      )}

      {activeTab === 'curriculum' && (
        <CurriculumExplorer
          onLaunchProjectorForLesson={handleLaunchProjectorForLesson}
          defaultCourseLevel={activeCohort.level_code}
        />
      )}

      {activeTab === 'audio-hub' && (
        <AudioHubView
          settings={activeCohort.audio_settings}
          onUpdateSettings={handleUpdateAudioSettings}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          cohort={activeCohort}
          onUpdateCohort={handleUpdateCohort}
          onResetToDefault={handleResetToDefault}
        />
      )}

      {/* Excel Ingestion Modal */}
      <LessonExcelUploader
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onUploadSuccess={(newLessonId) => {
          console.log("Uploaded lesson:", newLessonId);
        }}
        onStartDrillNow={(newLessonId, day) => {
          handleLaunchProjectorForLesson(newLessonId, day);
        }}
      />
    </AppLayout>
  );
};

export default App;
