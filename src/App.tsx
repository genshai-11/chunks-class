import React, { useState, useEffect } from 'react';
import { NavTab, Cohort, CohortAudioSettings } from './types';
import { createDefaultCohort } from './utils/scheduler';
import { AppLayout } from './components/AppLayout';
import { ScheduleView } from './components/ScheduleView';
import { ClassroomPresentation } from './components/ClassroomPresentation';
import { CurriculumExplorer } from './components/CurriculumExplorer';
import { AudioHubView } from './components/AudioHubView';
import { AudioManagerView } from './components/AudioManagerView';
import { SettingsView } from './components/SettingsView';
import { ImprovManagerView } from './components/ImprovManagerView';
import { ImprovPresentation } from './components/ImprovPresentation';
import { LessonExcelUploader } from './components/LessonExcelUploader';
import { getFirestoreCohorts, saveFirestoreCohort, deleteFirestoreCohort, DEFAULT_COURSES } from './services/firestoreService';
import { useAppRouter } from './hooks/useAppRouter';

function sanitizeCohort(cohort: Cohort): Cohort {
  let levelCode = cohort.level_code;
  if ((levelCode as string) === 'LEVEL_B') {
    levelCode = 'LEVEL_B_ERES';
  }
  let courseId = cohort.course_id;
  if (!courseId || (courseId as string) === 'course_level_b') {
    courseId = levelCode === 'LEVEL_A' ? 'course_level_a' : levelCode === 'LEVEL_B_EREL' ? 'course_level_b_erel' : 'course_level_b_eres';
  }

  const cleanedSessions = (cohort.sessions || []).map(s => {
    let cleanLessonId = s.lesson_id || '';
    if (cleanLessonId.startsWith('level_b_day_')) {
      cleanLessonId = cleanLessonId.replace('level_b_day_', 'level_b_eres_day_');
    }
    if (!cleanLessonId) {
      cleanLessonId = `${String(levelCode).toLowerCase()}_day_${s.session_number}`;
    }
    return {
      ...s,
      lesson_id: cleanLessonId
    };
  });

  return {
    ...cohort,
    level_code: levelCode,
    course_id: courseId,
    sessions: cleanedSessions
  };
}

export const App: React.FC = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("chunks_theme");
    }
  }, []);
  const { currentTab: activeTab, navigateToTab: setActiveTab } = useAppRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeCohortId, setActiveCohortId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [drillLessonId, setDrillLessonId] = useState<string>('level_b_eres_day_1');
  const [drillSessionNumber, setDrillSessionNumber] = useState<number>(1);
  const [improvPackageId, setImprovPackageId] = useState<string>('pkg_level_b_reflex_mastery');
  const [improvSessionNumber, setImprovSessionNumber] = useState<number>(1);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  // Load cohorts on mount
  useEffect(() => {
    async function loadData() {
      try {
        const loadedCohorts = await getFirestoreCohorts();
        if (loadedCohorts.length > 0) {
          const sanitized = loadedCohorts.map(sanitizeCohort);
          setCohorts(sanitized);
          setActiveCohortId(sanitized[0].id);
          if (sanitized[0].sessions?.[0]) {
            setDrillLessonId(sanitized[0].sessions[0].lesson_id);
            setDrillSessionNumber(sanitized[0].sessions[0].session_number);
          }
        } else {
          const defaultEres = createDefaultCohort("Level B - ERES Speaking Masterclass K24", "LEVEL_B_ERES");
          const defaultErel = createDefaultCohort("Level B - EREL Listening & Shadowing K18", "LEVEL_B_EREL");
          const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
          setCohorts([defaultEres, defaultErel, defaultA]);
          setActiveCohortId(defaultEres.id);
          if (defaultEres.sessions?.[0]) {
            setDrillLessonId(defaultEres.sessions[0].lesson_id);
            setDrillSessionNumber(defaultEres.sessions[0].session_number);
          }
          await saveFirestoreCohort(defaultEres);
          await saveFirestoreCohort(defaultErel);
          await saveFirestoreCohort(defaultA);
        }
      } catch (e) {
        console.error('Error loading cohorts:', e);
        const defaultEres = createDefaultCohort("Level B - ERES Speaking Masterclass K24", "LEVEL_B_ERES");
        const defaultErel = createDefaultCohort("Level B - EREL Listening & Shadowing K18", "LEVEL_B_EREL");
        const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
        setCohorts([defaultEres, defaultErel, defaultA]);
        setActiveCohortId(defaultEres.id);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCohort = cohorts.find(c => c.id === activeCohortId) || cohorts[0] || createDefaultCohort();

  const handleUpdateCohort = async (updated: Cohort) => {
    const sanitized = sanitizeCohort(updated);
    setCohorts(prev => prev.map(c => c.id === sanitized.id ? sanitized : c));
    await saveFirestoreCohort(sanitized);
  };

  const handleCreateCohort = async (newCohort: Cohort) => {
    const sanitized = sanitizeCohort(newCohort);
    setCohorts(prev => [sanitized, ...prev]);
    setActiveCohortId(sanitized.id);
    setActiveTab('schedule');
    await saveFirestoreCohort(sanitized);
  };

  const handleResetToDefault = async () => {
    if (window.confirm("Are you sure you want to reset and restore the default 15-session cohorts?")) {
      const defaultEres = createDefaultCohort("Level B - ERES Speaking Masterclass K24", "LEVEL_B_ERES");
      const defaultErel = createDefaultCohort("Level B - EREL Listening & Shadowing K18", "LEVEL_B_EREL");
      const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
      setCohorts([defaultEres, defaultErel, defaultA]);
      setActiveCohortId(defaultEres.id);
      if (defaultEres.sessions?.[0]) {
        setDrillLessonId(defaultEres.sessions[0].lesson_id);
        setDrillSessionNumber(defaultEres.sessions[0].session_number);
      }
      await saveFirestoreCohort(defaultEres);
      await saveFirestoreCohort(defaultErel);
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
    } else {
      const course = DEFAULT_COURSES.find(c => c.id === courseId);
      const level = (course?.level_code || 'LEVEL_B_ERES') as any;
      const title = course?.title || `Cohort - ${courseId}`;
      const newCohort = createDefaultCohort(title, level);
      newCohort.course_id = courseId;
      handleCreateCohort(newCohort);
    }
  };

  const handleLaunchProjectorForLesson = (lessonId: string, sessionNumber: number) => {
    let cleanId = lessonId;
    if (cleanId?.startsWith('level_b_day_')) {
      cleanId = cleanId.replace('level_b_day_', 'level_b_eres_day_');
    }
    setDrillLessonId(cleanId);
    setDrillSessionNumber(sessionNumber);
    setActiveTab('projector');
  };

  const handleLaunchImprovPresentation = (pkgId: string, sessionNum: number = 1) => {
    setImprovPackageId(pkgId);
    setImprovSessionNumber(sessionNum);
    setActiveTab('improv-presentation');
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FBFBFC] text-zinc-600 font-mono text-xs gap-3">
        <img src="/logo.png" alt="CHUNKS" className="h-9 w-auto object-contain rounded-md animate-pulse shadow-sm" />
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
      selectedCourseId={activeCohort?.course_id || 'course_level_b_eres'}
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
          courseLevel={activeCohort.level_code}
          onSelectLesson={(newLessonId, sessionNumber) => {
            let cleanId = newLessonId;
            if (cleanId?.startsWith('level_b_day_')) {
              cleanId = cleanId.replace('level_b_day_', 'level_b_eres_day_');
            }
            setDrillLessonId(cleanId);
            if (sessionNumber !== undefined) {
              setDrillSessionNumber(sessionNumber);
            }
          }}
        />
      )}

      {activeTab === 'improv-manager' && (
        <ImprovManagerView
          onLaunchPresentation={handleLaunchImprovPresentation}
          audioSettings={activeCohort.audio_settings}
        />
      )}

      {activeTab === 'improv-presentation' && (
        <ImprovPresentation
          packageId={improvPackageId}
          sessionNumber={improvSessionNumber}
          onExit={() => setActiveTab('improv-manager')}
          audioSettings={activeCohort.audio_settings}
          onSelectPackage={(newPkgId, newSessionNum) => {
            setImprovPackageId(newPkgId);
            if (newSessionNum !== undefined) {
              setImprovSessionNumber(newSessionNum);
            }
          }}
        />
      )}

      {activeTab === 'curriculum' && (
        <CurriculumExplorer
          onLaunchProjectorForLesson={handleLaunchProjectorForLesson}
          defaultCourseLevel={activeCohort.level_code}
        />
      )}

      {activeTab === 'audio-manager' && (
        <AudioManagerView
          cohortAudioSettings={activeCohort.audio_settings}
          onUpdateAudioSettings={handleUpdateAudioSettings}
          onLaunchProjectorForLesson={handleLaunchProjectorForLesson}
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
