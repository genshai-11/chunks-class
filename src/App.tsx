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
import { IMPROV_SET_01 } from './data/improvSet01And02';

function sanitizeCohort(cohort: Cohort): Cohort {
  let levelCode = cohort.level_code;
  let courseId = cohort.course_id;

  if (levelCode === 'LEVEL_B' || levelCode === 'LEVEL_B_ERE' || courseId === 'course_level_b' || courseId === 'course_level_b_ere') {
    levelCode = 'LEVEL_B';
    courseId = 'course_level_b';
  } else if (!courseId) {
    courseId = levelCode === 'LEVEL_A' ? 'course_level_a' : levelCode === 'LEVEL_B_EREL' ? 'course_level_b_erel' : 'course_level_b_eres';
  }

  const cleanedSessions = (cohort.sessions || []).map(s => {
    let cleanLessonId = s.lesson_id || '';
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
  const [drillLessonId, setDrillLessonId] = useState<string>('level_b_day_1');
  const [drillSessionNumber, setDrillSessionNumber] = useState<number>(1);
  const [improvPackageId, setImprovPackageId] = useState<string>(IMPROV_SET_01.id);
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
          const defaultActive = sanitized.find(c => c.level_code === 'LEVEL_B' || c.course_id === 'course_level_b') || sanitized.find(c => c.level_code === 'LEVEL_B_ERE') || sanitized[0];
          setActiveCohortId(defaultActive.id);
          if (defaultActive.sessions?.[0]) {
            setDrillLessonId(defaultActive.sessions[0].lesson_id);
            setDrillSessionNumber(defaultActive.sessions[0].session_number);
          }
        } else {
          const defaultB = createDefaultCohort("Level B - ERE Spoken Reflexes K30", "LEVEL_B");
          const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
          const defaultErel = createDefaultCohort("Level B - EREL Listening & Shadowing K18", "LEVEL_B_EREL");
          const defaultEres = createDefaultCohort("Level B - ERES Speaking Masterclass K24", "LEVEL_B_ERES");
          setCohorts([defaultB, defaultA, defaultErel, defaultEres]);
          setActiveCohortId(defaultB.id);
          if (defaultB.sessions?.[0]) {
            setDrillLessonId(defaultB.sessions[0].lesson_id);
            setDrillSessionNumber(defaultB.sessions[0].session_number);
          }
          await saveFirestoreCohort(defaultB);
          await saveFirestoreCohort(defaultA);
          await saveFirestoreCohort(defaultErel);
          await saveFirestoreCohort(defaultEres);
        }
      } catch (e) {
        console.error('Error loading cohorts:', e);
        const defaultB = createDefaultCohort("Level B - ERE Spoken Reflexes K30", "LEVEL_B");
        const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
        const defaultErel = createDefaultCohort("Level B - EREL Listening & Shadowing K18", "LEVEL_B_EREL");
        const defaultEres = createDefaultCohort("Level B - ERES Speaking Masterclass K24", "LEVEL_B_ERES");
        setCohorts([defaultB, defaultA, defaultErel, defaultEres]);
        setActiveCohortId(defaultB.id);
        if (defaultB.sessions?.[0]) {
          setDrillLessonId(defaultB.sessions[0].lesson_id);
          setDrillSessionNumber(defaultB.sessions[0].session_number);
        }
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

  const handleDeleteCohort = async (cohortId: string) => {
    try {
      await deleteFirestoreCohort(cohortId);
    } catch (e) {
      console.warn('Failed to delete cohort from Firestore:', e);
    }
    const updated = cohorts.filter(c => c.id !== cohortId);
    setCohorts(updated);
    try {
      localStorage.setItem('chunks_firestore_synced_cohorts', JSON.stringify(updated));
    } catch {}
    if (activeCohortId === cohortId) {
      const nextActive = updated[0];
      if (nextActive) {
        setActiveCohortId(nextActive.id);
        const firstSession = nextActive.sessions?.[0];
        if (firstSession) {
          setDrillLessonId(firstSession.lesson_id);
          setDrillSessionNumber(firstSession.session_number);
        }
      }
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm("Are you sure you want to reset and restore default cohorts?")) {
      const defaultB = createDefaultCohort("Level B - ERE Spoken Reflexes K30", "LEVEL_B");
      const defaultA = createDefaultCohort("Level A - Foundation Chunks K12", "LEVEL_A");
      const defaultErel = createDefaultCohort("Level B - EREL Listening & Shadowing K18", "LEVEL_B_EREL");
      const defaultEres = createDefaultCohort("Level B - ERES Speaking Masterclass K24", "LEVEL_B_ERES");
      setCohorts([defaultB, defaultA, defaultErel, defaultEres]);
      setActiveCohortId(defaultB.id);
      if (defaultB.sessions?.[0]) {
        setDrillLessonId(defaultB.sessions[0].lesson_id);
        setDrillSessionNumber(defaultB.sessions[0].session_number);
      }
      await saveFirestoreCohort(defaultB);
      await saveFirestoreCohort(defaultA);
      await saveFirestoreCohort(defaultErel);
      await saveFirestoreCohort(defaultEres);
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
      const level = (course?.level_code || (courseId === 'course_level_b' ? 'LEVEL_B' : 'LEVEL_B_ERES')) as any;
      const title = course?.title || `Cohort - ${courseId}`;
      const newCohort = createDefaultCohort(title, level);
      newCohort.course_id = courseId;
      handleCreateCohort(newCohort);
    }
  };

  const handleLaunchProjectorForLesson = (lessonId: string, sessionNumber: number) => {
    setDrillLessonId(lessonId);
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
          onDeleteCohort={handleDeleteCohort}
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
            setDrillLessonId(newLessonId);
            if (sessionNumber !== undefined) {
              setDrillSessionNumber(sessionNumber);
            }
          }}
          onUpdateAudioSettings={handleUpdateAudioSettings}
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
          defaultCourseLevel={activeCohort.level_code}
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
