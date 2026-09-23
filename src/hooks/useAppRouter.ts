import { useState, useEffect, useCallback } from 'react';
import { NavTab } from '../types';

const PATH_TAB_MAP: Record<string, NavTab> = {
  '/': 'schedule',
  '/schedule': 'schedule',
  '/presentation': 'projector',
  '/projector': 'projector',
  '/curriculum': 'curriculum',
  '/audio-hub': 'audio-hub',
  '/audio-manager': 'audio-manager',
  '/audio': 'audio-manager',
  '/settings': 'settings',
  '/improv-studio': 'improv-manager',
  '/improv-manager': 'improv-manager',
  '/improv': 'improv-manager',
  '/improv-presentation': 'improv-presentation',
  '/improv-drill': 'improv-presentation',
  '/resource-manager': 'grammar-portal',
  '/manage-resource': 'grammar-portal',
  '/resources': 'grammar-portal',
  '/grammar-manager': 'grammar-portal',
  '/grammar-portal': 'grammar-portal',
  '/grammar-studio': 'grammar-portal',
  '/grammar-review': 'grammar-portal',
  '/curator': 'grammar-portal'
};

const TAB_PATH_MAP: Record<NavTab, string> = {
  'schedule': '/schedule',
  'projector': '/presentation',
  'curriculum': '/curriculum',
  'audio-hub': '/audio-hub',
  'audio-manager': '/audio-manager',
  'settings': '/settings',
  'improv-manager': '/improv-studio',
  'improv-presentation': '/improv-presentation',
  'resource-manager': '/grammar-studio',
  'grammar-portal': '/grammar-studio'
};

function getTabFromPath(path: string): NavTab {
  const normalized = path.replace(/\/$/, '') || '/';
  return PATH_TAB_MAP[normalized] || 'schedule';
}

export function useAppRouter() {
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window === 'undefined') return 'schedule';
    return getTabFromPath(window.location.pathname);
  });

  const navigateToTab = useCallback((tab: NavTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = TAB_PATH_MAP[tab] || '/schedule';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setCurrentTab(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    currentTab,
    navigateToTab,
    currentPath: TAB_PATH_MAP[currentTab] || '/schedule'
  };
}
