import React, { useState } from 'react';

const InputField = ({ label, name, type = 'number', value, onChange, unit, step = "1", min = "0" }) => (
  <div className="flex flex-col mb-4">
    <label className="mb-1 text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm outline-none"
      />
      {unit && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
          {unit}
        </span>
      )}
    </div>
  </div>
);

function App() {
  const [formData, setFormData] = useState({
    b: 250,
    h: 500,
    cover: 35,
    span: 6000,
    fck: 25,
    fyk: 500,
    fywd: 500,
    MEd: 150,
    VEd: 100,
    bar_diameter: 20,
    link_diameter: 8,
    n_bars: 4,
    n_legs: 2,
    wk_limit: 0.3,
    k_sys: 1.0,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || value,
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Calculation failed');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await fetch('http://localhost:8000/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RC_Beam_Calculation.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderStatus = (status) => {
    const isOK = status.startsWith('OK');
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${isOK ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Reinforced Concrete Beam Designer</h1>
          <p className="text-slate-500 text-lg">EN 1992-1-1 (Eurocode 2) compliant bending, shear, deflection, and cracking checks.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2">Design Parameters</h2>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <section>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3">Geometry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Width (b)" name="b" value={formData.b} onChange={handleChange} unit="mm" />
                  <InputField label="Height (h)" name="h" value={formData.h} onChange={handleChange} unit="mm" />
                  <InputField label="Cover" name="cover" value={formData.cover} onChange={handleChange} unit="mm" />
                  <InputField label="Span" name="span" value={formData.span} onChange={handleChange} unit="mm" />
                </div>
              </section>

              <section>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3">Material</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Concrete (fck)" name="fck" value={formData.fck} onChange={handleChange} unit="MPa" />
                  <InputField label="Main Steel (fyk)" name="fyk" value={formData.fyk} onChange={handleChange} unit="MPa" />
                  <InputField label="Shear Steel (fywd)" name="fywd" value={formData.fywd} onChange={handleChange} unit="MPa" />
                </div>
              </section>

              <section>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3">Loading</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Moment (MEd)" name="MEd" value={formData.MEd} onChange={handleChange} unit="kNm" />
                  <InputField label="Shear (VEd)" name="VEd" value={formData.VEd} onChange={handleChange} unit="kN" />
                </div>
              </section>

              <section>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3">Reinforcement Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Main Bar Ø" name="bar_diameter" value={formData.bar_diameter} onChange={handleChange} unit="mm" />
                  <InputField label="No. Bars" name="n_bars" value={formData.n_bars} onChange={handleChange} />
                  <InputField label="Link Ø" name="link_diameter" value={formData.link_diameter} onChange={handleChange} unit="mm" />
                  <InputField label="Link Legs" name="n_legs" value={formData.n_legs} onChange={handleChange} />
                </div>
              </section>
            </div>

            <button 
              onClick={handleCalculate}
              disabled={loading}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Run Checks'}
            </button>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow border border-red-100">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            
            {!results && !error && (
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-10 flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <p className="text-xl font-medium">No results yet.</p>
                <p className="text-sm">Enter parameters and click Run Checks.</p>
              </div>
            )}

            {results && (
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-full">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Calculation Results</h2>
                    <p className={`text-sm mt-1 font-medium ${results.summary.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
                      {results.summary}
                    </p>
                  </div>
                  <button 
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Export PDF
                  </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                  {/* Bending Card */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">1. Bending Check</h3>
                      {renderStatus(results.bending_results.status)}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex justify-between"><span className="text-slate-400">Required As:</span> <span className="font-medium text-slate-800">{results.bending_results.As_req} mm²</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Provided As:</span> <span className="font-medium text-slate-800">{results.bending_results.As_provided} mm²</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Min Steel (As,min):</span> <span className="font-medium text-slate-800">{results.bending_results.As_min} mm²</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Lever arm (z):</span> <span className="font-medium text-slate-800">{results.bending_results.z} mm</span></li>
                    </ul>
                  </div>

                  {/* Shear Card */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">2. Shear Check</h3>
                      {renderStatus(results.shear_results.status)}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex justify-between"><span className="text-slate-400">Req Asw/s:</span> <span className="font-medium text-slate-800">{results.shear_results.Asw_s_final} mm²/mm</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Concrete Cap (VRd,c):</span> <span className="font-medium text-slate-800">{results.shear_results.VRd_c} kN</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Max Cap (VRd,max):</span> <span className="font-medium text-slate-800">{results.shear_results.VRd_max} kN</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Required Spacing:</span> <span className="font-medium text-slate-800">s ≤ {results.shear_results.max_spacing_required || results.shear_results.s_max} mm</span></li>
                    </ul>
                  </div>

                  {/* Deflection Card */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">3. Deflection</h3>
                      {renderStatus(results.deflection_results.status)}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex justify-between"><span className="text-slate-400">Actual L/d:</span> <span className="font-medium text-slate-800">{results.deflection_results.actual_l_d}</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Allowable L/d:</span> <span className="font-medium text-slate-800">{results.deflection_results.allowable_l_d}</span></li>
                    </ul>
                  </div>

                  {/* Cracking Card */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-800">4. Cracking</h3>
                      {renderStatus(results.cracking_results.status)}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex justify-between"><span className="text-slate-400">Actual Spacing:</span> <span className="font-medium text-slate-800">{results.cracking_results.actual_spacing} mm</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Max Allowable:</span> <span className="font-medium text-slate-800">{results.cracking_results.max_allowable_spacing} mm</span></li>
                      <li className="flex justify-between"><span className="text-slate-400">Est. Steel Stress:</span> <span className="font-medium text-slate-800">{results.cracking_results.sigma_s} MPa</span></li>
                    </ul>
                  </div>
                  
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
