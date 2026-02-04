
import React, { useState } from 'react';
import { Indicator, Material, OptimizationResult } from '@/types';
import { calculateOptimalMix } from '@/services/solver';
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
                  label={({ name, value }) => `${name} ${value}%`}
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-700">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">指标验证</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {actualIndicators.map(ind => {
              const isLow = ind.actual < ind.min;
              const isHigh = ind.actual > ind.max;
              const isOk = !isLow && !isHigh;

              // 计算差值
              let diff = 0;
              let diffLabel = '';
              if (isLow) {
                diff = ind.min - ind.actual;
                diffLabel = `距最小值 -${diff.toFixed(2)}`;
              } else if (isHigh) {
                diff = ind.actual - ind.max;
                diffLabel = `超最大值 +${diff.toFixed(2)}`;
              } else {
                // 显示距离边界的余量（取较小值）
                const marginToMin = ind.actual - ind.min;
                const marginToMax = ind.max - ind.actual;
                diff = Math.min(marginToMin, marginToMax);
                diffLabel = `余量 ${diff.toFixed(2)}`;
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
                    {ind.actual.toFixed(2)}
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
              );
            })}
          </div>
          {actualIndicators.length === 0 && (
            <div className="text-slate-400 dark:text-slate-500 text-center text-sm py-4">暂无指标</div>
          )}
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
