import React, { useState } from 'react';
import { Cohort } from '../types';
import { 
  Cloud, 
  Keyboard, 
  RotateCcw, 
  Check, 
  Sliders,
  Server,
  Layers,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  cohort: Cohort;
  onUpdateCohort: (cohort: Cohort) => void;
  onResetToDefault: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cohort,
  onUpdateCohort,
  onResetToDefault
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] uppercase">
            Google Cloud Serverless & Cohort Infrastructure
          </span>
          <span className="text-xs text-[#16A34A] font-medium flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
            Spark Tier $0/mo Active
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl text-[#0A0A0A] tracking-tight">
          Cohort Settings & System Infrastructure
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Configure active cohort parameters, inspect Firestore local-first sync, and review presenter hardware key bindings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Google Cloud Infrastructure Specs */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8EC]">
            <Cloud className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-display font-bold text-base text-[#0A0A0A]">
              Google Cloud Architecture Specs
            </h2>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between">
              <span className="text-[#6B6B6B]">GCP Project ID:</span>
              <span className="font-bold text-[#0A0A0A]">chunks-voicecloning-genshai</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between">
              <span className="text-[#6B6B6B]">GCP Region:</span>
              <span className="font-bold text-[#0A0A0A]">asia-east1</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between">
              <span className="text-[#6B6B6B]">Firestore Location:</span>
              <span className="font-bold text-[#0A0A0A]">nam5 (Dual-write cache enabled)</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between">
              <span className="text-[#6B6B6B]">Audio Storage Bucket:</span>
              <span className="font-bold text-[#0A0A0A] truncate max-w-[200px]">
                gs://genshai-chunks-audio
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
              <span>Google Cloud TTS Quota:</span>
              <span className="font-bold">4,000,000 chars/month Free</span>
            </div>
          </div>
        </div>

        {/* 3. Hardware Slide Clicker Guide */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8EC]">
            <Keyboard className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-display font-bold text-base text-[#0A0A0A]">
              Wireless Clicker & Keyboard Bindings
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC]">
              <span className="font-medium text-[#0A0A0A]">Next Chunk (Forward):</span>
              <span className="font-mono font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded">PageDown / Right / Space</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC]">
              <span className="font-medium text-[#0A0A0A]">Previous Chunk (Back):</span>
              <span className="font-mono font-bold text-[#0A0A0A] bg-zinc-100 px-2 py-0.5 rounded">PageUp / Left</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC]">
              <span className="font-medium text-[#0A0A0A]">Toggle Blackout Mode:</span>
              <span className="font-mono font-bold text-[#0A0A0A] bg-zinc-100 px-2 py-0.5 rounded">Key B / Period (.)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC]">
              <span className="font-medium text-[#0A0A0A]">Toggle Translation Reveal:</span>
              <span className="font-mono font-bold text-[#0A0A0A] bg-zinc-100 px-2 py-0.5 rounded">Key V</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC]">
              <span className="font-medium text-[#0A0A0A]">Repeat Audio Drill:</span>
              <span className="font-mono font-bold text-[#0A0A0A] bg-zinc-100 px-2 py-0.5 rounded">Key R</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] border border-[#E8E8EC]">
              <span className="font-medium text-[#0A0A0A]">Toggle Parts Navigation:</span>
              <span className="font-mono font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded">Key P</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Cohort Metadata & Reset */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-[#0A0A0A]">
          Active Cohort Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
              Cohort Title:
            </label>
            <input
              type="text"
              value={cohort.title}
              onChange={(e) => onUpdateCohort({ ...cohort, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
              Teacher ID:
            </label>
            <input
              type="text"
              value={cohort.teacher_id}
              onChange={(e) => onUpdateCohort({ ...cohort, teacher_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-[#6B6B6B]">
            All schedule updates and session progress are preserved locally with cloud sync.
          </p>
          <button
            onClick={onResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Cohorts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
