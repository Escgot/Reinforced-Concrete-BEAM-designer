import React from 'react';
import { motion } from 'framer-motion';

export default function BeamCrossSection({ width, height, bf, hf, cover, barDiameter, linkDiameter, nBars, nLegs }) {
  const isTBeam = hf > 0 && bf > width;
  const currentB = isTBeam ? bf : width;

  const maxWidth = 300;
  const maxHeight = 300;
  const padding = 40; 
  
  const scaleX = (maxWidth - 2 * padding) / Math.max(currentB, 100);
  const scaleY = (maxHeight - 2 * padding) / Math.max(height, 100);
  const scale = Math.min(scaleX, scaleY);
  
  const w = width * scale;
  const h = height * scale;
  const b_f = (bf || width) * scale;
  const h_f = (hf || 0) * scale;
  const c = cover * scale;
  const bd = barDiameter * scale;
  const ld = linkDiameter * scale;
  
  const svgWidth = Math.max(w, b_f) + 2 * padding;
  const svgHeight = h + 2 * padding;
  
  // Center the beam in SVG
  const offsetX = (svgWidth - Math.max(w, b_f)) / 2;
  const beamCenterX = svgWidth / 2;
  const webStartX = beamCenterX - w / 2;
  const flangeStartX = beamCenterX - b_f / 2;
  
  const bottomCover = c + ld + bd / 2;
  const sideCover = c + ld + bd / 2;
  
  const rebarY = h - bottomCover;
  const availableWidth = w - 2 * sideCover;
  
  const rebars = [];
  if (nBars > 1) {
    const spacing = availableWidth / (nBars - 1);
    for (let i = 0; i < nBars; i++) {
      rebars.push({ x: webStartX + sideCover + i * spacing, y: rebarY });
    }
  } else if (nBars === 1) {
    rebars.push({ x: beamCenterX, y: rebarY });
  }

  const topBarD = 12 * scale; 
  const topRebars = [
    { x: webStartX + sideCover, y: c + ld + topBarD/2 },
    { x: webStartX + w - sideCover, y: c + ld + topBarD/2 }
  ];

  // Path for T-beam or Rectangle
  const getBeamPath = () => {
    if (isTBeam) {
      return `M ${flangeStartX},${0} 
              H ${flangeStartX + b_f} 
              V ${h_f} 
              H ${webStartX + w} 
              V ${h} 
              H ${webStartX} 
              V ${h_f} 
              H ${flangeStartX} 
              Z`;
    }
    return `M ${webStartX},${0} 
            H ${webStartX + w} 
            V ${h} 
            H ${webStartX} 
            Z`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#151B2B]/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl w-full h-full min-h-[380px] group transition-all hover:bg-[#151B2B]/80">
      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
        {/* Concrete Section */}
        <motion.path
          d={getBeamPath()}
          transform={`translate(0, ${padding})`}
          fill="rgba(59, 130, 246, 0.05)"
          stroke="#475569"
          strokeWidth="2"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 1, pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        {/* Shear Link (in the web) */}
        <motion.rect
          x={webStartX + c}
          y={padding + c}
          width={Math.max(0, w - 2 * c)}
          height={Math.max(0, h - 2 * c)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={Math.max(1, ld)}
          strokeDasharray="4 2"
          rx="4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        
        {/* Main Rebars (Bottom) */}
        {rebars.map((pos, idx) => (
          <motion.circle
            key={`bot-${idx}`}
            cx={pos.x}
            cy={padding + pos.y}
            r={bd / 2}
            fill="#f43f5e"
            className="shadow-lg shadow-rose-500/50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.8 + idx * 0.1 }}
          />
        ))}

        {/* Top Hanger Bars */}
        {topRebars.map((pos, idx) => (
          <motion.circle
            key={`top-${idx}`}
            cx={pos.x}
            cy={padding + pos.y}
            r={topBarD / 2}
            fill="#64748b"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 1.2 + idx * 0.1 }}
          />
        ))}

        {/* Dimension Lines (Width) */}
        <g className="opacity-40 group-hover:opacity-100 transition-opacity">
            <line x1={flangeStartX} y1={padding - 15} x2={flangeStartX + b_f} y2={padding - 15} stroke="#64748b" strokeWidth="1" />
            <line x1={flangeStartX} y1={padding - 20} x2={flangeStartX} y2={padding - 10} stroke="#64748b" strokeWidth="1" />
            <line x1={flangeStartX + b_f} y1={padding - 20} x2={flangeStartX + b_f} y2={padding - 10} stroke="#64748b" strokeWidth="1" />
            <text x={beamCenterX} y={padding - 25} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" className="uppercase tracking-tighter">
                {isTBeam ? `bf = ${bf} mm` : `b = ${width} mm`}
            </text>
        </g>

        {/* Dimension Lines (Height) */}
        <g className="opacity-40 group-hover:opacity-100 transition-opacity">
            <line x1={flangeStartX - 15} y1={padding} x2={flangeStartX - 15} y2={padding + h} stroke="#64748b" strokeWidth="1" />
            <line x1={flangeStartX - 20} y1={padding} x2={flangeStartX - 10} y2={padding} stroke="#64748b" strokeWidth="1" />
            <line x1={flangeStartX - 20} y1={padding + h} x2={flangeStartX - 10} y2={padding + h} stroke="#64748b" strokeWidth="1" />
            <text x={flangeStartX - 25} y={padding + h / 2} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" transform={`rotate(-90 ${flangeStartX - 25} ${padding + h / 2})`} dy="-5" className="uppercase tracking-tighter">
                h = {height} mm
            </text>
        </g>
      </svg>
      <div className="mt-4 px-4 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Live Visualization
      </div>
    </div>
  );
}
