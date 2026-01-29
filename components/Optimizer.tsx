
import React, { useState } from 'react';
import { Indicator, Material, OptimizationResult } from '../types';
import { calculateOptimalMix } from '../services/solver';
import { Calculator, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  materials: Material[];
  indicators: Indicator[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Optimizer: React.FC<Props> = ({ materials, indicators }) => {
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleCalculate = () => {
    const res = calculateOptimalMix(materials, indicators);
    setResult(res);
  };

  const calculateActualIndicators = (ratios: Record<string, number>) => {
    return indicators.map(ind => {
      let sum = 0;
      let totalPct = 0;
      materials.forEach(m => {
        const ratio = ratios[m.id] || 0;
        sum += (ratio / 100) * (m.indicatorValues[ind.id] || 0);
        totalPct += ratio;
      });
      // Normalize if totalPct is close to 100 but floating point off
      return { ...ind, actual: sum };
    });
  };

  const renderResult = () => {
    if (!result) return null;

    if (!result.success) {
      return (
        <div className="mt-6 p-6 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-red-100 p-3 rounded-full mb-3 text-red-600">
            <XCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">计算失败</h3>
          <p className="text-red-600">{result.message}</p>
        </div>
      );
    }

    // Prepare chart data
    const chartData = materials
      .map(m => ({ name: m.name, value: parseFloat((result.ratios[m.id] || 0).toFixed(2)) }))
      .filter(d => d.value > 0);
    
    const actualIndicators = calculateActualIndicators(result.ratios);

    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Result Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="text-green-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800">最优配比方案</h3>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
             <span className="text-blue-800 font-medium">最低单价</span>
             <span className="text-2xl font-bold text-blue-700">¥{result.cost.toFixed(2)}<span className="text-sm font-normal text-blue-600">/吨</span></span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, value}) => `${name} ${value}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-slate-700">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-xl font-bold text-slate-800 mb-6">指标验证</h3>
           <div className="space-y-4">
             {actualIndicators.map(ind => {
               const isOk = ind.actual >= ind.min && ind.actual <= ind.max;
               return (
                 <div key={ind.id} className="relative pt-1">
                   <div className="flex mb-1 items-center justify-between">
                     <div>
                       <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isOk ? 'text-green-600 bg-green-200' : 'text-red-600 bg-red-200'}`}>
                         {ind.name} ({ind.unit})
                       </span>
                     </div>
                     <div className="text-right">
                       <span className={`text-xs font-semibold inline-block ${isOk ? 'text-green-600' : 'text-red-600'}`}>
                         {ind.actual.toFixed(2)}
                       </span>
                       <span className="text-xs text-slate-400 ml-1">
                          [{ind.min} - {ind.max}]
                       </span>
                     </div>
                   </div>
                   <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100 relative">
                      {/* Range Marker */}
                      <div 
                        style={{ left: '0%', width: '100%' }} 
                        className="absolute h-full bg-slate-200"
                      ></div>
                       {/* Min/Max zone visual could be complex, simple progress bar for value */}
                      <div 
                        style={{ width: `${Math.min(100, Math.max(0, (ind.actual / (ind.max * 1.5)) * 100))}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isOk ? 'bg-green-500' : 'bg-red-500'}`}
                      ></div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">智能最优配比计算</h2>
        <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
          系统将根据当前方案设定的指标范围（最大值/最小值）以及所有可用货物的属性，自动计算出成本最低的混合配方。
        </p>
        <button
          onClick={handleCalculate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-indigo-200 transform transition-all hover:-translate-y-1 flex items-center gap-2 mx-auto"
        >
          {result ? <RefreshCw size={20} /> : <Calculator size={20} />}
          {result ? '重新计算' : '开始计算'}
        </button>
      </div>

      {renderResult()}
    </div>
  );
};

export default Optimizer;
