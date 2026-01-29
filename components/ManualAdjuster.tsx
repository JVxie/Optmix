
import React, { useState, useEffect, useMemo } from 'react';
import { Indicator, Material } from '../types';
import { AlertTriangle, Check } from 'lucide-react';

interface Props {
  materials: Material[];
  indicators: Indicator[];
}

const ManualAdjuster: React.FC<Props> = ({ materials, indicators }) => {
  const [ratios, setRatios] = useState<Record<string, number>>({});

  // Initialize ratios evenly or 0
  useEffect(() => {
    const initial: Record<string, number> = {};
    materials.forEach(m => initial[m.id] = 0);
    setRatios(initial);
  }, [materials]);

  const handleChange = (id: string, val: number) => {
    setRatios(prev => ({ ...prev, [id]: val }));
  };

  const totalPercentage = Object.values(ratios).reduce((a, b) => a + b, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.1;

  const results = useMemo(() => {
    let cost = 0;
    const computedInds: Record<string, number> = {};
    
    indicators.forEach(ind => computedInds[ind.id] = 0);

    materials.forEach(m => {
      const r = (ratios[m.id] || 0) / 100;
      cost += m.price * r;
      indicators.forEach(ind => {
        computedInds[ind.id] += (m.indicatorValues[ind.id] || 0) * r;
      });
    });

    return { cost, computedInds };
  }, [ratios, materials, indicators]);

  if (materials.length === 0) {
    return <div className="text-center text-slate-400 py-10">请先添加货物以进行手动调整。</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] lg:h-auto overflow-hidden">
      {/* Controls */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full lg:h-auto">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">配比调整</h3>
          <div className={`mt-2 text-sm font-medium flex items-center gap-2 ${isValidTotal ? 'text-green-600' : 'text-amber-600'}`}>
             {isValidTotal ? <Check size={16} /> : <AlertTriangle size={16} />}
             当前总和: {totalPercentage.toFixed(1)}%
             {!isValidTotal && <span className="text-xs opacity-75">(需等于100%)</span>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {materials.map(m => (
            <div key={m.id}>
               <div className="flex justify-between mb-1">
                 <label className="text-sm font-medium text-slate-700">{m.name}</label>
                 <span className="text-sm text-slate-500">{ratios[m.id] || 0}%</span>
               </div>
               <input
                 type="range"
                 min="0"
                 max="100"
                 step="0.5"
                 value={ratios[m.id] || 0}
                 onChange={e => handleChange(m.id, parseFloat(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
               <div className="text-xs text-slate-400 text-right mt-1">¥{m.price}/吨</div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200">
           <div className="flex justify-between items-center">
             <span className="text-slate-600 font-medium">预估单价</span>
             <span className="text-2xl font-bold text-blue-700">¥{results.cost.toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 space-y-4 overflow-y-auto pb-10">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">指标实时状态</h3>
          <div className="space-y-4">
             {indicators.map(ind => {
               const val = results.computedInds[ind.id] || 0;
               const isLow = val < ind.min;
               const isHigh = val > ind.max;
               const isOk = !isLow && !isHigh;

               return (
                 <div key={ind.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-medium text-slate-700">{ind.name}</span>
                     <span className={`font-bold ${isOk ? 'text-green-600' : 'text-red-500'}`}>
                       {val.toFixed(2)} <span className="text-xs font-normal text-slate-400">{ind.unit}</span>
                     </span>
                   </div>
                   <div className="text-xs text-slate-400 flex justify-between mb-1">
                      <span>Min: {ind.min}</span>
                      <span>Max: {ind.max}</span>
                   </div>
                   {/* Indicator Status Bar */}
                   <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                      {/* Simple logic for visual bar position relative to min/max window */}
                      {/* Let's map Min to 25% and Max to 75% for visual comfort */}
                      <div className={`absolute top-0 bottom-0 transition-all duration-300 w-full ${isOk ? 'bg-green-500' : 'bg-red-500'}`}
                           style={{
                             left: 0,
                             transform: `translateX(-${100 - Math.min(100, (val / (ind.max * 1.5 || 100)) * 100)}%)` 
                           }}
                      ></div>
                   </div>
                   {!isOk && (
                      <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {isLow ? `低于最小值 (${(ind.min - val).toFixed(2)})` : `高于最大值 (${(val - ind.max).toFixed(2)})`}
                      </div>
                   )}
                 </div>
               )
             })}
             {indicators.length === 0 && <div className="text-slate-400 text-center text-sm">暂无指标</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAdjuster;
