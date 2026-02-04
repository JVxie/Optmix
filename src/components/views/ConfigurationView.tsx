
import React from 'react';
import IndicatorManager from '@/components/views/IndicatorManager';
import MaterialManager from '@/components/views/MaterialManager';
import { Indicator, Material } from '@/types';

interface Props {
  indicators: Indicator[];
  materials: Material[];
  onIndicatorsChange: (inds: Indicator[]) => void;
  onMaterialsChange: (mats: Material[]) => void;
}

const ConfigurationView: React.FC<Props> = ({ indicators, materials, onIndicatorsChange, onMaterialsChange }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-l-4 border-blue-600 dark:border-blue-500 pl-3 mb-4">指标管理</h2>
        <div className="flex-1">
          <IndicatorManager indicators={indicators} onChange={onIndicatorsChange} />
        </div>
      </div>
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-l-4 border-emerald-600 dark:border-emerald-500 pl-3 mb-4">货物管理</h2>
        <div className="flex-1">
          <MaterialManager materials={materials} indicators={indicators} onChange={onMaterialsChange} />
        </div>
      </div>
    </div>
  );
};
export default ConfigurationView;
