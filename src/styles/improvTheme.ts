/**
 * CHUNKS Improv Design System & Theme Contract
 * Projector-optimized typography, high-contrast tokens & semantic badges
 * strictly adhering to the Be Vietnam Pro typography and zero-overflow guarantee.
 */

export interface SemanticHintBadge {
  label: string;
  badgeClass: string;
  darkBadgeClass: string;
  dotClass: string;
  accentColor: string;
}

/**
 * Auto-resize formula for Improv Stage hint cards so text never overflows:
 * - 1-2 words (or char count <= 20): text-2xl sm:text-3xl md:text-4xl
 * - 3-5 words (or char count <= 45): text-xl sm:text-2xl md:text-3xl
 * - 6+ words (longer sentences): text-lg sm:text-xl md:text-2xl
 * All with leading-snug tracking-tight and break-words for zero cutoff/overflow!
 */
export function getResponsiveHintTypography(text: string): string {
  const clean = (text || '').trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charLength = clean.length;

  if (wordCount <= 2 && charLength <= 20) {
    return 'text-2xl sm:text-3xl md:text-4xl leading-snug tracking-tight break-words font-black font-display';
  }
  if (wordCount <= 5 && charLength <= 45) {
    return 'text-xl sm:text-2xl md:text-3xl leading-snug tracking-tight break-words font-black font-display';
  }
  return 'text-lg sm:text-xl md:text-2xl leading-snug tracking-tight break-words font-bold font-display';
}

/**
 * Canonical typography & text classes for Improv views
 */
export const improvText = {
  // Primary text (High contrast, crisp)
  primary: 'text-zinc-950 dark:text-zinc-50 font-bold',
  primaryLight: 'text-zinc-950 font-bold',
  primaryDark: 'text-zinc-50 font-bold',

  // Secondary text / subtitles
  secondary: 'text-zinc-700 dark:text-zinc-300 font-medium',
  secondaryLight: 'text-zinc-700 font-medium',
  secondaryDark: 'text-zinc-300 font-medium',

  // Translations (crisp high contrast, no washed-out grays)
  translation: 'text-zinc-900 dark:text-zinc-100 font-bold',
  translationLight: 'text-zinc-900 font-bold',
  translationDark: 'text-zinc-100 font-bold',

  // English subtext in brackets (Key L/P Drawer)
  subtextEnglish: 'text-zinc-600 dark:text-zinc-300 font-mono font-semibold',
  subtextEnglishLight: 'text-zinc-600 font-mono font-semibold',
  subtextEnglishDark: 'text-zinc-300 font-mono font-semibold',

  // Monospace Stage Header Info Pill (Minimal Standard)
  stageHeaderPill:
    'text-xs font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 tracking-wider',

  // Item counter pill
  itemCounterPill:
    'text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold',

  // Arrow connector
  arrowConnector:
    'text-[#DC2626] font-black text-xs sm:text-sm mx-1.5 select-none shrink-0',

  // Active playing text highlight
  speakingText:
    'text-[#DC2626] animate-pulse',

  // Badges taxonomy
  badgeKeyword: {
    label: 'Keyword',
    light: 'bg-red-50 text-red-700 border-red-200',
    dark: 'bg-red-950/60 text-red-300 border-red-800',
    dot: 'bg-[#DC2626]',
    accent: '#DC2626'
  },
  badgeLogic: {
    label: 'Logic word',
    light: 'bg-amber-50 text-amber-800 border-amber-200',
    dark: 'bg-amber-950/60 text-amber-300 border-amber-800',
    dot: 'bg-amber-500',
    accent: '#F59E0B'
  },
  badgeFancy: {
    label: 'Fancy word',
    light: 'bg-purple-50 text-purple-800 border-purple-200',
    dark: 'bg-purple-950/60 text-purple-300 border-purple-800',
    dot: 'bg-purple-500',
    accent: '#A855F7'
  },
  badgeEnding: {
    label: 'Ending',
    light: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dark: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
    dot: 'bg-emerald-500',
    accent: '#10B981'
  }
};

/**
 * High-Contrast Color Palettes (Light vs Focus Dark Mode)
 */
export const improvColors = {
  light: {
    stageBg: 'bg-[#FAFAFA]',
    cardBg: 'bg-white',
    cardBorder: 'border-zinc-200/90 shadow-sm',
    unrevealedBg: 'bg-[#F3F4F6] border-2 border-dashed border-zinc-300 hover:border-zinc-400',
    speakingRing: 'bg-red-50/50 ring-2 ring-[#DC2626]/70 border-red-300',
    drawerBg: 'bg-white border-zinc-200 text-zinc-900',
    drawerCard: 'border-[#E8E8EC] hover:border-zinc-300 bg-white hover:bg-zinc-50/70',
    textPrimary: 'text-zinc-950',
    textSecondary: 'text-zinc-700',
    textMuted: 'text-zinc-500',
    accent: '#DC2626'
  },
  dark: {
    stageBg: 'bg-[#09090B]',
    cardBg: 'bg-[#121214]',
    cardBorder: 'border-zinc-800 shadow-sm',
    unrevealedBg: 'bg-[#18181B] border-2 border-dashed border-zinc-700 hover:border-zinc-500',
    speakingRing: 'bg-red-950/20 ring-2 ring-[#DC2626]/80 border-red-900',
    drawerBg: 'bg-[#18181B] border-zinc-800 text-white',
    drawerCard: 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800/90',
    textPrimary: 'text-zinc-50',
    textSecondary: 'text-zinc-300',
    textMuted: 'text-zinc-400',
    accent: '#DC2626'
  }
};

/**
 * Unified Semantic Badge Resolver
 */
export function getSemanticHintBadge(typeFunction: string, hintIndex?: number): SemanticHintBadge {
  const norm = (typeFunction || '').toLowerCase().trim();

  if (norm.includes('key') || norm.includes('seed') || norm.includes('core')) {
    return {
      label: 'Keyword',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      darkBadgeClass: 'bg-red-950/60 text-red-300 border-red-800',
      dotClass: 'bg-[#DC2626]',
      accentColor: '#DC2626'
    };
  }
  if (norm.includes('logic') || norm.includes('colloc') || norm.includes('slot') || norm.includes('connect')) {
    return {
      label: 'Logic word',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      darkBadgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800',
      dotClass: 'bg-amber-500',
      accentColor: '#F59E0B'
    };
  }
  if (
    norm.includes('fancy') || 
    norm.includes('adv') || 
    norm.includes('contrast') || 
    norm.includes('nuance') || 
    norm.includes('idiom') || 
    norm.includes('slang')
  ) {
    return {
      label: 'Fancy word',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      darkBadgeClass: 'bg-purple-950/60 text-purple-300 border-purple-800',
      dotClass: 'bg-purple-500',
      accentColor: '#A855F7'
    };
  }
  if (
    norm.includes('end') || 
    norm.includes('resol') || 
    norm.includes('context') || 
    norm.includes('example') || 
    norm.includes('sentence')
  ) {
    return {
      label: 'Ending',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      darkBadgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
      dotClass: 'bg-emerald-500',
      accentColor: '#10B981'
    };
  }
  if (norm.includes('wh') || norm.includes('quest') || norm.includes('dialog') || norm.includes('react')) {
    return {
      label: 'WH word',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      darkBadgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800',
      dotClass: 'bg-blue-500',
      accentColor: '#3B82F6'
    };
  }

  // Fallback by hint index order
  if (hintIndex !== undefined) {
    switch (hintIndex) {
      case 0:
        return {
          label: 'Keyword',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          darkBadgeClass: 'bg-red-950/60 text-red-300 border-red-800',
          dotClass: 'bg-[#DC2626]',
          accentColor: '#DC2626'
        };
      case 1:
        return {
          label: 'Logic word',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          darkBadgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800',
          dotClass: 'bg-amber-500',
          accentColor: '#F59E0B'
        };
      case 2:
        return {
          label: 'Fancy word',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
          darkBadgeClass: 'bg-purple-950/60 text-purple-300 border-purple-800',
          dotClass: 'bg-purple-500',
          accentColor: '#A855F7'
        };
      default:
        return {
          label: 'Ending',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          darkBadgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
          dotClass: 'bg-emerald-500',
          accentColor: '#10B981'
        };
    }
  }

  return {
    label: typeFunction || 'Hint',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    darkBadgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    dotClass: 'bg-zinc-500',
    accentColor: '#71717A'
  };
}
