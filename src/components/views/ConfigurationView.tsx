
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IndicatorManager from '@/components/views/IndicatorManager';
import MaterialManager from '@/components/views/MaterialManager';
import { Indicator, Material } from '@/types';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { Ruler, Package } from 'lucide-react';

interface Props {
  indicators: Indicator[];
  materials: Material[];
  onIndicatorsChange: (inds: Indicator[]) => void;
  onMaterialsChange: (mats: Material[]) => void;
}

type ConfigTab = 'indicators' | 'materials';

const ConfigurationView: React.FC<Props> = ({ indicators, materials, onIndicatorsChange, onMaterialsChange }) => {
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('indicators');

  // PC 端：保持原有双栏布局
  if (isDesktop) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-l-4 border-blue-600 dark:border-blue-500 pl-3 mb-4">{t('config.indicatorManager')}</h2>
          <div className="flex-1">
            <IndicatorManager indicators={indicators} onChange={onIndicatorsChange} />
          </div>
        </div>
        <div className="flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-l-4 border-emerald-600 dark:border-emerald-500 pl-3 mb-4">{t('config.materialManager')}</h2>
          <div className="flex-1">
            <MaterialManager materials={materials} indicators={indicators} onChange={onMaterialsChange} />
          </div>
        </div>
      </div>
    );
  }

  // 移动端：Segmented Control 切换
  return (
    <div className="flex flex-col h-full">
      {/* Segmented Control */}
      <div className="bg-slate-200/70 dark:bg-slate-700/70 p-1 rounded-xl flex mb-4 shrink-0">
        <button
          onClick={() => setActiveConfigTab('indicators')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            active:scale-[0.98] transform
            ${activeConfigTab === 'indicators'
              ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400'}
          `}
        >
          <Ruler size={16} />
          {t('config.indicatorManager')}
        </button>
        <button
          onClick={() => setActiveConfigTab('materials')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            active:scale-[0.98] transform
            ${activeConfigTab === 'materials'
              ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400'}
          `}
        >
          <Package size={16} />
          {t('config.materialManager')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeConfigTab === 'indicators' ? (
          <IndicatorManager indicators={indicators} onChange={onIndicatorsChange} />
        ) : (
          <MaterialManager materials={materials} indicators={indicators} onChange={onMaterialsChange} />
        )}
      </div>
    </div>
  );
};
export default ConfigurationView;
