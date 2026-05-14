import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, Download, Activity, Layers, Droplet, MoveDiagonal,
  Box, Shield, ArrowRight, CheckCircle2, XCircle, AlertTriangle, ChevronRight, BookOpen,
  Settings, ChevronDown, Info, FolderOpen, Save, Plus, X, List
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BeamCrossSection from './BeamCrossSection';
import logo from './assets/logo.png';
import { UtilizationRing, UtilizationBar, FormulaTrace, VerificationTable } from './DesignComponents';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SelectField = ({ label, name, value, onChange, options, info }) => (
  <div className="flex flex-col mb-4 group relative">
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors">{label}</label>
      {info && (
        <div className="relative group/info">
          <Info className="w-3 h-3 text-slate-600 hover:text-blue-400 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/5">
            {info}
          </div>
        </div>
      )}
    </div>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-4 pr-10 py-3 bg-[#0B0F19] border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner text-slate-100 outline-none appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const InputField = ({ label, name, type = 'number', value, onChange, unit, step = "1", min = "0", readOnly = false, info }) => (
  <div className="flex flex-col mb-4 group relative">
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors">{label}</label>
      {info && (
        <div className="relative group/info">
          <Info className="w-3 h-3 text-slate-600 hover:text-blue-400 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/5">
            {info}
          </div>
        </div>
      )}
    </div>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        readOnly={readOnly}
        className={cn(
          "w-full pl-4 pr-12 py-3 bg-[#0B0F19] border border-white/10 rounded-xl transition-all shadow-inner text-slate-100 placeholder-slate-600 outline-none",
          readOnly ? "opacity-60 cursor-not-allowed border-dashed bg-slate-900/50" : "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        )}
      />
      {unit && (
        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium text-xs">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, active, collapsible, isOpen, onToggle }) => (
  <div 
    className={cn(
      "flex items-center justify-between pb-3 border-b border-white/5 mb-5 cursor-pointer", 
      active ? "text-blue-400" : "text-slate-300"
    )}
    onClick={onToggle}
  >
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg transition-colors", active ? "bg-blue-500/10" : "bg-white/5")}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-outfit font-bold text-sm tracking-wider uppercase">{title}</h3>
    </div>
    {collapsible && (
      <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
    )}
  </div>
);

function TabButton({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
        active 
          ? "text-blue-500 border-blue-500 bg-blue-500/5" 
          : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}

function SummaryCard({ title, status, value1, label1, value2, label2, icon: Icon, utilization }) {
  const isOK = status?.startsWith('OK');
  const pct = Math.round((utilization || 0) * 100);
  const getUC = (v) => { if(v<=0.5) return 'text-emerald-400'; if(v<=0.85) return 'text-blue-400'; if(v<=1.0) return 'text-amber-400'; return 'text-rose-400'; };
  return (
    <div className="bg-[#151B2B] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/10 transition-colors group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{title}</span>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter", 
          isOK ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border border-rose-500/20")}>
          {isOK ? 'OK' : 'FAIL'}
        </div>
      </div>
      {utilization !== undefined && (
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${getUC(utilization)}`}>{pct}%</span>
          <div className="flex-1"><UtilizationBar value={utilization} /></div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">{label1}</p>
          <p className="text-lg font-black text-slate-100">{value1}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">{label2}</p>
          <p className="text-lg font-black text-slate-100">{value2}</p>
        </div>
      </div>
    </div>
  );
}

function ResultTable({ data }) {
  return (
    <div className="bg-[#0B0F19]/50 rounded-2xl border border-white/5 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
              <td className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                {item.label}
                {item.clause && <span className="ml-3 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] tracking-widest">{item.clause}</span>}
              </td>
              <td className="py-4 px-6 text-right font-black text-slate-200">
                <span className={cn(item.color)}>{item.value}</span>
                <span className="text-[10px] text-slate-500 ml-1.5 font-bold uppercase tracking-widest">{item.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState({
    b: 300, h: 500, bf: 300, hf: 0, cover: 30, span: 6000,
    fck: 30, fyk: 500, fywd: 500,
    MEd: 120, VEd: 80,
    bar_diameter: 16, link_diameter: 8, n_bars: 3, n_legs: 2,
    wk_limit: 0.3, k_sys: 1.0,
    gamma_c: 1.5, gamma_s: 1.15, alpha_cc: 0.85,
    exposureClass: 'XC2/XC3', concreteClass: 'C30/37', steelGrade: 'B500B',
    isTBeam: false
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('BENDING DESIGN');
  
  // Project Management State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [beams, setBeams] = useState([]);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newBeamName, setNewBeamName] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/_/backend/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('/_/backend/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, description: '' })
      });
      if (res.ok) {
        const proj = await res.json();
        setProjects([...projects, proj]);
        setNewProjectName('');
        selectProject(proj);
      }
    } catch (e) {
      console.error("Failed to create project", e);
    }
  };

  const selectProject = async (proj) => {
    setSelectedProject(proj);
    try {
      const res = await fetch(`/_/backend/projects/${proj.id}/beams`);
      if (res.ok) {
        const data = await res.json();
        setBeams(data);
      }
    } catch (e) {
      console.error("Failed to fetch beams", e);
    }
  };

  const saveBeam = async () => {
    if (!selectedProject || !newBeamName.trim()) return;
    try {
      const res = await fetch(`/_/backend/projects/${selectedProject.id}/beams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBeamName, parameters: formData })
      });
      if (res.ok) {
        const beam = await res.json();
        setBeams([...beams, beam]);
        setNewBeamName('');
        setShowSaveModal(false);
        setResults(beam.results);
      } else {
        const err = await res.json();
        alert("Failed to save: " + JSON.stringify(err));
      }
    } catch (e) {
      console.error("Failed to save beam", e);
    }
  };

  const loadBeam = (beam) => {
    setFormData(beam.parameters);
    setResults(beam.results);
    setShowProjectManager(false);
  };
  
  // UI States
  const [openSections, setOpenSections] = useState({
    geometry: true,
    material: true,
    loading: true,
    reinforcement: true,
    advanced: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : (isNaN(value) || value === '' ? value : parseFloat(value));
    
    let updates = { [name]: val };
    
    if (name === 'exposureClass') {
      const coverMap = { 'XC1': 25, 'XC2/XC3': 30, 'XD1/XS1': 40, 'XD2/XS2': 45, 'XD3/XS3': 50 };
      if (coverMap[value]) updates.cover = coverMap[value];
    }
    if (name === 'concreteClass') {
       updates.fck = parseInt(value.split('/')[0].replace('C', ''));
    }
    if (name === 'isTBeam') {
      if (checked) {
        updates.hf = 100;
        updates.bf = formData.b + 200;
      } else {
        updates.hf = 0;
        updates.bf = formData.b;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleCalculate = async () => {
    setLoading(true); setError(null);
    try {
      const payload = { 
        ...formData,
        bf: formData.isTBeam ? formData.bf : null,
        hf: formData.isTBeam ? formData.hf : null
      };

      const response = await fetch('/_/backend/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        // Handle FastAPI validation errors (which are lists in 'detail')
        const detail = errData.detail;
        if (Array.isArray(detail)) {
          throw new Error(detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', '));
        } else if (typeof detail === 'object') {
          throw new Error(JSON.stringify(detail));
        }
        throw new Error(detail || 'Calculation failed');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Calculation Error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const payload = { 
        ...formData,
        bf: formData.isTBeam ? formData.bf : null,
        hf: formData.isTBeam ? formData.hf : null
      };
      const response = await fetch('/_/backend/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'RC_Beam_Calculation.pdf';
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0F19] text-slate-100 font-inter">
      
      {/* SIDEBAR: INPUT PARAMETERS */}
      <div className="w-full md:w-[360px] lg:w-[400px] bg-[#151B2B] border-r border-white/5 flex flex-col h-screen flex-shrink-0 z-20">
        <div className="p-6 border-b border-white/5 bg-[#151B2B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/20 bg-[#151B2B] border border-white/10">
              <img src={logo} alt="RC Beam Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-lg font-black font-outfit tracking-tight">RC Beam Designer</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Eurocode 2 (EN 1992-1-1)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          
          <section>
            <SectionHeader 
              icon={MoveDiagonal} title="1. GEOMETRY" 
              active={openSections.geometry} collapsible 
              isOpen={openSections.geometry} onToggle={() => toggleSection('geometry')} 
            />
            <AnimatePresence initial={false}>
              {openSections.geometry && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-4 bg-[#0B0F19] p-2 rounded-lg border border-white/5">
                    <input 
                      type="checkbox" name="isTBeam" id="isTBeam" 
                      checked={formData.isTBeam} onChange={handleChange}
                      className="w-4 h-4 rounded bg-[#151B2B] border-white/10 text-blue-500 focus:ring-blue-500/50"
                    />
                    <label htmlFor="isTBeam" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer">T-Beam Section</label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Width (b)" name="b" value={formData.b} onChange={handleChange} unit="mm" info="Width of the beam web." />
                    <InputField label="Height (h)" name="h" value={formData.h} onChange={handleChange} unit="mm" info="Total depth of the section." />
                  </div>
                  
                  {formData.isTBeam && (
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Flange Width (bf)" name="bf" value={formData.bf} onChange={handleChange} unit="mm" />
                      <InputField label="Flange Depth (hf)" name="hf" value={formData.hf} onChange={handleChange} unit="mm" />
                    </div>
                  )}
                  
                  <InputField label="Span (L)" name="span" value={formData.span} onChange={handleChange} unit="mm" />
                  <InputField label="Effective depth (d)" name="d_calc" value={Math.round((formData.h - formData.cover - formData.link_diameter - (formData.bar_diameter/2)) * 10) / 10} onChange={() => {}} unit="mm" step="0.1" readOnly info="Calculated automatically: h - cover - link - bar/2" />
                  <InputField label="As,prov (live)" name="as_prov_calc" value={Math.round(formData.n_bars * Math.PI * (formData.bar_diameter**2) / 4 * 10) / 10} onChange={() => {}} unit="mm²" step="0.1" readOnly info="n × π × φ²/4 — updates before calculation" />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <SectionHeader 
              icon={Shield} title="2. MATERIALS" 
              active={openSections.material} collapsible 
              isOpen={openSections.material} onToggle={() => toggleSection('material')} 
            />
            <AnimatePresence initial={false}>
              {openSections.material && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <SelectField label="Concrete Grade" name="concreteClass" value={formData.concreteClass} onChange={handleChange} 
                      options={[{label: 'C20/25', value: 'C20/25'}, {label: 'C25/30', value: 'C25/30'}, {label: 'C30/37', value: 'C30/37'}, {label: 'C35/45', value: 'C35/45'}, {label: 'C40/50', value: 'C40/50'}, {label: 'C50/60', value: 'C50/60'}]} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="fyk (Main)" name="fyk" value={formData.fyk} onChange={handleChange} unit="MPa" />
                    <InputField label="fywd (Links)" name="fywd" value={formData.fywd} onChange={handleChange} unit="MPa" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <SectionHeader 
              icon={Activity} title="3. LOADING" 
              active={openSections.loading} collapsible 
              isOpen={openSections.loading} onToggle={() => toggleSection('loading')} 
            />
            <AnimatePresence initial={false}>
              {openSections.loading && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <InputField label="Moment (MEd)" name="MEd" value={formData.MEd} onChange={handleChange} unit="kNm" />
                  <InputField label="Shear (VEd)" name="VEd" value={formData.VEd} onChange={handleChange} unit="kN" />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <SectionHeader 
              icon={Layers} title="4. REINFORCEMENT" 
              active={openSections.reinforcement} collapsible 
              isOpen={openSections.reinforcement} onToggle={() => toggleSection('reinforcement')} 
            />
            <AnimatePresence initial={false}>
              {openSections.reinforcement && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="No. of Bars" name="n_bars" value={formData.n_bars} onChange={handleChange} />
                    <InputField label="Bar Ø" name="bar_diameter" value={formData.bar_diameter} onChange={handleChange} unit="mm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Link Ø" name="link_diameter" value={formData.link_diameter} onChange={handleChange} unit="mm" />
                    <InputField label="Link Legs" name="n_legs" value={formData.n_legs} onChange={handleChange} />
                  </div>
                  <InputField label="Concrete Cover" name="cover" value={formData.cover} onChange={handleChange} unit="mm" />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <SectionHeader 
              icon={Settings} title="ADVANCED SETTINGS" 
              active={openSections.advanced} collapsible 
              isOpen={openSections.advanced} onToggle={() => toggleSection('advanced')} 
            />
            <AnimatePresence initial={false}>
              {openSections.advanced && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="γc (Concrete)" name="gamma_c" value={formData.gamma_c} onChange={handleChange} step="0.05" info="Partial safety factor for concrete (usually 1.5)" />
                    <InputField label="γs (Steel)" name="gamma_s" value={formData.gamma_s} onChange={handleChange} step="0.05" info="Partial safety factor for steel (usually 1.15)" />
                  </div>
                  <InputField label="αcc" name="alpha_cc" value={formData.alpha_cc} onChange={handleChange} step="0.01" info="Coefficient for long term effects (usually 0.85 or 1.0)" />
                  <InputField label="Crack Limit" name="wk_limit" value={formData.wk_limit} onChange={handleChange} step="0.1" unit="mm" />
                  <InputField label="Sys. Factor (k_sys)" name="k_sys" value={formData.k_sys} onChange={handleChange} step="0.1" info="Factor for deflection check based on system type." />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <div className="p-6 bg-[#0B0F19]/80 border-t border-white/5 backdrop-blur-md">
          <button 
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 uppercase tracking-widest"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calculator className="w-5 h-5" />}
            {loading ? 'CALCULATING...' : 'CALCULATE DESIGN'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT Area */}
      <div className="flex-1 overflow-y-auto bg-[#0B0F19] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
        
        <header className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-[#151B2B]/80 sticky top-0 z-30 backdrop-blur-md gap-4">
           <div className="flex items-center gap-3">
             <Activity className="w-5 h-5 text-blue-500" />
             <h2 className="text-xl font-black font-outfit tracking-tight uppercase">DESIGN RESULTS</h2>
           </div>
           <div className="flex gap-3">
             <button onClick={() => setShowProjectManager(true)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all text-slate-300">
               <FolderOpen className="w-4 h-4" /> Projects
             </button>
             <button onClick={() => setShowSaveModal(true)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all text-slate-300">
               <Save className="w-4 h-4 text-emerald-400" /> Save
             </button>
             <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
               <Download className="w-4 h-4 text-blue-400" /> Export PDF
             </button>
             <button onClick={() => setResults(null)} className="px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
               <Activity className="w-4 h-4" /> New Design
             </button>
           </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-10 relative z-10">
          
          {results ? (
            <>
              {/* TOP SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard 
                  title="BENDING" 
                  status={results.bending_results.status} 
                  icon={MoveDiagonal}
                  utilization={results.bending_results.utilization}
                  label1="K Value" value1={results.bending_results.K}
                  label2="As,prov" value2={`${results.bending_results.As_provided} mm²`}
                />
                <SummaryCard 
                  title="SHEAR" 
                  status={results.shear_results.status} 
                  icon={Layers}
                  utilization={results.shear_results.utilization}
                  label1="VEd" value1={`${formData.VEd} kN`}
                  label2="VRd,c" value2={`${results.shear_results.VRd_c} kN`}
                />
                <SummaryCard 
                  title="DEFLECTION" 
                  status={results.deflection_results.status} 
                  icon={Activity}
                  utilization={results.deflection_results.utilization}
                  label1="Span/d" value1={results.deflection_results.actual_l_d}
                  label2="Limit" value2={results.deflection_results.allowable_l_d}
                />
                <SummaryCard 
                  title="CRACKING" 
                  status={results.cracking_results.status} 
                  icon={Droplet}
                  utilization={results.cracking_results.utilization}
                  label1="s_max" value1={`${results.cracking_results.max_allowable_spacing} mm`}
                  label2="s_prov" value2={`${results.cracking_results.actual_spacing} mm`}
                />
              </div>

              {/* TABS FOR DETAILED DESIGN */}
              <div className="bg-[#151B2B] rounded-3xl border border-white/5 overflow-hidden shadow-2xl shadow-black/20">
                <div className="flex border-b border-white/5 overflow-x-auto bg-[#1a2233]">
                  {['BENDING DESIGN', 'SHEAR DESIGN', 'DEFLECTION CHECK', 'CRACKING CONTROL', 'SUMMARY'].map(tab => (
                    <TabButton key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
                  ))}
                </div>

                <div className="p-8">
                  {activeTab === 'BENDING DESIGN' && (
                    <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-6">Required Tension Reinforcement</h4>
                        <ResultTable data={[
                          { label: "Section Type", value: formData.isTBeam ? "T-Beam" : "Rectangular", unit: "" },
                          ...(formData.isTBeam ? [
                            { label: "Flange width (bf)", value: formData.bf, unit: "mm" },
                            { label: "Flange depth (hf)", value: formData.hf, unit: "mm" }
                          ] : []),
                          { label: "Web width (bw)", value: formData.b, unit: "mm" },
                          { label: "Design moment (MEd)", value: formData.MEd, unit: "kNm" },
                          { label: "Lever arm (z)", value: results.bending_results.z, unit: "mm" },
                          { label: "Required As", value: results.bending_results.As_req, unit: "mm²" },
                          { label: "Minimum As,min", value: results.bending_results.As_min, unit: "mm²" },
                          { label: "Provided As,prov", value: results.bending_results.As_provided, unit: "mm²", color: "text-emerald-400" },
                          { label: "Reinforcement ratio (ρ)", value: ((results.bending_results.As_provided / ((formData.isTBeam ? formData.bf : formData.b) * (formData.h - formData.cover - formData.link_diameter - formData.bar_diameter/2))) * 100).toFixed(3), unit: "%" },
                          { label: "Status", value: results.bending_results.status.split(' ')[0], unit: "", color: results.bending_results.status.startsWith('OK') ? "text-emerald-400" : "text-rose-400" }
                        ]} />
                        <div className={cn("mt-6 p-5 border rounded-2xl flex items-center gap-4 text-sm font-bold", 
                          results.bending_results.status.startsWith('OK') ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400")}>
                           {results.bending_results.status.startsWith('OK') ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                           <div>
                             <p>{results.bending_results.status.startsWith('OK') ? 'The provided reinforcement is adequate.' : 'Reinforcement provided is insufficient or section fails.'}</p>
                             <p className="text-[10px] opacity-70 mt-1 uppercase tracking-wider">{results.bending_results.message}</p>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-8">
                        <div>
                           <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-6">Section & Reinforcement</h4>
                           <div className="bg-[#0B0F19]/50 rounded-3xl p-8 border border-white/5 flex justify-center items-center shadow-inner relative group">
                             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                             <BeamCrossSection 
                                width={formData.b} 
                                height={formData.h} 
                                bf={formData.isTBeam ? formData.bf : null}
                                hf={formData.isTBeam ? formData.hf : null}
                                cover={formData.cover} 
                                barDiameter={formData.bar_diameter} 
                                linkDiameter={formData.link_diameter} 
                                nBars={formData.n_bars} 
                                nLegs={formData.n_legs} 
                              />
                           </div>
                        </div>
                        <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-7 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                           <h4 className="font-black text-slate-100 mb-5 flex items-center gap-3 text-sm uppercase tracking-wider relative z-10">
                             <Box className="w-5 h-5 text-blue-400" /> Reinforcement Recommendation
                           </h4>
                           <div className="space-y-4 relative z-10">
                             <p className="text-sm text-slate-400 flex items-center gap-2">Use <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg font-black">{formData.n_bars}</span> bars of <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg font-black">Ø{formData.bar_diameter}</span></p>
                             <p className="text-sm text-slate-400 flex justify-between">As,prov <span className="text-slate-100 font-black text-base">{results.bending_results.As_provided} mm²</span></p>
                             <p className="text-sm text-slate-400 flex justify-between">Spacing (clear) <span className="text-slate-100 font-black text-base">≈ {Math.round((results.cracking_results.actual_spacing - formData.bar_diameter) * 10) / 10} mm</span></p>
                           </div>
                        </div>
                      </div>
                    </div>
                    {results.formula_steps && <FormulaTrace steps={results.formula_steps.bending} />}
                    </>
                  )}

                  {activeTab === 'SHEAR DESIGN' && (
                    <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-6">Shear Capacity & Links</h4>
                        <ResultTable data={[
                          { label: "Design shear force (VEd)", value: formData.VEd, unit: "kN" },
                          { label: "Concrete resistance (VRd,c)", value: results.shear_results.VRd_c, unit: "kN" },
                          { label: "Max capacity (VRd,max)", value: results.shear_results.VRd_max, unit: "kN" },
                          { label: "Strut inclination (θ)", value: results.shear_results.theta, unit: "deg" },
                          { label: "Required Asw/s", value: results.shear_results.Asw_s_final, unit: "mm²/mm" },
                          { label: "Max spacing (s_max)", value: results.shear_results.s_max, unit: "mm" }
                        ]} />
                      </div>
                      <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-7 h-fit">
                         <h4 className="font-black text-slate-100 mb-5 flex items-center gap-3 text-sm uppercase tracking-wider">
                           <Layers className="w-5 h-5 text-blue-400" /> Shear Link Recommendation
                         </h4>
                         <p className="text-sm text-slate-400 mb-5">Provided Links: <span className="text-slate-100 font-black">Ø{formData.link_diameter} - {formData.n_legs} legs</span></p>
                         <div className="p-5 bg-[#0B0F19] rounded-2xl border border-white/5 shadow-inner">
                           <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-[0.15em]">Recommended Max Spacing</p>
                           <p className="text-3xl font-black text-blue-400">{Math.floor(( (Math.PI * (formData.link_diameter**2) / 4) * formData.n_legs ) / results.shear_results.Asw_s_final)} <span className="text-sm font-bold text-slate-500 ml-1 uppercase tracking-widest">mm c/c</span></p>
                         </div>
                      </div>
                    </div>
                    {results.formula_steps && <FormulaTrace steps={results.formula_steps.shear} />}
                    </>
                  )}

                  {activeTab === 'DEFLECTION CHECK' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-6">Span/Depth Ratio Check</h4>
                        <ResultTable data={[
                          { label: "Actual L/d ratio", value: results.deflection_results.actual_l_d, unit: "" },
                          { label: "Basic L/d ratio", value: results.deflection_results.basic_l_d, unit: "" },
                          { label: "Allowable L/d ratio", value: results.deflection_results.allowable_l_d, unit: "", color: "text-blue-400" },
                          { label: "Status", value: results.deflection_results.status, unit: "", color: results.deflection_results.status === 'OK' ? "text-emerald-400" : "text-rose-400" }
                        ]} />
                      </div>
                      <div className="flex flex-col items-center gap-6">
                         <UtilizationRing value={results.deflection_results.utilization} size={150} label="DEFLECTION η" />
                         <div className="text-center">
                            <h5 className={cn("text-xl font-black mb-2 uppercase tracking-tight", results.deflection_results.status === 'OK' ? "text-emerald-400" : "text-rose-400")}>{results.deflection_results.status === 'OK' ? 'Deflection OK' : 'Deflection Fails'}</h5>
                            <p className="text-slate-400 text-xs font-medium">{results.deflection_results.message}</p>
                         </div>
                         {results.formula_steps && <FormulaTrace steps={results.formula_steps.deflection} />}
                      </div>
                    </div>
                  )}

                  {activeTab === 'CRACKING CONTROL' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-6">Bar Spacing Control</h4>
                        <ResultTable data={[
                          { label: "Estimated steel stress (σs)", value: results.cracking_results.sigma_s, unit: "MPa" },
                          { label: "Actual bar spacing (s_prov)", value: results.cracking_results.actual_spacing, unit: "mm" },
                          { label: "Max allowable spacing (s_max)", value: results.cracking_results.max_allowable_spacing, unit: "mm", color: "text-blue-400" },
                          { label: "Status", value: results.cracking_results.status, unit: "", color: results.cracking_results.status === 'OK' ? "text-emerald-400" : "text-rose-400" }
                        ]} />
                      </div>
                      <div className="flex flex-col items-center gap-6">
                         <UtilizationRing value={results.cracking_results.utilization} size={150} label="CRACKING η" />
                         <div className="text-center">
                            <h5 className={cn("text-xl font-black mb-2 uppercase tracking-tight", results.cracking_results.status === 'OK' ? "text-emerald-400" : "text-rose-400")}>Crack Control: {results.cracking_results.status}</h5>
                            <p className="text-slate-400 text-xs font-medium">{results.cracking_results.message}</p>
                         </div>
                         {results.formula_steps && <FormulaTrace steps={results.formula_steps.cracking} />}
                      </div>
                    </div>
                  )}

                  {activeTab === 'SUMMARY' && (
                    <div className="space-y-10">
                       <div>
                         <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-8">Utilisation Overview</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                           <UtilizationRing value={results.bending_results.utilization} label="Bending §6.1" />
                           <UtilizationRing value={results.shear_results.utilization} label="Shear §6.2" />
                           <UtilizationRing value={results.deflection_results.utilization} label="Deflection §7.4" />
                           <UtilizationRing value={results.cracking_results.utilization} label="Cracking §7.3" />
                         </div>
                       </div>

                       <VerificationTable checks={[
                         { label: "As,req ≤ As,prov", clause: "§6.1", design: results.bending_results.As_req, limit: results.bending_results.As_provided, unit: "mm²", pass: results.bending_results.status?.startsWith('OK') },
                         { label: "VEd ≤ VRd,max", clause: "§6.2", design: formData.VEd, limit: results.shear_results.VRd_max, unit: "kN", pass: formData.VEd <= results.shear_results.VRd_max },
                         { label: "L/d actual ≤ L/d allow", clause: "§7.4", design: results.deflection_results.actual_l_d, limit: results.deflection_results.allowable_l_d, unit: "", pass: results.deflection_results.status === 'OK' },
                         { label: "Spacing ≤ s_max", clause: "§7.3", design: results.cracking_results.actual_spacing, limit: results.cracking_results.max_allowable_spacing, unit: "mm", pass: results.cracking_results.status === 'OK' },
                       ]} />

                       {results.recommendation && (
                         <div className={cn("p-6 rounded-2xl border flex items-start gap-4",
                           results.recommendation.action === 'MAINTAIN' ? "bg-emerald-500/5 border-emerald-500/20" :
                           results.recommendation.action === 'OPTIMIZE' ? "bg-blue-500/5 border-blue-500/20" :
                           "bg-amber-500/5 border-amber-500/20")}>
                           <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                           <div>
                             <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Recommendation</p>
                             <p className="text-sm font-bold text-slate-200">{results.recommendation.text}</p>
                             {results.recommendation.suggestion && (
                               <p className="text-xs text-slate-400 mt-2">Suggested: <span className="text-blue-400 font-black">{results.recommendation.suggestion.n_bars}-Ø{results.recommendation.suggestion.diameter}</span> (As={results.recommendation.suggestion.As_prov} mm²)</p>
                             )}
                           </div>
                         </div>
                       )}

                       <div className="bg-[#1a2233] rounded-[2.5rem] p-10 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                          <div className="flex items-center gap-8 relative z-10">
                            <div className={cn("w-24 h-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105 duration-500",
                              results.status === 'PASS' ? "bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/30" : "bg-gradient-to-tr from-rose-600 to-pink-500 shadow-rose-500/30")}>
                               {results.status === 'PASS' ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">OVERALL STATUS</p>
                               <h3 className={cn("text-7xl font-black font-outfit tracking-tighter leading-none", results.status === 'PASS' ? "text-emerald-400" : "text-rose-400")}>
                                 {results.status}
                               </h3>
                               <p className="text-sm text-slate-500 mt-2 font-bold">η_max = {Math.round(results.utilization_max * 100)}%</p>
                            </div>
                          </div>
                          <div className="relative z-10 text-center md:text-left max-w-sm">
                            <p className="text-slate-200 text-lg font-bold leading-tight mb-3">
                              {results.status === 'PASS' ? "The beam satisfies all checks according to Eurocode 2." : "Calculation revealed critical design failures."}
                            </p>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                              {results.summary}
                            </p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                 <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 mt-0.5">
                   <BookOpen className="w-4 h-4" />
                 </div>
                 <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                   <span className="text-blue-400 font-black uppercase tracking-widest mr-2">Methodology:</span> 
                   Calculations are performed in accordance with <span className="text-slate-300 font-bold">BS EN 1992-1-1:2004+A1:2014</span>. Concrete properties are based on Table 3.1. Reinforcement detailing follows Chapter 9 requirements for beam sections.
                 </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
               <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 border-2 border-dashed border-blue-500/20 flex items-center justify-center mb-10 pulse-glow">
                 <Calculator className="w-12 h-12 text-blue-400/30" />
               </div>
               <h3 className="text-3xl font-black text-slate-200 font-outfit mb-3 tracking-tight">Calculation Required</h3>
               <p className="text-slate-500 text-lg text-center max-w-md font-medium leading-relaxed">Adjust the structural parameters in the sidebar and trigger the calculation to generate the Eurocode design report.</p>
            </div>
          )}
          
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center gap-6 text-rose-400">
               <div className="p-3 bg-rose-500/20 rounded-2xl">
                 <XCircle className="w-8 h-8" />
               </div>
               <div>
                 <h4 className="font-black uppercase tracking-widest text-sm mb-1">Critical Error</h4>
                 <p className="text-sm font-bold opacity-80">{error}</p>
               </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Project Manager Modal */}
      <AnimatePresence>
        {showProjectManager && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#151B2B] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1a2233]">
                <h3 className="text-xl font-black flex items-center gap-3"><FolderOpen className="text-blue-400" /> Project Manager</h3>
                <button onClick={() => setShowProjectManager(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div className="w-1/3 border-r border-white/5 bg-[#0B0F19]/50 flex flex-col">
                  <div className="p-4 border-b border-white/5">
                    <div className="flex gap-2">
                      <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="New Project Name" className="flex-1 bg-[#151B2B] border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button onClick={createProject} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"><Plus className="w-4 h-4 text-white" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {projects.map(p => (
                      <button key={p.id} onClick={() => selectProject(p)} className={cn("w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors flex items-center justify-between group", selectedProject?.id === p.id ? "bg-blue-500/20 text-blue-400" : "hover:bg-white/5 text-slate-300")}>
                        <span className="font-bold text-sm truncate">{p.name}</span>
                        <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", selectedProject?.id === p.id && "opacity-100")} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-[#151B2B] p-6 overflow-y-auto">
                  {selectedProject ? (
                    <div>
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Beams in {selectedProject.name}</h4>
                      {beams.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">No beams in this project yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {beams.map(b => (
                            <div key={b.id} className="p-4 rounded-2xl border border-white/5 bg-[#0B0F19] hover:border-blue-500/30 transition-colors flex items-center justify-between group">
                              <div>
                                <h5 className="font-bold text-slate-200">{b.name}</h5>
                                <p className="text-xs text-slate-500 mt-1 flex gap-3">
                                  <span>{b.parameters.b}x{b.parameters.h} mm</span>
                                  <span>MEd: {b.parameters.MEd} kNm</span>
                                  <span className={b.results?.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>{b.results?.status || 'Unknown'}</span>
                                </p>
                              </div>
                              <button onClick={() => loadBeam(b)} className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500/20">Load Design</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-3">
                      <FolderOpen className="w-12 h-12 opacity-20" />
                      <p>Select a project from the left</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Beam Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#151B2B] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-black mb-4 flex items-center gap-3"><Save className="text-blue-400" /> Save Design</h3>
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Project</label>
                <select value={selectedProject?.id || ''} onChange={e => {
                  const p = projects.find(proj => proj.id === parseInt(e.target.value));
                  if (p) selectProject(p);
                }} className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="" disabled>-- Select a project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Design Name</label>
                <input type="text" value={newBeamName} onChange={e => setNewBeamName(e.target.value)} placeholder="e.g. Ground Floor Beam B1" className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowSaveModal(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold transition-colors">Cancel</button>
                <button onClick={saveBeam} disabled={!selectedProject || !newBeamName.trim()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-black transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
