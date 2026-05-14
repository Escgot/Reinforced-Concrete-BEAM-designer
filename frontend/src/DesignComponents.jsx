import React from 'react';
import { motion } from 'framer-motion';

/* ── Circular Utilization Gauge ── */
export function UtilizationRing({ value, size = 130, strokeWidth = 10, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value || 0, 0), 1.5);
  const fillPct = Math.min(clamped, 1.0);
  const offset = circumference - fillPct * circumference;
  const pct = Math.round((value || 0) * 100);

  const getColor = (v) => {
    if (v <= 0.5) return { s: '#10b981', t: 'text-emerald-400', label: 'EFFICIENT' };
    if (v <= 0.85) return { s: '#3b82f6', t: 'text-blue-400', label: 'OPTIMAL' };
    if (v <= 1.0) return { s: '#f59e0b', t: 'text-amber-400', label: 'NEAR LIMIT' };
    return { s: '#ef4444', t: 'text-rose-400', label: 'EXCEEDED' };
  };
  const c = getColor(value || 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
          <motion.circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={c.s} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${c.t}`}>{pct}%</span>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-0.5">{c.label}</span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">{label}</span>
      )}
    </div>
  );
}

/* ── Utilization Progress Bar (inline) ── */
export function UtilizationBar({ value, height = 6 }) {
  const pct = Math.min((value || 0) * 100, 100);
  const getColor = (v) => {
    if (v <= 0.5) return 'bg-emerald-500';
    if (v <= 0.85) return 'bg-blue-500';
    if (v <= 1.0) return 'bg-amber-500';
    return 'bg-rose-500';
  };
  return (
    <div className="w-full bg-white/5 rounded-full overflow-hidden" style={{ height }}>
      <motion.div
        className={`h-full rounded-full ${getColor(value)}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

/* ── Formula Trace Table ── */
export function FormulaTrace({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="bg-[#0B0F19]/60 rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Calculation Trace
        </h5>
      </div>
      <div className="divide-y divide-white/5">
        {steps.map((step, i) => (
          <div key={i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{step.description}</span>
              <span className="text-xs font-black text-slate-200 whitespace-nowrap">{step.result}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono leading-relaxed">
              <span className="text-slate-400">{step.formula}</span>
              <br />
              <span>{step.substitution}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Verification Check Row ── */
export function VerificationTable({ checks }) {
  return (
    <div className="bg-[#0B0F19]/50 rounded-2xl border border-white/5 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            <th className="py-3 px-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Parameter</th>
            <th className="py-3 px-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Design Value</th>
            <th className="py-3 px-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Limit</th>
            <th className="py-3 px-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Check</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c, i) => {
            const ok = c.pass;
            return (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="py-3 px-5 text-xs font-bold text-slate-400">
                  {c.label}
                  {c.clause && <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] tracking-widest">{c.clause}</span>}
                </td>
                <td className="py-3 px-5 text-right font-black text-slate-200 text-sm">{c.design} <span className="text-[9px] text-slate-500 ml-1">{c.unit}</span></td>
                <td className="py-3 px-5 text-right font-bold text-slate-400 text-sm">{c.limit} <span className="text-[9px] text-slate-500 ml-1">{c.unit}</span></td>
                <td className="py-3 px-5 text-center">
                  <span className={`inline-block w-6 h-6 rounded-lg text-[10px] font-black leading-6 ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {ok ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
