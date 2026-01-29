import React, { useState, useEffect, useMemo } from 'react';
import { Indicator, Material, OptimizationResult } from '../types';
import { calculateOptimalMix } from '../services/solver';
import { AlertTriangle, Calculator, Check, RefreshCw, ArrowRight, TrendingUp, JapaneseYen, Layers, Sliders, Loader2 } from 'lucide-react';

interface Props {
  materials: Material[];
  indicators: Indicator[];
  savedRatios?: Record<string, number>;
  savedResult?: OptimizationResult | null;
  onSaveRatios: (ratios: Record<string, number>) => void;
  onSaveResult: (result: OptimizationResult | null) => void;
}

// --- Helper Types & Functions ---

interface SchemeMetrics {
  cost: number;
  ratios: Record<string, number>;
  indicatorValues: Record<string, number>;
}

const calculateMetrics = (
  materials: Material[],
  indicators: Indicator[],
  ratios: Record<string, number>
): SchemeMetrics => {
  let cost = 0;
  const indicatorValues: Record<string, number> = {};
  
  indicators.forEach(ind => indicatorValues[ind.id] = 0);

  materials.forEach(m => {
    const percentage = ratios[m.id] || 0;
    const factor = percentage / 100;
    cost += m.price * factor;

    indicators.forEach(ind => {
      indicatorValues[ind.id] += (m.indicatorValues[ind.id] || 0) * factor;
    });
  });

  // Round results to 2 decimal places
  const roundedIndicatorValues: Record<string, number> = {};
  for (const key in indicatorValues) {
    roundedIndicatorValues[key] = Math.round(indicatorValues[key] * 100) / 100;
  }

  return { 
    cost: Math.round(cost * 100) / 100, 
    ratios, 
    indicatorValues: roundedIndicatorValues 
  };
};

// --- Reusable Result Component ---

const ResultMetricsDisplay: React.FC<{
  metrics: SchemeMetrics;
  materials: Material[];
  indicators: Indicator[];
  showCompositionList?: boolean;
}> = ({ metrics, materials, indicators, showCompositionList = false }) => {
  
  // Filter and sort materials by percentage for the list view
  const activeMaterials = useMemo(() => {
    return materials
      .map(m => ({ 
        ...m, 
        percent: parseFloat((metrics.ratios[m.id] || 0).toFixed(2)) 
      }))
      .filter(m => m.percent > 0)
      .sort((a, b) => b.percent - a.percent);
  }, [materials, metrics.ratios]);

  return (
    <div className="space-y-6">
      {/* 1. Price Card */}
      <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1.5">
          <JapaneseYen size={16} /> 预估成本
        </span>
        <span className="text-2xl font-bold text-slate-800 dark:text-white">
          ¥{metrics.cost.toFixed(2)}<span className="text-sm font-normal text-slate-400 dark:text-slate-500">/吨</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 2. Composition List (Only shown for Smart Calculation) */}
        {showCompositionList && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
               <Layers size={14} /> 配比构成
            </h4>
            {activeMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeMaterials.map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{m.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">¥{m.price}/吨</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {m.percent}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">暂无配比数据</div>
            )}
          </div>
        )}

        {/* 3. Indicators Check */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
             <Check size={14} /> 指标校验
          </h4>
          <div className="space-y-4">
             {indicators.map(ind => {
               const val = metrics.indicatorValues[ind.id] || 0;
               const isLow = val < ind.min - 0.001; 
               const isHigh = val > ind.max + 0.001;
               const isOk = !isLow && !isHigh;
               
               const rangeMax = ind.max * 1.5 || 100;
               const percent = Math.min(100, Math.max(0, (val / rangeMax) * 100));
               
               return (
                 <div key={ind.id}>
                   <div className="flex justify-between items-end mb-1.5">
                     <span className={`font-medium text-xs ${isOk ? 'text-slate-600 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`}>{ind.name}</span>
                     <div className="text-right flex flex-col items-end">
                       <div className={`font-mono text-sm leading-none mb-0.5 ${isOk ? 'text-slate-700 dark:text-slate-200' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                         {val.toFixed(2)} <span className="text-xs font-normal text-slate-400 dark:text-slate-500 scale-90 inline-block">{ind.unit}</span>
                       </div>
                       <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                         [{ind.min} ~ {ind.max}]
                       </div>
                     </div>
                   </div>
                   <div className="relative h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 bottom-0 transition-all duration-500 ${isOk ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-red-500 dark:bg-red-600'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                   </div>
                   {!isOk && (
                      <div className="text-[10px] text-red-500 dark:text-red-400 mt-1 text-right font-medium flex justify-end items-center gap-1">
                        <AlertTriangle size={10} />
                        {isLow ? `低于最小值` : `高于最大值`}
                      </div>
                   )}
                 </div>
               )
             })}
             {indicators.length === 0 && <div className="text-xs text-slate-400 pl-2">暂无指标</div>}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Loading Overlay Component ---
const LoadingOverlay: React.FC<{ message?: string }> = ({ message = "计算中..." }) => {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
      <div className="relative">
        {/* 外圈旋转 */}
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
        {/* 内圈图标 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Calculator size={24} className="text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">正在寻找最优解...</p>
    </div>
  );
};


// --- Main View ---

const CalculationView: React.FC<Props> = ({ 
  materials, 
  indicators,
  savedRatios,
  savedResult,
  onSaveRatios,
  onSaveResult
}) => {
  // Initialize ratios using saved state merged with current materials
  const [ratios, setRatios] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    materials.forEach(m => {
      initial[m.id] = (savedRatios && savedRatios[m.id] !== undefined) ? savedRatios[m.id] : 0;
    });
    return initial;
  });

  const [optResult, setOptResult] = useState<OptimizationResult | null>(savedResult || null);
  
  // 新增：计算中状态
  const [isCalculating, setIsCalculating] = useState(false);

  const handleRatioChange = (id: string, val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    const newRatios = { ...ratios, [id]: clamped };
    setRatios(newRatios);
    onSaveRatios(newRatios);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // 模拟一点延迟让用户看到加载动画（实际计算很快）
    // 同时使用 setTimeout 将计算放到下一个事件循环，确保 UI 更新
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const res = calculateOptimalMix(materials, indicators);
      setOptResult(res);
      onSaveResult(res);
    } finally {
      setIsCalculating(false);
    }
  };

  const applyOptimalToManual = () => {
    if (optResult && optResult.success) {
      setRatios(optResult.ratios);
      onSaveRatios(optResult.ratios);
    }
  };

  const manualMetrics = useMemo(() => 
    calculateMetrics(materials, indicators, ratios), 
  [materials, indicators, ratios]);

  const optimizedMetrics = useMemo(() => {
    if (optResult && optResult.success) {
      return calculateMetrics(materials, indicators, optResult.ratios);
    }
    return null;
  }, [optResult, materials, indicators]);

  const manualTotalPercentage = Object.values(ratios).reduce((a, b) => a + b, 0);
  const isValidTotal = Math.abs(manualTotalPercentage - 100) < 0.1;

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-4">
        <AlertTriangle size={48} className="opacity-20" />
        <p>请先在配置页面添加货物。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full content-start">
      
      {/* 1. Smart Calculation Panel */}
      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 lg:h-full h-auto overflow-hidden relative">
        {/* Loading Overlay */}
        {isCalculating && <LoadingOverlay />}
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Calculator size={20} className="text-blue-600 dark:text-blue-400" /> 
            智能计算
          </h3>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isCalculating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {isCalculating ? '计算中...' : '计算最优解'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 relative">
          {!optResult ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3 min-h-[200px]">
               <Calculator size={48} className="opacity-10" />
               <p className="text-sm">点击右上角按钮开始计算</p>
            </div>
          ) : !optResult.success ? (
             <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-center gap-2 text-center mt-10">
               <AlertTriangle size={24} />
               <p>{optResult.message}</p>
             </div>
          ) : optimizedMetrics && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  基于 <span className="font-bold text-slate-700 dark:text-slate-200">{indicators.length}</span> 个指标约束找到的最优解
                </div>
                <button 
                  onClick={applyOptimalToManual}
                  className="text-xs border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  应用到手动 <ArrowRight size={12} />
                </button>
              </div>
              
              <ResultMetricsDisplay 
                metrics={optimizedMetrics} 
                materials={materials} 
                indicators={indicators} 
                showCompositionList={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Manual Adjustment Panel */}
      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 lg:h-full h-auto overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
             <Sliders size={20} className="text-emerald-600 dark:text-emerald-500" /> 手动配比
          </h3>
          <div className={`text-xs font-mono font-medium px-2 py-1 rounded border ${isValidTotal ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800'}`}>
             Total: {manualTotalPercentage.toFixed(2)}%
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Sliders Section */}
          <div className="space-y-4 mb-8">
             {materials.map(m => (
               <div key={m.id}>
                  <div className="flex justify-between mb-1.5 items-end">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.name}</label>
                    <div className="flex items-center gap-2 text-xs relative">
                      <span className="text-slate-400 dark:text-slate-500">¥{m.price}</span>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={ratios[m.id] === undefined ? '' : ratios[m.id]}
                          onChange={e => handleRatioChange(m.id, parseFloat(e.target.value) || 0)}
                          onBlur={e => {
                             if(e.target.value === '') handleRatioChange(m.id, 0);
                          }}
                          className="font-bold font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-600 px-1.5 py-0.5 rounded w-16 text-right border border-transparent hover:border-slate-300 dark:hover:border-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                        <span className="absolute right-6 pointer-events-none text-slate-400 opacity-0"></span> 
                        <span className="ml-1 text-slate-500 dark:text-slate-400 font-medium">%</span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={ratios[m.id] || 0}
                    onChange={e => handleRatioChange(m.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
               </div>
             ))}
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-700 my-6"></div>

          {/* Results Section */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400 dark:text-slate-500" /> 实时分析
            </h4>
            <ResultMetricsDisplay 
              metrics={manualMetrics} 
              materials={materials} 
              indicators={indicators} 
              showCompositionList={false}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default CalculationView;
