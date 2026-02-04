
import React, { useState, useEffect, useMemo } from 'react';
import { Indicator, Material } from '@/types';
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

  const totalPercentage = (Object.values(ratios) as number[]).reduce((a, b) => a + b, 0);
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
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">指标实时状态</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {indicators.map(ind => {
              const val = results.computedInds[ind.id] || 0;
              const isLow = val < ind.min;
              const isHigh = val > ind.max;
              const isOk = !isLow && !isHigh;

              // 计算差值
              let diffLabel = '';
              if (isLow) {
                const diff = ind.min - val;
                diffLabel = `距最小值 -${diff.toFixed(2)}`;
              } else if (isHigh) {
                const diff = val - ind.max;
                diffLabel = `超最大值 +${diff.toFixed(2)}`;
              } else {
                // 显示距离边界的余量（取较小值）
                const marginToMin = val - ind.min;
                const marginToMax = ind.max - val;
                const margin = Math.min(marginToMin, marginToMax);
                diffLabel = `余量 ${margin.toFixed(2)}`;
              }

              return (
                <div
                  key={ind.id}
                  className={`p-3 rounded-lg border-2 transition-colors ${isOk
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                >
                  {/* 指标名称 */}
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 truncate">
                    {ind.name}
                  </div>

                  {/* 实际值 */}
                  <div className={`text-lg font-bold ${isOk ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {val.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">{ind.unit}</span>
                  </div>

                  {/* 目标范围 */}
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    目标: {ind.min} ~ {ind.max}
                  </div>

                  {/* 差值 */}
                  <div className={`text-xs font-medium mt-1 ${isOk
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400'
                    }`}>
                    {diffLabel}
                  </div>
                </div>
              )
            })}
          </div>
          {indicators.length === 0 && <div className="text-slate-400 dark:text-slate-500 text-center text-sm py-4">暂无指标</div>}
        </div>
      </div>
    </div>
  );
};

export default ManualAdjuster;
