import React, { useState, useRef } from 'react';
import { LessonPart } from '../types';

interface PresentationProgressBarProps {
  currentIndex: number;
  totalChunks: number;
  parts?: LessonPart[];
  onSeek?: (index: number) => void;
  highContrastDark?: boolean;
  className?: string;
}

export const PresentationProgressBar: React.FC<PresentationProgressBarProps> = ({
  currentIndex,
  totalChunks,
  parts = [],
  onSeek,
  highContrastDark = false,
  className = ''
}) => {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; index: number; percent: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  if (totalChunks <= 0) return null;

  const currentStep = currentIndex + 1;
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalChunks) * 100));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = rect.width > 0 ? clickX / rect.width : 0;
    const targetIndex = Math.min(totalChunks - 1, Math.max(0, Math.floor(ratio * totalChunks)));
    const percent = Math.round((targetIndex + 1) / totalChunks * 100);

    setHoverPosition({
      x: clickX,
      index: targetIndex,
      percent
    });
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !onSeek) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = rect.width > 0 ? clickX / rect.width : 0;
    const targetIndex = Math.min(totalChunks - 1, Math.max(0, Math.floor(ratio * totalChunks)));
    onSeek(targetIndex);
  };

  return (
    <div
      id="presentation-progress-bar-wrapper"
      className={`w-full relative select-none ${className}`}
    >
      <div
        ref={trackRef}
        id="presentation-progress-track"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalChunks}
        aria-label={`Lesson progress: Chunk ${currentStep} of ${totalChunks}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full relative h-2 group cursor-pointer transition-all duration-150 overflow-hidden ${
          highContrastDark ? 'bg-zinc-800/90 hover:h-2.5' : 'bg-[#E8E8EC] hover:h-2.5'
        }`}
      >
        {/* Active Progress Fill */}
        <div
          id="presentation-progress-fill"
          className="h-full bg-[#DC2626] transition-all duration-200 ease-out relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Leading Glow Point */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 shadow-xs" />
        </div>

        {/* Part Boundary Markers */}
        {parts.length > 1 && parts.map((part, pIdx) => {
          if (pIdx === 0) return null;
          const partPercent = (part.startIndex / totalChunks) * 100;
          return (
            <div
              key={part.partNumber}
              className={`absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none transition-opacity ${
                highContrastDark ? 'bg-zinc-950/60' : 'bg-white/80'
              }`}
              style={{ left: `${partPercent}%` }}
              title={`Part ${part.partNumber}: ${part.title}`}
            />
          );
        })}
      </div>

      {/* Hover Scrubbing Floating Indicator Tooltip */}
      {hoverPosition && (
        <div
          className={`absolute top-3.5 -translate-x-1/2 z-30 pointer-events-none px-2 py-1 rounded-md text-[10px] font-mono font-bold shadow-lg border backdrop-blur-sm whitespace-nowrap transition-transform duration-75 ${
            highContrastDark
              ? 'bg-zinc-900/95 text-zinc-100 border-zinc-700'
              : 'bg-[#0A0A0A] text-white border-zinc-800'
          }`}
          style={{
            left: `${hoverPosition.x}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <span>Chunk {hoverPosition.index + 1} / {totalChunks}</span>
          <span className="text-[#DC2626] ml-1.5">({hoverPosition.percent}%)</span>
        </div>
      )}
    </div>
  );
};
